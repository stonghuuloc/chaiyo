import bz2, importlib.util, shutil
from pathlib import Path

import pytest

HERE = Path(__file__).parent


@pytest.fixture
def gen(tmp_path, monkeypatch):
    spec = importlib.util.spec_from_file_location('gen_entries', HERE.parent / 'gen-entries.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    monkeypatch.setattr(mod, 'CACHE', tmp_path / 'cache')
    return mod


@pytest.fixture
def seeded(gen):
    gen.CACHE.mkdir(parents=True)
    src = HERE / 'fixtures/cache'
    shutil.copy(src / 'complete.min.json', gen.CACHE)
    for f in src.glob('*.tsv'):
        (gen.CACHE / (f.name + '.bz2')).write_bytes(bz2.compress(f.read_bytes()))
    return gen.CACHE
