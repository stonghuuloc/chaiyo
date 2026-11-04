import pytest
import yaml
from helpers import answer, scripted


def stage_words(gen, n=3, rare_at=1):
    out = gen.CACHE / 'out'
    (out / 'words').mkdir(parents=True)
    (out / 'src').mkdir()
    sentences = []
    for i in range(n):
        wid = f'字{i}'
        sentences.append({'id': f's-w-ai-{i}', 'hanzi': wid, 'pinyin': 'zì', 'vi': 'chữ', 'source': 'ai'})
        senses = [{'vi': 'a', 'pos': 'n', 'example': f's-w-ai-{i}'}]
        if i == rare_at:
            senses.append({'vi': 'b', 'pos': 'n', 'rare': True, 'example': f's-w-ai-{i}'})
        (out / 'words' / f'{wid}.yaml').write_text(yaml.safe_dump({'id': wid, 'hanzi': wid, 'pinyin': 'zì', 'hanviet': 'tự', 'level': 1, 'pos': ['n'], 'senses': senses, 'examples': [f's-w-ai-{i}']}, allow_unicode=True), encoding='utf-8')
        (out / 'src' / f'{wid}.json').write_text('{"pinyin": "zì", "senses": {"0.0": "word"}}', encoding='utf-8')
    sentences.append({'id': 's-w-ai-orphan', 'hanzi': 'x', 'pinyin': 'x', 'vi': 'x', 'source': 'ai'})
    sentences.append({'id': 's-h1-keep', 'hanzi': 'y', 'pinyin': 'y', 'vi': 'y', 'source': 'ai'})
    (out / 'sentences').mkdir()
    (out / 'sentences/hsk1.yaml').write_text(yaml.safe_dump(sentences, allow_unicode=True), encoding='utf-8')
    return out


def rare_answer():
    a = answer()
    a['readings'][0]['groups'][0]['senses'][1]['common'] = False
    return a


def test_summary_counts_rare(word, seeded, capsys):
    word.main(['打'], scripted(rare_answer()))
    assert 'rare senses 1 in 1 words' in capsys.readouterr().out


def test_summary_line_shape(word, seeded, capsys):
    word.main(['打'], scripted(answer()))
    assert 'words 1, files 2, rejected 0, tatoeba 0 / ai 3, rare senses 0 in 0 words' in capsys.readouterr().out


def test_staged_rare_key_only_on_rare(word, seeded):
    word.main(['打'], scripted(rare_answer()))
    senses = yaml.safe_load((word.CACHE / 'out/words/打.yaml').read_text(encoding='utf-8'))['senses']
    assert ['rare' in s for s in senses] == [False, True]
    assert senses[1]['rare'] is True


def test_sample_same_seed_same_ids(gen):
    out = stage_words(gen, 30)
    gen.review(out, 1)
    first = (out / 'review-1.md').read_text(encoding='utf-8')
    gen.review(out, 1)
    assert (out / 'review-1.md').read_text(encoding='utf-8') == first
    assert first.count('\n### ') == 20


def test_sample_different_seed_differs(gen):
    out = stage_words(gen, 30)
    gen.review(out, 1)
    gen.review(out, 2)
    heads = lambda n: [l for l in (out / f'review-{n}.md').read_text(encoding='utf-8').splitlines() if l.startswith('### ')]
    assert heads(1) != heads(2)


def test_review_page_lists_rare_star_and_labels(gen):
    out = stage_words(gen, 3)
    gen.review(out, 1)
    page = (out / 'review-1.md').read_text(encoding='utf-8')
    assert '★ b' in page and '- a' in page and 'AI viết' in page and 'CC-CEDICT: 0.0 word' in page
    assert 'staged-set sha: ' in page and 'rare senses 1 in 1 words' in page


def test_promote_requires_approved_flag(gen):
    with pytest.raises(SystemExit) as e:
        gen.main(['--promote'])
    assert e.value.code == 2


def test_promote_missing_review_exit_2_content_untouched(gen):
    stage_words(gen, 3)
    with pytest.raises(SystemExit) as e:
        gen.main(['--promote', '--approved', '1'])
    assert e.value.code == 2 and not gen.CONTENT.exists()


def test_promote_stale_sha_exit_2(gen):
    out = stage_words(gen, 3)
    gen.review(out, 1)
    (out / 'words/字0.yaml').write_text('changed', encoding='utf-8')
    with pytest.raises(SystemExit) as e:
        gen.main(['--promote', '--approved', '1'])
    assert e.value.code == 2 and not gen.CONTENT.exists()


def test_promote_matching_sha_copies_and_prunes_orphan_sentences(gen):
    out = stage_words(gen, 3)
    gen.review(out, 1)
    gen.main(['--promote', '--approved', '1'])
    assert sorted(p.name for p in gen.CONTENT.glob('*.yaml')) == ['字0.yaml', '字1.yaml', '字2.yaml']
    ids = [s['id'] for s in yaml.safe_load((gen.CONTENT.parent / 'sentences/hsk1.yaml').read_text(encoding='utf-8'))]
    assert ids == ['s-w-ai-0', 's-w-ai-1', 's-w-ai-2', 's-h1-keep']


@pytest.mark.parametrize('model,source,ok', [
    ('biérén', 'bié ren', True), ('huí qù', 'huí qu', True), ('wán', 'wán r', True), ('yí kuàir', 'yī kuài r', True),
    ('bàba', 'bà ba', True), ('dǎn', 'dǎ', False)])
def test_reading_match_ignores_spacing_tone_and_erhua(gen, model, source, ok):
    assert (gen.canon(model, [{'pinyin': source}]) == source) is ok


def test_reading_match_prefers_exact(gen):
    assert gen.canon('dōng xī', [{'pinyin': 'dōng xi'}, {'pinyin': 'dōng xī'}]) == 'dōng xī'



def test_main_reading_falls_back_to_first_source_reading(word):
    word.DICT['打'] = ['打', 'gě', 'da', 'đả', '', 1, [], [['dǎ', 'tá', []]]]
    hz, e = word.entry('打', {}, scripted(answer()))
    assert e['main'] == 'dǎ'


def test_main_reading_override(word):
    assert word.main_reading('行', []) == 'xíng'


def test_main_is_the_reading_with_common_senses_not_the_legal_one(word):
    word.DICT['打'] = ['打', 'dá', 'da', 'đả', '', 1, [], [['dǎ', 'tá', []]]]
    a = answer(second_common=False)
    hz, e = word.entry('打', {}, scripted(a))
    assert e['main'] == 'dǎ' and [r['pinyin'] for r in e['readings']] == ['dǎ']
    assert sorted(word.to_yaml('打', e)[0]) == ['打']


def test_audit_unstars_an_everyday_sense(word):
    a = rare_answer()
    hz, e = word.entry('打', {}, scripted(a, {'bad_example': [], 'common': ['0.0.1']}))
    assert all(s['common'] for g in e['readings'][0]['groups'] for s in g['senses'])
    assert 'rare' not in str(word.to_yaml('打', e)[0]['打']['senses'])


def test_audit_bad_example_triggers_one_repair_round(word):
    llm = scripted(answer(), {'bad_example': [{'id': '0.0.0', 'why': 'từ ghép không có thật'}], 'common': []}, answer())
    word.entry('打', {}, llm)
    assert len(llm.calls) == 3 and 'không tự nhiên: từ ghép không có thật' in llm.calls[2]


def test_audit_clean_entry_costs_two_calls(word):
    llm = scripted(answer(), {'bad_example': [], 'common': []})
    word.entry('打', {}, llm)
    assert len(llm.calls) == 2


def test_hsk_pos_hint_without_group_is_sent_back_and_core_sense_is_kept(word, monkeypatch):
    monkeypatch.setitem(word.HSK['打'], 'p', ['v', 'a'])
    a = answer()
    fixed = answer()
    fixed['readings'][0]['groups'].append({'pos': 'Tính từ', 'senses': [
        {'vi': 'cốt lõi', 'src': [], 'core': True, 'common': True, 'ex': {'ai': True, 'hz': '他很打', 'py': 'Tā hěn dǎ', 'vi': 'x'}}]})
    llm = scripted(a, {'bad_example': [], 'common': []}, fixed)
    hz, e = word.entry('打', {}, llm)
    assert 'Tính từ' in llm.calls[2] and e['core'] == ['cốt lõi']


@pytest.mark.parametrize('hz,py,want', [
    ('我不去。', 'Wǒ bú qù.', 'Wǒ bù qù.'),
    ('这是一些书。', 'Zhè shì yìxiē shū.', 'Zhèshì yīxiē shū.'),
    ('他走路去学校。', 'Tā zǒu lù qù xué xiào.', 'Tā zǒulù qù xuéxiào.'),
    ('你好，你叫什么名字？', 'Nǐ hǎo, nǐ jiào shénme míngzi?', 'Nǐhǎo, nǐ jiào shénme míngzi?'),
    ('他很好。', 'Tā hěn', 'Tā hěn')])
def test_normalize_py_citation_tones_and_word_grouping(gen, hz, py, want):
    assert gen.normalize_py(hz, py) == want


def test_hanviet_fix_and_dupe_check(gen):
    assert gen.hanviet('冷', 'lạnh') == 'lãnh' and gen.hanviet('读书', 'đọc thư') == 'độc thư'
    assert gen.hanviet('电', 'điện') == 'điện'
    assert gen.hanviet_dupes({'hanviet': 'lạnh', 'senses': [{'vi': 'lạnh (thời tiết)'}]})
    assert not gen.hanviet_dupes({'hanviet': 'lãnh', 'senses': [{'vi': 'lạnh'}]})


def test_audit_missing_core_sense_and_bound_form(word):
    audit = {'bad_example': [], 'common': [], 'bound': ['0.0.1'], 'missing': [{'pos': 'Danh từ', 'vi': 'chỗ, điểm'}]}
    fixed = answer()
    llm = scripted(answer(), audit, fixed)
    hz, e = word.entry('打', {}, llm)
    assert len(llm.calls) == 3 and 'thiếu nghĩa cốt lõi Danh từ' in llm.calls[2] and 'chỗ, điểm' in llm.calls[2]


def test_bound_form_gets_rare_flag(word):
    hz, e = word.entry('打', {}, scripted(answer(), {'bad_example': [], 'common': [], 'bound': ['0.0.1'], 'missing': []}))
    assert [s['common'] for s in e['readings'][0]['groups'][0]['senses']] == [True, False]


def test_classifier_example_needs_numeral_before_classifier(word, monkeypatch):
    monkeypatch.setitem(word.HSK['打'], 'f', [{'i': {'y': 'dǎ', 'n': 'da3'}, 'm': ['classifier for beds']}])
    a = answer(covered=('0.0',), pos='Lượng từ')
    a['readings'] = a['readings'][:1]
    a['readings'][0]['groups'][0]['senses'] = [a['readings'][0]['groups'][0]['senses'][0]]
    a['readings'][0]['groups'][0]['senses'][0]['ex'] = {'ai': True, 'hz': '两张打', 'py': 'Liǎng zhāng dǎ', 'vi': 'x'}
    with pytest.raises(word.Reject) as e:
        word.entry('打', {}, scripted(a))
    assert 'số từ' in str(e.value)
