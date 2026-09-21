"""Refresh public statutory texts; no case data or model answers enter this cache."""
import concurrent.futures
import datetime
import hashlib
import json
import pathlib
import re
import urllib.request
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]
TARGET = ROOT / 'supabase/functions/_shared/primarySourceCache.mjs'
PROVISIONS = {
    'estg': ['19', '22', '25', '32a', '34', '46'],
    'sgb_5': ['226', '229', '237', '248'],
    'sgb_6': ['48'],
    'sgb_11': ['55', '57'],
    'sgg': ['84', '86a'],
    'sgb_10': ['37'],
    'bgb': ['195', '199', '1629', '1640', '1642', '1643', '1648', '1680', '2303', '2314'],
    'ao_1977': ['108', '149', '355'],
}

class Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.ignored, self.title, self.in_title = [], 0, [], False
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'): self.ignored += 1
        if tag == 'title': self.in_title = True
    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self.ignored = max(0, self.ignored - 1)
        if tag == 'title': self.in_title = False
    def handle_data(self, data):
        if not self.ignored: self.parts.append(data)
        if self.in_title: self.title.append(data)

def fetch(pair):
    act, section = pair
    url = f'https://www.gesetze-im-internet.de/{act}/__{section}.html'
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'ASHWorkspaceGold/1.0 (public statutory text refresh)', 'Accept': 'text/html'})
        with urllib.request.urlopen(request, timeout=18) as response:
            if response.status != 200 or response.url != url: return None
            data = response.read(1500001)
            if len(data) > 1500000: return None
            head = data[:4096].decode('latin-1')
            declared = re.search(r'charset\s*=\s*["\']?([\w-]+)', response.headers.get('content-type', '') + ' ' + head, re.I)
            encoding = declared.group(1) if declared else 'utf-8'
            parser = Text(); parser.feed(data.decode(encoding))
        text = re.sub(r'\s+', ' ', ' '.join(parser.parts)).strip()
        title = ' '.join(parser.title).strip()
        if len(text) < 100 or not re.search(r'§\s*' + re.escape(section) + r'\b', text) or re.search('verifying your browser|security check|access denied', title, re.I): return None
        return {'url': url, 'final_url': url, 'title': title, 'source_text': text,
                'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'content_sha256': hashlib.sha256(text.encode()).hexdigest(), 'truncated': False,
                'retrieval_mode': 'verified_snapshot'}
    except Exception:
        return None

def main():
    old = []
    if TARGET.exists():
        old = json.loads(TARGET.read_text().split('export const PRIMARY_SOURCE_CACHE=', 1)[1].rstrip().removesuffix(';'))
    records = {item['url']: item for item in old}
    pairs = [(act, section) for act, sections in PROVISIONS.items() for section in sections]
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        refreshed = [item for item in pool.map(fetch, pairs) if item]
    if len(refreshed) < len(pairs) // 2:
        raise SystemExit('Refresh incomplete; existing snapshot dates remain unchanged.')
    records.update({item['url']: item for item in refreshed})
    TARGET.write_text('// Public original statutory texts. Refreshed independently; never a case answer.\nexport const PRIMARY_SOURCE_CACHE=' + json.dumps(list(records.values()), ensure_ascii=False, separators=(',', ':')) + ';\n')
    TARGET.with_suffix('.json').write_text(json.dumps(list(records.values()), ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'Refreshed {len(refreshed)}/{len(pairs)} public provisions. Failed fetches never receive a new date.')

if __name__ == '__main__': main()
