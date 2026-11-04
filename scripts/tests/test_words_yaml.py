import hashlib

import pytest
import yaml
from helpers import ROW, answer, scripted

TATOEBA_ROWS = {'5670795': ('他打球。', {'他', '打', '球'}, {'en': 'He plays ball.'})}


def tatoeba_ex(py='Tā dǎ qiú.'):
    return {'tatoeba': '5670795', 'hz': '他打球 (copy)', 'py': py, 'vi': 'Anh ấy chơi bóng.'}


def staged(gen, kind, name):
    return yaml.safe_load((gen.CACHE / 'out' / kind / name).read_text())


def run(gen, llm, hz='打', rows=None):
    result = gen.entry(hz, rows if rows is not None else TATOEBA_ROWS, llm)
    gen.write_out([result])
    return result


def test_tatoeba_example_sentence_source_and_verbatim_text(word):
    run(word, scripted(answer(ex0=tatoeba_ex())))
    s = {x['id']: x for x in staged(word, 'sentences', 'hsk1.yaml')}['s-w-5670795']
    assert s == {'id': 's-w-5670795', 'hanzi': '他打球。', 'pinyin': 'Tā dǎ qiú.', 'vi': 'Anh ấy chơi bóng.', 'source': 'tatoeba:5670795'}
    assert staged(word, 'words', '打.yaml')['senses'][0] == {'vi': 'đánh', 'pos': 'v', 'example': 's-w-5670795'}


def test_ai_example_source_and_id(word):
    run(word, scripted(answer()))
    hid = 's-w-ai-' + hashlib.sha1('他打球'.encode()).hexdigest()[:8]
    s = {x['id']: x for x in staged(word, 'sentences', 'hsk1.yaml')}[hid]
    assert s['source'] == 'ai' and s['hanzi'] == '他打球'


def test_ai_sentence_over_12_hanzi_is_error(word):
    long = {'ai': True, 'hz': '他每天都在学校的操场上打球', 'py': 'Tā měitiān', 'vi': 'x'}
    with pytest.raises(word.Reject) as e:
        word.entry('打', {}, scripted(answer(ex0=long)))
    assert '12' in str(e.value)


def test_duplicate_tatoeba_id_in_word_is_error(word):
    with pytest.raises(word.Reject) as e:
        word.entry('打', TATOEBA_ROWS, scripted(answer(ex0=tatoeba_ex(), ex1=tatoeba_ex())))
    assert 'dùng cho hai nghĩa' in str(e.value)


def test_pos_map_all_labels(word):
    labels = ['Danh từ', 'Động từ', 'Tính từ', 'Phó từ', 'Lượng từ', 'Đại từ', 'Số từ', 'Giới từ', 'Liên từ', 'Trợ từ', 'Thán từ', 'Bổ ngữ', 'Cụm từ', 'Thành ngữ']
    codes = ['n', 'v', 'adj', 'adv', 'mw', 'pron', 'num', 'prep', 'conj', 'part', 'interj', 'comp', 'phrase', 'phrase']
    for label, code in zip(labels, codes):
        hz, e = word.entry('打', {}, scripted(answer(pos=label)))
        assert word.to_yaml('打', e)[0]['打']['senses'][0]['pos'] == code


def test_unknown_pos_error(word):
    with pytest.raises(word.Reject) as e:
        word.entry('打', {}, scripted(answer(pos='Trạng từ')))
    assert 'từ loại lạ Trạng từ' in str(e.value)


def test_existing_hand_fields_preserved(word):
    word.CONTENT.mkdir(parents=True)
    (word.CONTENT / '打.yaml').write_text(yaml.safe_dump({
        'id': '打', 'hanzi': '打', 'pinyin': 'dǎ', 'hanviet': 'đả', 'level': 1, 'pos': ['phrase'],
        'senses': [{'vi': 'tay đôi'}], 'image': {'file': 'words/da.png'},
        'parts': [{'hanzi': '扌', 'pinyin': 'x', 'hanviet': 'y', 'vi': 'z'}], 'spoken': 'dá',
        'examples': ['s-h1-01-11', 's-w-old']}, allow_unicode=True))
    run(word, scripted(answer()))
    w = staged(word, 'words', '打.yaml')
    assert [s['vi'] for s in w['senses']] == ['tay đôi', 'đánh', 'chơi']
    assert w['senses'][0] == {'vi': 'tay đôi'}
    assert w['image'] == {'file': 'words/da.png'} and w['spoken'] == 'dá' and w['parts'][0]['hanzi'] == '扌'
    assert w['hanviet'] == 'đả' and w['pos'] == ['v']
    assert w['examples'][0] == 's-h1-01-11' and 's-w-old' not in w['examples'] and len(w['examples']) == 3


def test_existing_hanviet_wins(word):
    word.CONTENT.mkdir(parents=True)
    (word.CONTENT / '打.yaml').write_text(yaml.safe_dump({'id': '打', 'hanzi': '打', 'pinyin': 'dǎ', 'hanviet': 'tay', 'level': 1, 'pos': [], 'senses': [], 'examples': []}, allow_unicode=True))
    run(word, scripted(answer()))
    assert staged(word, 'words', '打.yaml')['hanviet'] == 'tay'


def test_rerun_replaces_generated_senses_no_duplicates(word):
    word.CONTENT.mkdir(parents=True)
    (word.CONTENT / '打.yaml').write_text(yaml.safe_dump({
        'id': '打', 'hanzi': '打', 'pinyin': 'dǎ', 'level': 1, 'pos': ['v'],
        'senses': [{'vi': 'tay đôi'}, {'vi': 'cũ', 'pos': 'v', 'example': 's-w-x'}], 'examples': []}, allow_unicode=True))
    run(word, scripted(answer()))
    run(word, scripted(answer()))
    assert [s['vi'] for s in staged(word, 'words', '打.yaml')['senses']] == ['tay đôi', 'đánh', 'chơi']


def test_rerun_prunes_stale_secondary_reading_file(word):
    run(word, scripted(answer()))
    assert (word.CACHE / 'out/words/打-da2.yaml').exists() and (word.CACHE / 'out/src/打-da2.json').exists()
    run(word, scripted(answer(second_common=False)))
    assert not (word.CACHE / 'out/words/打-da2.yaml').exists() and not (word.CACHE / 'out/src/打-da2.json').exists()
    assert (word.CACHE / 'out/words/打.yaml').exists()


def test_rejected_word_keeps_earlier_staged_files(word, seeded, monkeypatch):
    run(word, scripted(answer()))
    before = {p.name: p.read_text() for p in (word.CACHE / 'out/words').glob('*.yaml')}
    monkeypatch.setattr(word, 'DICT', {'打': ROW})
    with pytest.raises(SystemExit) as e:
        word.main(['打'], scripted(answer(covered=('0.0',))))
    assert e.value.code == 1
    assert {p.name: p.read_text() for p in (word.CACHE / 'out/words').glob('*.yaml')} == before


def test_main_summary_counts_sources(word, seeded, capsys):
    word.main(['打', '车上'], scripted(answer()))
    out = capsys.readouterr().out
    assert 'skip 车上: not in HSK1 list' in out
    assert 'tatoeba 0 / ai 3' in out


def test_multisyllable_secondary_id(word, monkeypatch):
    hsk = {'s': '东西', 'l': ['n1'], 'p': ['n'], 'f': [
        {'i': {'y': 'dōng xi', 'n': 'dong1 xi5'}, 'm': ['thing']},
        {'i': {'y': 'dōng xī', 'n': 'dong1 xi1'}, 'm': ['east and west']}]}
    monkeypatch.setattr(word, 'HSK', {'东西': hsk})
    monkeypatch.setattr(word, 'DICT', {'东西': ['东西', 'dōng xi', 'dong', 'đông tây', '', 1, [], [['dōng xī', 'đông tây', []]]]})
    def sense(vi, src, hz, py):
        return {'vi': vi, 'src': [src], 'common': True, 'ex': {'ai': True, 'hz': hz, 'py': py, 'vi': 'v'}}
    a = {'readings': [
        {'pinyin': 'dōng xi', 'hanviet': 'x', 'groups': [{'pos': 'Danh từ', 'senses': [sense('đồ vật', '0.0', '这个东西', 'Zhège dōngxi')]}]},
        {'pinyin': 'dōng xī', 'hanviet': 'x', 'groups': [{'pos': 'Danh từ', 'senses': [sense('đông tây', '1.0', '东西方', 'Dōngxī fāng')]}]}],
        'dropped': []}
    run(word, scripted(a), '东西', {})
    assert sorted(p.name for p in (word.CACHE / 'out/words').glob('*.yaml')) == ['东西-dong1xi1.yaml', '东西.yaml']


@pytest.mark.parametrize('py,ok', [
    ('Tā dǎ qiú', True), ('Ta da qiu', False), ('Nǐ3 hǎo', False), ('Ba.', True), ('Chu lai', True),
    ('Ni', False), ('Ma?', True), ('Nǐ ⺈ hǎo', False)])
def test_pinyin_rule_cases(word, py, ok):
    assert (word.py_errors(py) == []) is ok


def test_sentence_pinyin_failure_rejects_word(word):
    bad = {'ai': True, 'hz': '他打球', 'py': 'Ta da qiu', 'vi': 'x'}
    with pytest.raises(word.Reject) as e:
        word.entry('打', {}, scripted(answer(ex0=bad)))
    assert 'thiếu dấu thanh' in str(e.value)
