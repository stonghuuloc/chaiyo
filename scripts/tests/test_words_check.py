import copy, json

import pytest
from helpers import ROW, answer, scripted, sense

def test_uncovered_twice_rejected_message_names_sense(word):
    llm = scripted(answer(covered=('0.0', '0.1')))
    with pytest.raises(word.Reject) as e:
        word.entry('打', {}, llm)
    assert len(llm.calls) == 2
    assert 'thiếu nghĩa 1.0 "dozen"' in str(e.value)
    assert str(e.value).startswith('打:')


def test_uncovered_once_then_repaired_written(word):
    llm = scripted(answer(covered=('0.0', '0.1')), answer())
    hz, e = word.entry('打', {}, llm)
    assert len(llm.calls) == 2
    assert 'thiếu nghĩa 1.0' in llm.calls[1]
    assert [r['pinyin'] for r in e['readings']] == ['dǎ', 'dá']


def test_bad_drop_reason_is_error(word):
    bad = answer(covered=('0.0', '0.1', '1.0'), dropped=[{'id': '1.0', 'why': 'khác'}])
    with pytest.raises(word.Reject) as e:
        word.entry('打', {}, scripted(bad))
    assert 'lý do lạ khác' in str(e.value)


def test_secondary_reading_without_common_sense_dropped(word):
    hz, e = word.entry('打', {}, scripted(answer(second_common=False)))
    assert [r['pinyin'] for r in e['readings']] == ['dǎ']
    assert {'id': '1.0', 'why': 'âm hiếm'} in e['dropped']


def test_main_reading_kept_when_no_reading_has_a_common_sense(word):
    a = answer(second_common=False)
    for g in a['readings'][0]['groups']:
        for s in g['senses']:
            s['common'] = False
    hz, e = word.entry('打', {}, scripted(a))
    assert [r['pinyin'] for r in e['readings']] == ['dǎ']


def test_main_exits_1_and_lists_rejected(gen, seeded, monkeypatch, capsys, tmp_path):
    monkeypatch.setattr(gen, 'DICT', {'打': ROW, '好': ['好', 'hǎo', 'hao', 'hảo', '', 1, [], []]})
    def llm(prompt):
        if '「打」' in prompt:
            return copy.deepcopy(answer(covered=('0.0',)))
        good = sense('tốt', ['0.0'], ex={'ai': True, 'hz': '你好', 'py': 'Nǐ hǎo', 'vi': 'Xin chào'})
        return {'readings': [{'pinyin': 'hǎo', 'hanviet': 'hảo', 'groups': [{'pos': 'Tính từ', 'senses': [good]}]},
                             ], 'dropped': [{'id': '0.1', 'why': 'trùng'}], 'luongtu': [], 'cannghia': []}
    with pytest.raises(SystemExit) as e:
        gen.main(['打', '好'], llm)
    assert e.value.code == 1
    out = capsys.readouterr().out
    assert 'ok 好' in out
    assert out.rstrip().splitlines()[-1].startswith('REJECT 打:')
    assert [p.name for p in (gen.CACHE / 'out/words').glob('*.yaml')] == ['好.yaml']


def test_sense_without_source_is_error(word):
    a = answer()
    a['readings'][0]['groups'][0]['senses'].append(sense('bay', [], ex={'ai': True, 'hz': '打飞机', 'py': 'Dǎ fēijī', 'vi': 'x'}))
    with pytest.raises(word.Reject) as e:
        word.entry('打', {}, scripted(a))
    assert 'nghĩa "bay" không có nguồn' in str(e.value)


def test_invented_source_id_is_error(word):
    a = answer()
    a['readings'][0]['groups'][0]['senses'][0]['src'] = ['0.0', '9.9']
    with pytest.raises(word.Reject) as e:
        word.entry('打', {}, scripted(a))
    assert 'không có nguồn' in str(e.value)


@pytest.mark.parametrize('field', ['vi', 'py'])
def test_example_missing_field_is_error(word, field):
    a = answer()
    del a['readings'][0]['groups'][0]['senses'][0]['ex'][field]
    with pytest.raises(word.Reject) as e:
        word.entry('打', {}, scripted(a))
    assert 'thiếu "py" hoặc "vi"' in str(e.value)


def test_sense_missing_vi_is_error(word):
    a = answer()
    del a['readings'][0]['groups'][0]['senses'][0]['vi']
    with pytest.raises(word.Reject) as e:
        word.entry('打', {}, scripted(a))
    assert 'thiếu "vi"' in str(e.value)
