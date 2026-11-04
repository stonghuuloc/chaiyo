import importlib.util
import io
import json
import shutil
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
FIXTURE = HERE / 'fixtures' / 'kaishu' / 'abc123'

spec = importlib.util.spec_from_file_location('kaishu', HERE / 'build-kaishu-subsets.py')
kaishu = importlib.util.module_from_spec(spec)
spec.loader.exec_module(kaishu)

H101 = set('你好对不起没关系谢气客再见您们') | set('亻。！')
H000 = set(json.loads((FIXTURE / 'h0-00.json').read_text(encoding='utf-8'))['hanzi']) | set('、，')


def cmap_of(path):
    return {chr(cp) for cp in TTFont(str(path)).getBestCmap()}


class GlyphSetTests(unittest.TestCase):
    def test_Given_Bundle_When_GlyphSet_Then_HanAndMarksInHanStringsOnly(self):
        bundle = json.loads((FIXTURE / 'h1-01.json').read_text(encoding='utf-8'))
        self.assertEqual(kaishu.glyph_set(bundle), H101)
        self.assertEqual(len(H101), 18)

    def test_Given_MarksWithoutHan_Then_Ignored(self):
        self.assertEqual(kaishu.glyph_set({'vi': 'Chào!', 'note': '（ghi chú）', 'a': ['abc', 3]}), set())

    def test_Given_RadicalComponents_Then_Included(self):
        self.assertEqual(kaishu.glyph_set({'components': ['⺌', '⻊']}), {'⺌', '⻊'})
        self.assertEqual(kaishu.glyph_set({'c': '𰀀'}), {'𰀀'})

    def test_Given_Keys_Then_Ignored(self):
        self.assertEqual(kaishu.glyph_set({'你': 'x'}), set())


class BuildTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.out = Path(tempfile.mkdtemp())
        with redirect_stdout(io.StringIO()):
            kaishu.build(FIXTURE, cls.out, '2026-11-03')

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.out)

    def test_Given_TwoLessons_When_Build_Then_TwoFilesWithExactCmaps(self):
        self.assertEqual(sorted(p.name for p in self.out.iterdir()), ['ukai-h0-00.woff2', 'ukai-h1-01.woff2'])
        self.assertEqual(cmap_of(self.out / 'ukai-h1-01.woff2'), H101)
        self.assertEqual(cmap_of(self.out / 'ukai-h0-00.woff2'), H000)

    def test_Given_Output_Then_RealWoff2(self):
        data = (self.out / 'ukai-h1-01.woff2').read_bytes()
        self.assertEqual(data[:4], b'wOF2')
        self.assertLess(abs(len(data) - 5476) / 5476, 0.10)

    def test_Given_Output_Then_NoGlyphIsNotdef(self):
        font = TTFont(str(self.out / 'ukai-h1-01.woff2'))
        for cp, name in font.getBestCmap().items():
            if chr(cp) in '。！':
                continue
            self.assertNotEqual(name, '.notdef')
            self.assertNotEqual(font['glyf'][name].numberOfContours, 0, chr(cp))

    def test_Given_Date_Then_NoticeInNameId10(self):
        font = TTFont(str(self.out / 'ukai-h1-01.woff2'))
        self.assertIn('Modified by chaiyo on 2026-11-03', font['name'].getDebugName(10))

    def test_Given_CharMissingInFace0_Then_ErrorAndNothingWritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            bundle = Path(tmp) / 'bundle'
            shutil.copytree(FIXTURE, bundle)
            p = bundle / 'h1-01.json'
            p.write_text(json.dumps({'bad': '你𠀀'}, ensure_ascii=False), encoding='utf-8')
            fonts = Path(tmp) / 'fonts'
            with self.assertRaises(SystemExit) as cm:
                kaishu.build(bundle, fonts, '2026-11-03')
            self.assertIn('h1-01', str(cm.exception))
            self.assertIn('U+20000', str(cm.exception))
            self.assertFalse(fonts.exists() and any(fonts.iterdir()))


class RebuildTests(unittest.TestCase):
    def test_Given_NewCharAdded_When_Rebuild_Then_FontHasIt(self):
        with tempfile.TemporaryDirectory() as tmp:
            bundle, fonts = Path(tmp) / 'bundle', Path(tmp) / 'fonts'
            shutil.copytree(FIXTURE, bundle)
            with redirect_stdout(io.StringIO()):
                kaishu.build(bundle, fonts, '2026-11-03')
            before = cmap_of(fonts / 'ukai-h1-01.woff2')
            other = cmap_of(fonts / 'ukai-h0-00.woff2')
            self.assertNotIn('新', before)
            p = bundle / 'h1-01.json'
            data = json.loads(p.read_text(encoding='utf-8'))
            data['sentences'].append({'hanzi': '新！'})
            p.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
            with redirect_stdout(io.StringIO()):
                kaishu.build(bundle, fonts, '2026-11-03')
            after = cmap_of(fonts / 'ukai-h1-01.woff2')
            self.assertIn('新', after)
            self.assertEqual(len(after), 19)
            self.assertEqual(cmap_of(fonts / 'ukai-h0-00.woff2'), other)


if __name__ == '__main__':
    unittest.main()
