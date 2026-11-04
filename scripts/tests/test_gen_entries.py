import urllib.request
from pathlib import Path

import pytest

SCRIPT = Path(__file__).parent.parent / 'gen-entries.py'


def test_no_tmp_paths():
    text = SCRIPT.read_text()
    assert '/tmp' not in text
    assert '.omp' not in text


def test_missing_key_exits_2_before_download(gen, monkeypatch, capsys):
    monkeypatch.delenv('OPENCODE_API_KEY', raising=False)
    monkeypatch.setattr(gen, 'fetch', lambda name: pytest.fail('download attempted'))
    with pytest.raises(SystemExit) as e:
        gen.main(['打'])
    assert e.value.code == 2
    assert 'OPENCODE_API_KEY' in capsys.readouterr().err


def test_cache_hit_skips_download(gen, seeded, monkeypatch, capsys):
    def boom(*a, **k):
        raise AssertionError('network used')
    monkeypatch.setattr(urllib.request, 'urlopen', boom)
    for name in gen.SOURCES:
        assert gen.fetch(name) == seeded / name
    assert 'download' not in capsys.readouterr().out
    assert set(__import__('json').loads((seeded / 'manifest.json').read_text())) == set(gen.SOURCES)
