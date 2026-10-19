#!/usr/bin/env python3
"""Bounded offline verification. No providers, credentials, deployments or retry loop."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
CHECKS = [
    'scripts/test_complete_case.mjs',
    'scripts/test_background_case.mjs',
    'scripts/test_background_worker_http.mjs',
    'scripts/test_case_result_access.mjs',
    'scripts/test_pdf_text_exports.mjs',
]

def source_hash():
    paths = sorted(p for base in ['supabase', 'app', 'scripts'] for p in (ROOT / base).rglob('*')
                   if p.is_file() and 'node_modules' not in p.parts and '__pycache__' not in p.parts)
    paths += [ROOT / p for p in ['package.json', 'package-lock.json'] if (ROOT / p).is_file()]
    digest = hashlib.sha256()
    for path in paths:
        digest.update(str(path.relative_to(ROOT)).encode() + b'\0' + path.read_bytes() + b'\0')
    return digest.hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--force', action='store_true', help='Explicitly repeat an unchanged successful suite once.')
    args = parser.parse_args()
    output = ROOT / '.ash-checks'
    output.mkdir(exist_ok=True)
    state = output / 'readiness.json'
    fingerprint = source_hash()
    if state.exists():
        prior = json.loads(state.read_text())
        if not args.force and prior.get('source_sha256') == fingerprint and prior.get('status') == 'passed':
            print('Unchanged verified source: skipped. No new tests or provider requests.')
            return 0
    result = {'source_sha256': fingerprint, 'started_at': datetime.now(timezone.utc).isoformat(),
              'mode': 'offline_controlled_replies', 'live_acceptance': False, 'checks': [], 'status': 'running'}
    # Do not pass API keys or production configuration into the test process.
    environment = {k: v for k, v in os.environ.items() if k in ['PATH', 'LANG', 'LC_ALL', 'TZ', 'TMPDIR', 'SystemRoot']}
    environment['NODE_ENV'] = 'test'
    state.write_text(json.dumps(result, indent=2) + '\n')
    try:
        for script in CHECKS:
            log = output / (Path(script).stem + '.log')
            print('Checking ' + script, flush=True)
            with log.open('w') as stream:
                guard = './scripts/offline/pdfTextOnly.mjs' if script.endswith('test_pdf_text_exports.mjs') else './scripts/offline/noNetwork.mjs'
                process = subprocess.run(['node', '--import', guard, script],
                                         cwd=ROOT, env=environment, stdout=stream, stderr=subprocess.STDOUT, timeout=180)
            result['checks'].append({'script': script, 'exit_code': process.returncode, 'log': str(log.relative_to(ROOT))})
            if process.returncode:
                result['status'] = 'failed'
                print(log.read_text()[-4000:], file=sys.stderr)
                break
        else:
            result['status'] = 'passed' if source_hash() == fingerprint else 'source_changed'
    except subprocess.TimeoutExpired:
        result['status'] = 'timeout'
    finally:
        result['finished_at'] = datetime.now(timezone.utc).isoformat()
        state.write_text(json.dumps(result, indent=2) + '\n')
    print('Offline verification: ' + result['status'] + '. Live AI acceptance remains separate.')
    return 0 if result['status'] == 'passed' else 1

if __name__ == '__main__':
    raise SystemExit(main())
