"""Refresh public statutory texts; no case data or model answers enter this cache."""
import argparse
import concurrent.futures
import datetime
import hashlib
import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]
TARGET = ROOT / 'supabase/functions/_shared/primarySourceCache.mjs'
PROVISIONS = {
    'estg': ['19', '22', '25', '32a', '34', '46'],
    'sgb_5': ['226', '229', '237', '248'],
    'sgb_6': ['48'],
    'sgb_11': ['55', '57'],
    'pbav_2025': ['1', '2'],
    'sgg': ['84', '86a'],
    'sgb_10': ['37'],
    'bgb': ['126', '126b', '127', '133', '157', '195', '199', '286', '288',
            '311', '362', '366', '631', '632', '640', '641', '677', '683',
            '684', '812', '818', '1629', '1640', '1642', '1643', '1648',
            '1680', '2303', '2314'],
    'ao_1977': ['108', '149', '355'],
}

class Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.ignored, self.title, self.in_title = [], 0, [], False
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'): self.ignored += 1
        if tag == 'title': self.in_title = True
        # Match live extraction: retain actual rows/cells instead of guessing
        # whether adjacent three-digit values form a thousands-grouped number.
        if not self.ignored and tag == 'tr': self.parts.append(' ; ')
        if not self.ignored and tag in ('td', 'th'): self.parts.append(' | ')
    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self.ignored = max(0, self.ignored - 1)
        if tag == 'title': self.in_title = False
        if not self.ignored and tag == 'table': self.parts.append(' ; ')
    def handle_data(self, data):
        if not self.ignored: self.parts.append(data)
        if self.in_title: self.title.append(data)

def fetch(pair):
    act, section = pair
    url = f'https://www.gesetze-im-internet.de/{act}/__{section}.html'
    def unavailable(reason):
        print(f'Primary text unavailable: {url}: {reason}', file=sys.stderr, flush=True)
        return None
    for attempt in range(3):
        try:
            return fetch_once(url, section)
        except Exception as error:
            retryable = (error.code in (408, 500, 502, 503, 504)
                         if isinstance(error, urllib.error.HTTPError)
                         else isinstance(error, (urllib.error.URLError, TimeoutError, ConnectionError)))
            if retryable and attempt < 2:
                delay = (2, 5)[attempt]
                print(f'Retrying public source ({attempt + 2}/3) after {type(error).__name__}: {url}', file=sys.stderr, flush=True)
                time.sleep(delay)
                continue
            return unavailable(f'{type(error).__name__}: {str(error)[:180]}')

def fetch_once(url, section):
    def unavailable(reason):
        print(f'Primary text unavailable: {url}: {reason}', file=sys.stderr, flush=True)
        return None
    # Retrieval/validation failures never acquire a new checked_at date.
    request = urllib.request.Request(url, headers={'User-Agent': 'ASHWorkspaceGold/1.0 (public statutory text refresh)', 'Accept': 'text/html'})
    with urllib.request.urlopen(request, timeout=18) as response:
        if response.status != 200 or response.url != url:
            return unavailable(f'HTTP {response.status} or unexpected redirect')
        data = response.read(1500001)
        if len(data) > 1500000: return unavailable('response exceeds byte limit')
        head = data[:4096].decode('latin-1')
        declared = re.search(r'charset\s*=\s*["\']?([\w-]+)', response.headers.get('content-type', '') + ' ' + head, re.I)
        encoding = declared.group(1) if declared else 'utf-8'
        parser = Text(); parser.feed(data.decode(encoding))
    text = re.sub(r'\s+', ' ', ' '.join(parser.parts)).strip()
    title = ' '.join(parser.title).strip()
    provision_pattern = r'§\s*' + re.escape(section) + r'\b'
    if (len(text) < 100
            or not re.search(provision_pattern, text)
            or not re.search(provision_pattern, title)
            or re.search('verifying your browser|security check|access denied', title, re.I)):
        return unavailable('expected readable provision not found')
    return {'url': url, 'final_url': url, 'title': title, 'source_text': text,
            'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'content_sha256': hashlib.sha256(text.encode()).hexdigest(), 'truncated': False,
            'retrieval_mode': 'verified_snapshot'}

def catalogue_is_current(now=None):
    """Skip redundant runs only for two identical, complete, verified daily files."""
    now = now or datetime.datetime.now(datetime.timezone.utc)
    try:
        records = json.loads(TARGET.read_text(encoding='utf-8').split('export const PRIMARY_SOURCE_CACHE=', 1)[1].rstrip().removesuffix(';'))
        if records != json.loads(TARGET.with_suffix('.json').read_text(encoding='utf-8')):
            return False
        expected = {f'https://www.gesetze-im-internet.de/{act}/__{section}.html': section
                    for act, sections in PROVISIONS.items() for section in sections}
        if not isinstance(records, list) or len(records) != len(expected):
            return False
        if {item['url'] for item in records} != set(expected):
            return False
        for item in records:
            text, url = item['source_text'], item['url']
            checked = datetime.datetime.fromisoformat(item['checked_at'].replace('Z', '+00:00'))
            provision = r'§\s*' + re.escape(expected[url]) + r'\b'
            if (checked.tzinfo is None or checked > now
                    or checked.astimezone(datetime.timezone.utc).date() != now.astimezone(datetime.timezone.utc).date()
                    or item['final_url'] != url or item['truncated'] is not False
                    or item['retrieval_mode'] != 'verified_snapshot'
                    or len(text) < 100 or not re.search(provision, text)
                    or not re.search(provision, item['title'])
                    or re.search('verifying your browser|security check|access denied', item['title'], re.I)
                    or hashlib.sha256(text.encode()).hexdigest() != item['content_sha256']):
                return False
        return True
    except (OSError, ValueError, TypeError, KeyError, IndexError, AttributeError):
        return False

def main(only_if_stale=False):
    pairs = [(act, section) for act, sections in PROVISIONS.items() for section in sections]
    if only_if_stale and catalogue_is_current():
        print(f'All {len(pairs)} public provisions already verified for today (UTC); no fetch or date change.')
        return
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        refreshed = [item for item in pool.map(fetch, pairs) if item]
    if len(refreshed) != len(pairs):
        raise SystemExit(f'Refresh incomplete ({len(refreshed)}/{len(pairs)}); existing snapshot dates remain unchanged.')
    payload = json.dumps(refreshed, ensure_ascii=False, separators=(',', ':'))
    TARGET.write_text('// Public original statutory texts. Refreshed independently; never a case answer.\nexport const PRIMARY_SOURCE_CACHE=' + payload + ';\n', encoding='utf-8')
    TARGET.with_suffix('.json').write_text(payload + '\n', encoding='utf-8')
    print(f'Refreshed {len(refreshed)}/{len(pairs)} public provisions. Failed fetches never receive a new date.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--if-stale', action='store_true', help='Skip a fully verified UTC-day catalogue without network calls or date changes.')
    main(only_if_stale=parser.parse_args().if_stale)
