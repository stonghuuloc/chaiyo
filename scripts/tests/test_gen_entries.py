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


def test_anthropic_provider_needs_its_own_key(gen, monkeypatch, capsys):
    # Arrange
    monkeypatch.setenv('GEN_PROVIDER', 'anthropic')
    monkeypatch.setenv('OPENCODE_API_KEY', 'x')
    monkeypatch.delenv('ANTHROPIC_API_KEY', raising=False)
    monkeypatch.setattr(gen, 'fetch', lambda name: pytest.fail('download attempted'))
    # Act
    with pytest.raises(SystemExit) as e:
        gen.main(['打'])
    # Assert
    assert e.value.code == 2
    assert 'ANTHROPIC_API_KEY' in capsys.readouterr().err


def test_anthropic_provider_routes_to_haiku_and_counts_usage(gen, monkeypatch):
    # Arrange
    from types import SimpleNamespace as NS
    sent = {}

    def create(**kw):
        sent.update(kw)
        return NS(stop_reason='end_turn', usage=NS(input_tokens=7, output_tokens=3),
                  content=[NS(type='thinking', thinking=''), NS(type='text', text='ok {"a": 1} tail')])
    monkeypatch.setenv('GEN_PROVIDER', 'anthropic')
    monkeypatch.setattr(gen, 'claude', lambda: NS(messages=NS(create=create)))
    monkeypatch.setattr(urllib.request, 'urlopen', lambda *a, **k: pytest.fail('opencode called'))
    monkeypatch.setattr(gen, 'USAGE', {'calls': 0, 'input': 0, 'output': 0})
    # Act
    out = gen.ask('hỏi')
    # Assert
    assert out == {'a': 1}
    assert sent['model'] == 'claude-haiku-5-5'
    assert sent['messages'] == [{'role': 'user', 'content': 'hỏi'}]
    assert gen.USAGE == {'calls': 1, 'input': 7, 'output': 3}


@pytest.mark.parametrize('stop', ['refusal', 'max_tokens'])
def test_anthropic_provider_raises_on_cut_off_answer(gen, monkeypatch, stop):
    # Arrange
    from types import SimpleNamespace as NS
    res = NS(stop_reason=stop, usage=NS(input_tokens=1, output_tokens=1), content=[NS(type='text', text='{"a": 1')])
    monkeypatch.setenv('GEN_PROVIDER', 'anthropic')
    monkeypatch.setattr(gen, 'claude', lambda: NS(messages=NS(create=lambda **kw: res)))
    # Act / Assert
    with pytest.raises(RuntimeError, match=stop):
        gen.ask('hỏi')


def test_claude_cli_provider_needs_no_key_and_parses_result(gen, monkeypatch):
    # Arrange
    import json, subprocess
    from types import SimpleNamespace as NS
    sent = {}

    def run(cmd, **kw):
        sent.update(cmd=cmd, input=kw['input'])
        out = {'is_error': False, 'subtype': 'success', 'result': '```json\n{"a": 1}\n```',
               'usage': {'input_tokens': 5, 'cache_read_input_tokens': 900, 'cache_creation_input_tokens': 0, 'output_tokens': 3}}
        return NS(returncode=0, stdout=json.dumps(out), stderr='')
    monkeypatch.setenv('GEN_PROVIDER', 'claude-cli')
    monkeypatch.setattr(subprocess, 'run', run)
    monkeypatch.setattr(gen, 'USAGE', {'calls': 0, 'input': 0, 'output': 0})
    # Act
    out = gen.ask('hỏi')
    # Assert
    assert out == {'a': 1}
    assert sent['input'] == 'hỏi'
    assert sent['cmd'][:4] == ['claude', '-p', '--model', 'haiku']
    assert gen.USAGE == {'calls': 1, 'input': 905, 'output': 3}


@pytest.mark.parametrize('rc, stdout, msg', [
    (1, 'Not logged in', 'exit 1'),
    (0, '{"is_error": true, "subtype": "error_max_turns", "result": "x"}', 'error_max_turns'),
])
def test_claude_cli_provider_raises_on_failure(gen, monkeypatch, rc, stdout, msg):
    # Arrange
    import subprocess
    from types import SimpleNamespace as NS
    monkeypatch.setenv('GEN_PROVIDER', 'claude-cli')
    monkeypatch.setattr(subprocess, 'run', lambda cmd, **kw: NS(returncode=rc, stdout=stdout, stderr=''))
    # Act / Assert
    with pytest.raises(RuntimeError, match=msg):
        gen.ask('hỏi')


def test_cache_hit_skips_download(gen, seeded, monkeypatch, capsys):
    def boom(*a, **k):
        raise AssertionError('network used')
    monkeypatch.setattr(urllib.request, 'urlopen', boom)
    for name in gen.SOURCES:
        assert gen.fetch(name) == seeded / name
    assert 'download' not in capsys.readouterr().out
    assert set(__import__('json').loads((seeded / 'manifest.json').read_text())) == set(gen.SOURCES)


def test_unknown_provider_exits_2_before_any_download(gen, monkeypatch, capsys):
    # Arrange
    monkeypatch.setenv('GEN_PROVIDER', 'claude_cli')
    monkeypatch.setenv('OPENCODE_API_KEY', 'x')
    monkeypatch.setattr(gen, 'fetch', lambda name: pytest.fail('download attempted'))
    # Act
    with pytest.raises(SystemExit) as e:
        gen.main(['打'])
    # Assert
    assert e.value.code == 2
    assert 'claude_cli' in capsys.readouterr().err
