import copy, json

import pytest

HSK = {'s': '打', 'l': ['n1'], 'p': ['v'], 'f': [
    {'i': {'y': 'dǎ', 'n': 'da3'}, 'm': ['to hit', 'to play']},
    {'i': {'y': 'dá', 'n': 'da2'}, 'm': ['dozen']}]}
ROW = ['打', 'dǎ', 'da', 'đả', '', 1, [], [['dá', 'đả', []]]]


def sense(vi, src, common=True, hz='他打球', py='Tā dǎ qiú'):
    return {'vi': vi, 'src': src, 'common': common, 'ex': {'ai': True, 'hz': hz, 'py': py, 'vi': 'Anh ấy chơi bóng.'}}


def answer(second_common=True, covered=('0.0', '0.1', '1.0'), dropped=()):
    da3 = [sense('đánh', [i for i in ('0.0',) if i in covered]), sense('chơi', [i for i in ('0.1',) if i in covered])]
    da3 = [s for s in da3 if s['src']]
    readings = [{'pinyin': 'dǎ', 'hanviet': 'đả', 'groups': [{'pos': 'Động từ', 'senses': da3}]}]
    if '1.0' in covered:
        readings.append({'pinyin': 'dá', 'hanviet': 'đả', 'groups': [
            {'pos': 'Lượng từ', 'senses': [sense('tá', ['1.0'], second_common)]}]})
    return {'readings': readings, 'dropped': list(dropped), 'luongtu': [], 'cannghia': []}


@pytest.fixture
def word(gen, monkeypatch):
    monkeypatch.setattr(gen, 'HSK', {'打': HSK})
    monkeypatch.setattr(gen, 'DICT', {'打': ROW})
    return gen


def scripted(*answers):
    calls = []
    def llm(prompt):
        calls.append(prompt)
        return copy.deepcopy(answers[min(len(calls), len(answers)) - 1])
    llm.calls = calls
    return llm


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


def test_main_reading_without_common_sense_kept(word):
    a = answer()
    for g in a['readings'][0]['groups']:
        for s in g['senses']:
            s['common'] = False
    hz, e = word.entry('打', {}, scripted(a))
    assert [r['pinyin'] for r in e['readings']] == ['dǎ', 'dá']


def test_main_exits_1_and_lists_rejected(gen, seeded, monkeypatch, capsys, tmp_path):
    monkeypatch.setattr(gen, 'OUT', tmp_path / 'entries.json')
    monkeypatch.setattr(gen, 'DICT', {'打': ROW, '好': ['好', 'hǎo', 'hao', 'hảo', '', 1, [], []]})
    def llm(prompt):
        if '「打」' in prompt:
            return copy.deepcopy(answer(covered=('0.0',)))
        good = sense('tốt', ['0.0'], hz='你好', py='Nǐ hǎo')
        return {'readings': [{'pinyin': 'hǎo', 'hanviet': 'hảo', 'groups': [{'pos': 'Tính từ', 'senses': [good]}]},
                             ], 'dropped': [{'id': '0.1', 'why': 'trùng'}], 'luongtu': [], 'cannghia': []}
    with pytest.raises(SystemExit) as e:
        gen.main(['打', '好'], llm)
    assert e.value.code == 1
    out = capsys.readouterr().out
    assert 'ok 好' in out
    assert out.rstrip().splitlines()[-1].startswith('REJECT 打:')
    assert '好' in json.loads(gen.OUT.read_text()) and '打' not in json.loads(gen.OUT.read_text())
