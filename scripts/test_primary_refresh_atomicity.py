"""A partial daily fetch must never be published as a complete refresh."""
import contextlib
import copy
import datetime
import hashlib
import importlib.util
import io
import json
import pathlib
import tempfile
import unittest
import urllib.error
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('refresh',pathlib.Path(__file__).with_name('refresh_primary_sources.py'))
refresh=importlib.util.module_from_spec(spec)
spec.loader.exec_module(refresh)

class RefreshTests(unittest.TestCase):
    def record(self, section='631', checked='2026-10-09T06:00:00+00:00'):
        text=f'§ {section} BGB. ' + 'Synthetic source fixture. ' * 10
        url=f'https://www.gesetze-im-internet.de/bgb/__{section}.html'
        return {'url':url,'final_url':url,'title':f'§ {section} BGB',
                'source_text':text,'content_sha256':hashlib.sha256(text.encode()).hexdigest(),
                'checked_at':checked,'truncated':False,'retrieval_mode':'verified_snapshot'}

    def write_catalogue(self, target, records):
        payload=json.dumps(records,ensure_ascii=False)
        target.write_text('export const PRIMARY_SOURCE_CACHE='+payload+';\n',encoding='utf-8')
        target.with_suffix('.json').write_text(payload+'\n',encoding='utf-8')

    def test_current_catalogue_skips_all_network_and_preserves_dates(self):
        now=datetime.datetime(2026,10,9,7,tzinfo=datetime.timezone.utc)
        actual_check=refresh.catalogue_is_current
        with tempfile.TemporaryDirectory() as folder:
            target=pathlib.Path(folder)/'cache.mjs'
            self.write_catalogue(target,[self.record()])
            before=[target.read_bytes(),target.with_suffix('.json').read_bytes()]
            with patch.object(refresh,'TARGET',target),patch.object(refresh,'PROVISIONS',{'bgb':['631']}),patch.object(refresh,'fetch') as fetch,patch.object(refresh,'catalogue_is_current',side_effect=lambda:actual_check(now)),contextlib.redirect_stdout(io.StringIO()):
                refresh.main(only_if_stale=True)
                fetch.assert_not_called()
            self.assertEqual(before,[target.read_bytes(),target.with_suffix('.json').read_bytes()])

    def test_stale_invalid_or_mismatched_catalogue_never_skips(self):
        now=datetime.datetime(2026,10,9,7,tzinfo=datetime.timezone.utc)
        original=[self.record(),self.record('632')]
        with tempfile.TemporaryDirectory() as folder:
            target=pathlib.Path(folder)/'cache.mjs'
            with patch.object(refresh,'TARGET',target),patch.object(refresh,'PROVISIONS',{'bgb':['631','632']}):
                self.write_catalogue(target,original)
                self.assertTrue(refresh.catalogue_is_current(now))
                for key,value in [('checked_at','2026-10-08T06:00:00+00:00'),('checked_at','2026-10-09T08:00:00+00:00'),('checked_at','2026-10-09T06:00:00'),('checked_at','2026-10-09T00:30:00+02:00'),('content_sha256','0'*64),('source_text','tampered'),('final_url','https://example.invalid'),('truncated',True),('retrieval_mode','unverified'),('title','Security check § 631 BGB')]:
                    with self.subTest(key=key,value=value):
                        records=copy.deepcopy(original);records[0][key]=value
                        self.write_catalogue(target,records)
                        self.assertFalse(refresh.catalogue_is_current(now))
                for records in [original[:1],original+[original[0]],[original[0],original[0]]]:
                    self.write_catalogue(target,records)
                    self.assertFalse(refresh.catalogue_is_current(now))
                self.write_catalogue(target,original)
                target.with_suffix('.json').write_text('[]\n')
                self.assertFalse(refresh.catalogue_is_current(now))
                target.write_text('broken')
                self.assertFalse(refresh.catalogue_is_current(now))

    def test_stale_catalogue_is_actually_refreshed(self):
        old=self.record(checked='2000-01-01T00:00:00+00:00')
        fresh=self.record(checked=datetime.datetime.now(datetime.timezone.utc).isoformat())
        with tempfile.TemporaryDirectory() as folder:
            target=pathlib.Path(folder)/'cache.mjs'
            self.write_catalogue(target,[old])
            with patch.object(refresh,'TARGET',target),patch.object(refresh,'PROVISIONS',{'bgb':['631']}),patch.object(refresh,'fetch',return_value=fresh) as fetch,contextlib.redirect_stdout(io.StringIO()):
                refresh.main(only_if_stale=True)
                fetch.assert_called_once_with(('bgb','631'))
            self.assertEqual(json.loads(target.with_suffix('.json').read_text()),[fresh])

    def test_transient_connection_is_retried_then_validated(self):
        record=self.record()
        class Response:
            status=200
            url=record['url']
            headers={'content-type':'text/html; charset=utf-8'}
            def __enter__(self): return self
            def __exit__(self,*args): pass
            def read(self,limit): return ('<title>'+record['title']+'</title><p>'+record['source_text']+'</p>').encode()
        with patch.object(refresh.urllib.request,'urlopen',side_effect=[TimeoutError('synthetic timeout'),Response()]) as request,patch.object(refresh.time,'sleep') as sleep,contextlib.redirect_stderr(io.StringIO()):
            result=refresh.fetch(('bgb','631'))
        self.assertEqual(request.call_count,2)
        sleep.assert_called_once_with(2)
        self.assertEqual(result['url'],record['url'])
        self.assertEqual(result['content_sha256'],hashlib.sha256(result['source_text'].encode()).hexdigest())

    def test_retry_is_bounded_and_access_denied_is_not_retried(self):
        for code,attempts in [(503,3),(403,1),(404,1)]:
            with self.subTest(code=code):
                error=urllib.error.HTTPError('https://www.gesetze-im-internet.de/bgb/__631.html',code,'Synthetic response',{},None)
                with patch.object(refresh.urllib.request,'urlopen',side_effect=error) as request,patch.object(refresh.time,'sleep') as sleep,contextlib.redirect_stderr(io.StringIO()):
                    self.assertIsNone(refresh.fetch(('bgb','631')))
                self.assertEqual(request.call_count,attempts)
                self.assertEqual(sleep.call_count,attempts-1)

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

    def test_unreachable_host_stops_before_fetching_all_fifty_sources(self):
        with tempfile.TemporaryDirectory() as folder:
            target=pathlib.Path(folder)/'cache.mjs'
            self.write_catalogue(target,[self.record(checked='2000-01-01T00:00:00+00:00')])
            before=[target.read_bytes(),target.with_suffix('.json').read_bytes()]
            with patch.object(refresh,'TARGET',target),patch.object(refresh,'fetch',return_value=None) as fetch:
                with self.assertRaisesRegex(SystemExit,'cannot currently be fetched'):
                    refresh.main(only_if_stale=True)
                fetch.assert_called_once()
            self.assertEqual(before,[target.read_bytes(),target.with_suffix('.json').read_bytes()])

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
