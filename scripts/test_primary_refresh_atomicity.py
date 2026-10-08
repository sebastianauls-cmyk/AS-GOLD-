"""A partial daily fetch must never be published as a complete refresh."""
import contextlib
import hashlib
import importlib.util
import io
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('refresh',pathlib.Path(__file__).with_name('refresh_primary_sources.py'))
refresh=importlib.util.module_from_spec(spec)
spec.loader.exec_module(refresh)

class RefreshTests(unittest.TestCase):
    def test_partial_fetch_preserves_both_existing_files(self):
        with tempfile.TemporaryDirectory() as folder:
            target=pathlib.Path(folder)/'cache.mjs'
            original='export const PRIMARY_SOURCE_CACHE=[];\n'
            target.write_text(original)
            target.with_suffix('.json').write_text('[]\n')
            with patch.object(refresh,'TARGET',target),patch.object(refresh,'PROVISIONS',{'bgb':['631','632']}),patch.object(refresh,'fetch',side_effect=[{'url':'https://example.invalid/631'},None]):
                with self.assertRaises(SystemExit): refresh.main()
            self.assertEqual(target.read_text(),original)
            self.assertEqual(target.with_suffix('.json').read_text(),'[]\n')

    def test_wrong_provision_title_is_rejected(self):
        class Response:
            status=200
            url='https://www.gesetze-im-internet.de/bgb/__631.html'
            headers={'content-type':'text/html; charset=utf-8'}
            def __enter__(self): return self
            def __exit__(self,*args): pass
            def read(self,limit): return ('<title>§ 632 BGB</title><p>§ 631 is referenced here, but this is a different provision. '+('Synthetic text. '*15)+'</p>').encode()
        with patch.object(refresh.urllib.request,'urlopen',return_value=Response()),contextlib.redirect_stderr(io.StringIO()):
            self.assertIsNone(refresh.fetch(('bgb','631')))

    def test_complete_refresh_publishes_identical_catalogues(self):
        text='Synthetic public-text fixture only.'
        record={'url':'https://example.invalid/631','source_text':text,'content_sha256':hashlib.sha256(text.encode()).hexdigest(),'checked_at':'2026-10-08T12:00:00+00:00'}
        with tempfile.TemporaryDirectory() as folder:
            target=pathlib.Path(folder)/'cache.mjs'
            with patch.object(refresh,'TARGET',target),patch.object(refresh,'PROVISIONS',{'bgb':['631']}),patch.object(refresh,'fetch',return_value=record),contextlib.redirect_stdout(io.StringIO()):
                refresh.main()
            module=json.loads(target.read_text().split('export const PRIMARY_SOURCE_CACHE=',1)[1].strip().removesuffix(';'))
            self.assertEqual(module,json.loads(target.with_suffix('.json').read_text()))
            self.assertEqual(module,[record])

if __name__=='__main__': unittest.main()
