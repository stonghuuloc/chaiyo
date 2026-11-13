import threading

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


BARE = [{'ai': True, 'hz': '我打你', 'py': 'Wǒ dǎ nǐ', 'vi': 'x'}, {'ai': True, 'hz': '他打我', 'py': 'Tā dǎ wǒ', 'vi': 'x'}]


def bare_answer():
    return answer(ex0=BARE[0], ex1=BARE[1])


def rare_answer():
    a = bare_answer()
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
    assert '★ b' in page and '- a' in page and 'AI viết' not in page and 'CC-CEDICT: 0.0 word' in page
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


@pytest.mark.parametrize('model,source', [('yǒukòngr', 'yǒukòngr5'), ('xiàohuàr', 'xiàohuar5'), ('bù yīhuǐr', 'bù yīhuǐr5')])
def test_reading_match_accepts_erhua_tail_with_tone_digit(gen, model, source):
    # Arrange
    readings = [{'pinyin': gen.src_pinyin(source)}]
    # Act
    got = gen.canon(model, readings)
    # Assert
    assert got == gen.src_pinyin(source)
    assert not any(c.isdigit() for c in got)


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
    llm = scripted(bare_answer(), {'bad_example': [], 'common': []})
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
    ('这是一些书。', 'Zhè shì yìxiē shū.', 'Zhè shì yīxiē shū.'),
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
    audit = {'bad_example': [], 'common': [], 'bound': [], 'missing': [{'pos': 'Danh từ', 'vi': 'chỗ, điểm'}]}
    fixed = answer()
    llm = scripted(answer(), audit, fixed)
    hz, e = word.entry('打', {}, llm)
    assert len(llm.calls) == 3 and 'thiếu nghĩa cốt lõi Danh từ' in llm.calls[2] and 'chỗ, điểm' in llm.calls[2]


def test_bound_pattern_sense_is_noted_not_starred(word):
    hz, e = word.entry('打', {}, scripted(bare_answer(), {'bad_example': [], 'common': [], 'bound': [{'id': '0.0.1', 'pattern': '打你'}], 'missing': []}))
    senses = e['readings'][0]['groups'][0]['senses']
    assert [s['common'] for s in senses] == [True, True] and senses[1]['vi'] == 'chơi (chỉ dùng trong 打你)'


def test_classifier_example_needs_numeral_before_classifier(word, monkeypatch):
    monkeypatch.setitem(word.HSK['打'], 'f', [{'i': {'y': 'dǎ', 'n': 'da3'}, 'm': ['classifier for beds']}])
    a = answer(covered=('0.0',), pos='Lượng từ')
    a['readings'] = a['readings'][:1]
    a['readings'][0]['groups'][0]['senses'] = [a['readings'][0]['groups'][0]['senses'][0]]
    a['readings'][0]['groups'][0]['senses'][0]['ex'] = {'ai': True, 'hz': '两张打', 'py': 'Liǎng zhāng dǎ', 'vi': 'x'}
    with pytest.raises(word.Reject) as e:
        word.entry('打', {}, scripted(a))
    assert 'số từ' in str(e.value)


def test_classifier_example_accepts_digit_numeral(word, monkeypatch):
    monkeypatch.setitem(word.HSK['打'], 'f', [{'i': {'y': 'dǎ', 'n': 'da3'}, 'm': ['classifier for years of age']}])
    rows = {'77': ('他十六打', {'他', '十六', '打'}, {'en': 'x'})}
    a = answer(covered=('0.0',), pos='Lượng từ')
    a['readings'][0]['groups'][0]['senses'] = [a['readings'][0]['groups'][0]['senses'][0]]
    a['readings'][0]['groups'][0]['senses'][0]['ex'] = {'tatoeba': '77', 'hz': '他十六打', 'py': 'Tā shíliù dǎ', 'vi': 'x'}
    hz, e = word.entry('打', rows, scripted(a))
    assert e['readings'][0]['groups'][0]['pos'] == 'Lượng từ'


def test_classifier_sense_with_an_unknown_src_is_rejected_not_crashed(word, monkeypatch):
    monkeypatch.setitem(word.HSK['打'], 'f', [{'i': {'y': 'dǎ', 'n': 'da3'}, 'm': ['classifier for beds']}])
    a = answer(covered=('0.0',), pos='Lượng từ')
    a['readings'] = a['readings'][:1]
    a['readings'][0]['groups'][0]['senses'] = [a['readings'][0]['groups'][0]['senses'][0]]
    a['readings'][0]['groups'][0]['senses'][0]['src'] = ['0.9']  # the model invented an id: check() records it, validation must not index texts['0.9']
    with pytest.raises(word.Reject) as e:
        word.entry('打', {}, scripted(a))
    assert 'không có nguồn' in str(e.value)


def test_core_sense_without_src_on_a_dropped_reading_does_not_crash(word):
    a = answer()
    a['readings'][1]['groups'] = [{'pos': 'Danh từ', 'senses': [
        {'vi': 'tá (đơn vị)', 'core': True, 'common': False, 'ex': {'ai': True, 'hz': '打人', 'py': 'Dǎ rén', 'vi': 'x'}},
        {'vi': 'một tá (hộp)', 'src': ['1.0'], 'common': False, 'ex': {'ai': True, 'hz': '一打纸', 'py': 'Yì dá zhǐ', 'vi': 'x'}}]}]
    hz, e = word.entry('打', {}, scripted(a))
    assert e['dropped'] == [{'id': '1.0', 'why': 'âm hiếm'}]


def test_normalize_py_handles_erhua(gen):
    assert gen.normalize_py('给我一点儿。', 'Gěi wǒ yìdiǎnr.') == 'Gěi wǒ yīdiǎnr.'
    assert gen.normalize_py('不用去。', 'Bú yòng qù.') == 'Bùyòng qù.'


def test_normalize_py_erhua_as_its_own_jieba_token(gen):
    assert gen.normalize_py('我看一下儿。', 'Wǒ kàn yíxiàr.') == 'Wǒ kàn yīxiàr.'


@pytest.mark.parametrize('hz,py,want', [
    ('这是老师的话。', 'Zhè shì lǎoshī de huà.', 'Zhè shì lǎoshīde huà.'),
    ('你去的话，我也去。', 'Nǐ qù de huà, wǒ yě qù.', 'Nǐ qù dehuà, wǒ yě qù.'),
    ('我有一张床。', 'Wǒ yǒu yī zhāng chuáng.', 'Wǒ yǒu yīzhāng chuáng.'),
    ('我买了三本书。', 'Wǒ mǎi le sān běn shū.', 'Wǒ mǎile sānběn shū.'),
    ('他等着你。', 'Tā děng zhe nǐ.', 'Tā děngzhe nǐ.'),
    ('我去过北京。', 'Wǒ qù guo Běijīng.', 'Wǒ qùguo Běijīng.')])
def test_pinyin_grouping_rule_numeral_classifier_particles_conditional(gen, hz, py, want):
    assert gen.normalize_py(hz, py) == want


def test_merge_senses_folds_synonyms_before_translation(gen):
    readings = [{'pinyin': 'zuǒ bian', 'senses': {'0.0': 'left side', '0.1': 'the left', '0.2': 'a different thing'}}]
    merged = gen.merge_senses('左边', readings, lambda prompt: {'groups': [['0.0', '0.1'], ['0.0', '0.2'], ['0.2']]})
    assert merged[0]['senses'] == {'0.0': 'left side / the left', '0.2': 'a different thing'}
    assert readings[0]['senses']['0.1'] == 'the left'


def test_merge_senses_ignores_groups_across_readings(gen):
    readings = [{'pinyin': 'a', 'senses': {'0.0': 'x'}}, {'pinyin': 'b', 'senses': {'1.0': 'y'}}]
    assert gen.merge_senses('字', readings, lambda prompt: {'groups': [['0.0', '1.0']]}) == readings


def test_entry_merges_before_the_main_prompt(word):
    llm = scripted(answer(covered=('0.0', '1.0')))
    hz, e = word.entry('打', {}, llm, merge=lambda prompt: {'groups': [['0.0', '0.1']]})
    assert '0.0 to hit / to play' not in llm.calls[0] and 'to hit / to play' in llm.calls[0]
    assert e['stats']['cedict'] == 3 and e['stats']['merged'] == 2


def test_stand_in_compound_goes_back_for_a_bare_example(word):
    llm = scripted(answer(), {'bad_example': [], 'common': []}, bare_answer())
    word.entry('打', {}, llm)
    assert len(llm.calls) == 3 and 'đứng riêng' in llm.calls[2]


def test_standins_reads_jieba_under_the_lock(gen, monkeypatch):
    inside = {'held': False}
    class ProbeLock:
        def __init__(self): self.lock = threading.RLock()
        def __enter__(self): self.lock.acquire(); inside['held'] = True
        def __exit__(self, *exc): inside['held'] = False; self.lock.release()
    calls = []
    monkeypatch.setattr(gen, 'JIEBA_LOCK', ProbeLock())
    monkeypatch.setattr(gen.jieba, 'lcut', lambda text: calls.append(inside['held']) or list(text))
    e = {'readings': [{'groups': [{'pos': 'Động từ', 'senses': [{'vi': 'muốn', 'ex': {'ai': True, 'hz': '要是'}}]}]}]}
    gen.standins('要', e, set())
    assert calls and all(calls)


def test_must_have_senses_reach_the_audit_prompt(word):
    word.MUST_HAVE['打'] = ['Động từ: gọi (điện thoại)']
    llm = scripted(bare_answer(), {'bad_example': [], 'common': []})
    word.entry('打', {}, llm)
    assert 'Động từ: gọi (điện thoại)' in llm.calls[1]


@pytest.mark.parametrize('hz,py,want', [
    ('别碰着。', 'Biépèng zháo.', 'Bié pèngzháo.'),
    ('你着什么急？', 'Nǐzháo shénme jí?', 'Nǐ zháo shénme jí?'),
    ('火着了。', 'Huǒzháole.', 'Huǒ zháole.'),
    ('他看着我。', 'Tā kàn zhe wǒ.', 'Tā kànzhe wǒ.')])
def test_pinyin_full_tone_zhao_is_a_word_and_pronoun_stays_apart(gen, hz, py, want):
    assert gen.normalize_py(hz, py) == want


def test_native_words_not_stored_as_hanviet(gen):
    assert gen.hanviet('喝', 'húp') == 'hát' and gen.hanviet('女', 'nhữ') == 'nữ' and gen.hanviet('女生', 'nhữ sinh') == 'nữ sinh'


def test_bound_note_merges_into_existing_parentheses_and_fullwidth_brackets_are_normalized(word):
    a = bare_answer()
    a['readings'][0]['groups'][0]['senses'][0]['vi'] = 'đánh（bóng）'
    a['readings'][0]['groups'][0]['senses'][1]['vi'] = 'chơi (bóng)'
    audit = {'bad_example': [], 'common': [], 'bound': [{'id': '0.0.1', 'pattern': '打球'}], 'missing': []}
    hz, e = word.entry('打', {}, scripted(a, audit))
    assert [s['vi'] for s in e['readings'][0]['groups'][0]['senses']] == ['đánh(bóng)', 'chơi (bóng; chỉ dùng trong 打球)']


def test_parse_json_takes_the_first_object_only(gen):
    assert gen.parse_json('```json\n{"a": 1}\n``` then {"b": 2}') == {'a': 1}
    assert gen.parse_json('{"a": {"b": [1, 2]}} trailing') == {'a': {'b': [1, 2]}}


@pytest.mark.parametrize('hz,py,want', [
    ('她过了马路。', 'Tāguòle mǎlù.', 'Tā guòle mǎlù.'),
    ('冬天过了。', 'Dōngtiānguòle.', 'Dōngtiān guòle.'),
    ('我们过春节。', 'Wǒmenguò Chūnjié.', 'Wǒmen guò Chūnjié.'),
    ('我过得很好。', 'Wǒguò de hěn hǎo.', 'Wǒ guò de hěn hǎo.'),
    ('我去过北京。', 'Wǒ qù guo Běijīng.', 'Wǒ qùguo Běijīng.'),
    ('天一黑，就会开始放烟花了。', 'Tiānyī hēi, jiù huì kāishǐ fàng yānhuā le.', 'Tiān yī hēi, jiù huì kāishǐ fàng yānhuāle.'),
    ('他一醒就哭。', 'Tā yīxǐng jiù kū.', 'Tā yī xǐng jiù kū.')])
def test_pinyin_full_tone_guo_is_a_verb_and_yi_is_its_own_word(gen, hz, py, want):
    assert gen.normalize_py(hz, py) == want


def test_erhua_pinyin_without_儿_in_the_hanzi_is_rejected(word):
    bad = {'ai': True, 'hz': '你跑哪去了', 'py': 'Nǐ pǎo nǎr qù le', 'vi': 'x'}
    with pytest.raises(word.Reject) as e:
        word.entry('打', {}, scripted(answer(ex0=bad)))
    assert 'erhua' in str(e.value)


def test_proper_noun_keeps_its_capital_and_is_written_out(word, monkeypatch):
    monkeypatch.setitem(word.HSK['打'], 'f', [{'i': {'y': 'Dǎ jīng', 'n': 'da3 jing1'}, 'm': ['to hit', 'to play']}])
    monkeypatch.setitem(word.DICT, '打', ['打', 'Dǎ jīng', 'da', 'đả', '', 1, [], []])
    a = answer(covered=('0.0', '0.1'))
    a['readings'] = a['readings'][:1]
    a['readings'][0]['pinyin'] = 'Dǎ jīng'
    word.write_out([word.entry('打', {}, scripted(a))])
    assert yaml.safe_load((word.CACHE / 'out/words/打.yaml').read_text(encoding='utf-8'))['pinyin'] == 'Dǎ jīng'


@pytest.mark.parametrize('hz,py,want', [
    ('他是我女儿。', 'Tā shì wǒ nǚér.', "Tā shì wǒ nǚ'ér."),
    ('第二天我去学校。', 'Dìèrtiān wǒ qù xuéxiào.', "Dì'èrtiān wǒ qù xuéxiào."),
    ('这道题的答案是三分之一。', 'Zhè dào tí de dáàn shì sān fēn zhī yī.', "Zhè dàotíde dá'àn shì sānfēnzhī yī."),
    ('我去天安门。', 'Wǒ qù Tiānānmén.', "Wǒ qù Tiān'ānmén."),
    ('一度等于六十分。', 'Yī dù děngyú liùshí fēn.', 'Yī dù děngyú liùshífēn.')])
def test_apostrophe_before_a_o_e_inside_a_word_and_numeral_unit_stays_whole(gen, hz, py, want):
    assert gen.normalize_py(hz, py) == want


def test_digits_in_an_ai_example_are_rejected(word):
    bad = {'ai': True, 'hz': '他考60打', 'py': 'Tā kǎo liùshí dǎ', 'vi': 'x'}
    with pytest.raises(word.Reject) as e:
        word.entry('打', {}, scripted(answer(ex0=bad)))
    assert 'chữ số Ả Rập' in str(e.value)


def test_audit_duplicate_sense_folds_into_the_kept_one(word):
    audit = {'bad_example': [], 'common': [], 'bound': [], 'missing': [], 'duplicate': [{'id': '0.0.1', 'of': '0.0.0'}]}
    hz, e = word.entry('打', {}, scripted(bare_answer(), audit))
    senses = e['readings'][0]['groups'][0]['senses']
    assert [s['vi'] for s in senses] == ['đánh'] and senses[0]['src'] == ['0.0', '0.1']


def test_audit_mirrored_duplicate_pair_keeps_the_surviving_sense(word):
    audit = {'bad_example': [], 'common': [], 'bound': [], 'missing': [],
             'duplicate': [{'id': '0.0.1', 'of': '0.0.0'}, {'id': '0.0.0', 'of': '0.0.1'}]}
    hz, e = word.entry('打', {}, scripted(bare_answer(), audit))
    senses = e['readings'][0]['groups'][0]['senses']
    assert [s['vi'] for s in senses] == ['đánh'] and senses[0]['src'] == ['0.0', '0.1']


def test_bound_note_is_vietnamese_with_comma_separators(word):
    audit = {'bad_example': [], 'common': [], 'bound': [{'id': '0.0.1', 'pattern': '「打球」、打人，等'}], 'missing': []}
    hz, e = word.entry('打', {}, scripted(bare_answer(), audit))
    assert e['readings'][0]['groups'][0]['senses'][1]['vi'] == 'chơi (chỉ dùng trong 打球, 打人, 等)'


def test_hand_gloss_folds_in_the_generated_twin_and_keeps_its_wording(word):
    word.CONTENT.mkdir(parents=True)
    (word.CONTENT / '打.yaml').write_text(yaml.safe_dump({
        'id': '打', 'hanzi': '打', 'pinyin': 'dǎ', 'level': 1, 'pos': ['v'],
        'senses': [{'vi': 'Đánh'}, {'vi': 'tay đôi'}], 'examples': []}, allow_unicode=True), encoding='utf-8')
    word.write_out([word.entry('打', {}, scripted(answer()))])
    w = yaml.safe_load((word.CACHE / 'out/words/打.yaml').read_text(encoding='utf-8'))
    assert [s['vi'] for s in w['senses']] == ['Đánh', 'tay đôi', 'chơi']
    assert w['senses'][0]['pos'] == 'v' and w['senses'][0]['example'].startswith('s-w-') and 'pos' not in w['senses'][1]
    assert w['senses'][0]['note'] == 'hand'


def test_hand_gloss_provenance_survives_a_second_promotion(word):
    word.CONTENT.mkdir(parents=True)
    (word.CONTENT / '打.yaml').write_text(yaml.safe_dump({
        'id': '打', 'hanzi': '打', 'pinyin': 'dǎ', 'level': 1, 'pos': ['v'],
        'senses': [{'vi': 'Đánh'}], 'examples': []}, allow_unicode=True), encoding='utf-8')
    word.write_out([word.entry('打', {}, scripted(answer()))])
    (word.CONTENT / '打.yaml').write_text((word.CACHE / 'out/words/打.yaml').read_text(encoding='utf-8'), encoding='utf-8')  # promotion
    later = answer()
    later['readings'][0]['groups'][0]['senses'][0]['vi'] = 'đập'
    word.write_out([word.entry('打', {}, scripted(later))])
    w = yaml.safe_load((word.CACHE / 'out/words/打.yaml').read_text(encoding='utf-8'))
    assert [s['vi'] for s in w['senses']] == ['Đánh', 'đập', 'chơi'] and w['senses'][0]['note'] == 'hand'


def test_a_folded_hand_gloss_is_recovered_for_an_already_promoted_word(word, monkeypatch):
    monkeypatch.setattr(word, 'HSK', {'谢谢': {'s': '谢谢', 'l': ['n1'], 'p': ['v'], 'f': [{'i': {'y': 'xiè xie', 'n': 'xie4 xie5'}, 'm': ['to thank']}]}})
    monkeypatch.setattr(word, 'DICT', {'谢谢': ['谢谢', 'xiè xie', 'tạ', 'tạ ơn', '', 1, [], []]})
    word.CONTENT.mkdir(parents=True)
    (word.CONTENT / '谢谢.yaml').write_text(yaml.safe_dump({
        'id': '谢谢', 'hanzi': '谢谢', 'pinyin': 'xiè xie', 'level': 1, 'pos': ['v'],
        'senses': [{'vi': 'cảm ơn', 'pos': 'v', 'example': 's-w-old'}], 'examples': []}, allow_unicode=True), encoding='utf-8')
    a = {'readings': [{'pinyin': 'xiè xie', 'hanviet': 'tạ tạ', 'groups': [{'pos': 'Động từ', 'senses': [
        {'vi': 'cảm ơn (cảm tạ)', 'src': ['0.0'], 'common': True, 'ex': {'ai': True, 'hz': '谢谢你', 'py': 'Xièxie nǐ', 'vi': 'Cảm ơn bạn.'}}]}]}], 'dropped': [], 'luongtu': [], 'cannghia': []}
    word.write_out([word.entry('谢谢', {}, scripted(a, {}))])
    w = yaml.safe_load((word.CACHE / 'out/words/谢谢.yaml').read_text(encoding='utf-8'))
    assert [s['vi'] for s in w['senses']] == ['cảm ơn']
    assert w['senses'][0]['note'] == 'hand' and w['senses'][0]['example'] == 's-w-old'


def test_offline_provider_exports_prompt_then_reads_answer(gen, tmp_path, monkeypatch):
    monkeypatch.setenv('GEN_OFFLINE_DIR', str(tmp_path / 'off'))
    with pytest.raises(gen.Pending) as e:
        gen.ask_files('hỏi')
    key = str(e.value)
    assert (tmp_path / 'off/prompts' / f'{key}.txt').read_text(encoding='utf-8') == 'hỏi'
    (tmp_path / 'off/answers').mkdir()
    (tmp_path / 'off/answers' / f'{key}.json').write_text('here: {"a": 1} trailing', encoding='utf-8')
    assert gen.ask_files('hỏi') == {'a': 1}


def test_main_with_offline_dir_waits_for_answers_instead_of_calling_the_api(word, seeded, tmp_path, monkeypatch, capsys):
    monkeypatch.setenv('GEN_OFFLINE_DIR', str(tmp_path / 'off'))
    monkeypatch.delenv('OPENCODE_API_KEY', raising=False)
    with pytest.raises(SystemExit) as e:
        word.main(['打'])
    assert e.value.code == 3 and 'PENDING 打' in capsys.readouterr().out
    assert list((tmp_path / 'off/prompts').glob('*.txt'))


@pytest.mark.parametrize('py,want', [
    ('lǎorén', ['lǎo', 'rén']), ('nánrén', ['nán', 'rén']), ('huār', ['huār']), ('nǚér', ['nǚ', 'ér']), ('Dōngtiānguòle', ['Dōng', 'tiān', 'guò', 'le'])])
def test_split_syllables_keeps_r_initial_syllable_out_of_erhua(gen, py, want):
    assert gen.split_syllables(py) == want


def test_normalize_py_uses_the_hanzi_count_to_split_bun_eng(gen):
    assert gen.normalize_py('有的地方不能理解。', 'Yǒude dìfang bùnéng lǐjiě.') == 'Yǒude dìfang bùnéng lǐjiě.'
    assert gen.normalize_py('这小男孩能数到十。', 'Zhè xiǎonánhái néngshǔ dào shí.') == 'Zhè xiǎonánhái néngshǔ dào shí.'


def test_tatoeba_rows_with_digits_or_latin_letters_are_not_candidates(word):
    rows = {'1': ('我打人', {'我', '打', '人'}, {'en': 'x'}), '2': ('我打7个', {'我', '打', '7', '个'}, {'en': 'x'}), '3': ('Tom打我', {'Tom', '打', '我'}, {'en': 'x'})}
    assert list(word.candidates('打', 1, rows)) == ['1']


def test_example_pinyin_must_cover_every_hanzi(word):
    short = {'ai': True, 'hz': '他打球，我拿来送人的', 'py': 'Tā dǎ qiú', 'vi': 'x'}
    with pytest.raises(word.Reject) as e:
        word.entry('打', {}, scripted(answer(ex0=short)))
    assert 'không khớp số chữ Hán' in str(e.value)


def test_a_syllable_after_erhua_is_spaced_so_the_importer_can_align(gen):
    assert gen.normalize_py('哪儿的话！', 'Nǎrde huà!') == 'Nǎr de huà!'
    assert gen.normalize_py('我一点儿也不怕狗。', 'Wǒ yīdiǎnr yě bù pà gǒu.') == 'Wǒ yīdiǎnr yě bùpà gǒu.'


def test_numeral_one_hundred_forty_is_not_cut_after_yi(gen):
    assert gen.normalize_py('二十美金等于一百四十元。', 'Èrshí měijīn děngyú yī bǎi sì shí yuán.') == 'Èrshí měijīn děngyú yībǎisìshíyuán.'


def test_numeral_plus_headword_classifier_is_one_word_and_the_noun_another(gen):
    assert gen.normalize_py('我看了一出戏。', 'Wǒ kàn le yì chū xì.', {'出'}) == 'Wǒ kànle yīchū xì.'


def test_toned_guo_inside_a_vocabulary_word_stays_whole(gen, monkeypatch):
    monkeypatch.setitem(gen.HSK, '错过', {})
    assert gen.normalize_py('我错过了火车。', 'Wǒ cuò guò le huǒchē.') == 'Wǒ cuòguòle huǒchē.'


def test_a_neighbour_is_not_glued_onto_a_single_hanzi_headword(gen, monkeypatch):
    monkeypatch.setitem(gen.HSK, '见到', {})
    monkeypatch.setitem(gen.HSK, '位子', {})
    for hz, text, py, want in (('到', '你常见到她吗？', 'Nǐ cháng jiàn dào tā ma?', 'Nǐ cháng jiàndào tā ma?'),
                               ('子', '这位子很好。', 'Zhè wèi zi hěn hǎo.', 'Zhè wèizi hěn hǎo.')):
        with gen.taught(hz, [], [text]):
            assert gen.normalize_py(text, py) == want


def test_hand_gloss_folds_in_a_generated_gloss_that_lists_it_as_a_term(gen):
    senses = [{'vi': 'các bạn'}, {'vi': 'các bạn; quý vị', 'pos': 'pron', 'example': 's-w-1'}, {'vi': 'bạn', 'pos': 'pron', 'example': 's-w-2'}]
    assert gen.fold_hand(senses) == [{'vi': 'các bạn', 'pos': 'pron', 'example': 's-w-1', 'note': 'hand'}, {'vi': 'bạn', 'pos': 'pron', 'example': 's-w-2'}]


def test_header_is_capitalised_only_when_every_cedict_reading_is(word):
    hz, e = word.entry('打', {}, scripted(answer()))
    reading = lambda py: {'pinyin': py, 'hanviet': 'đả', 'cvdict_vi': [], 'senses': {'0.0': 'x'}}
    e['cedict'] = [reading('Dǎ'), reading('dǎ')]
    assert [w['pinyin'] for w in word.to_yaml('打', e)[0].values()][0] == 'dǎ'
    e['cedict'] = [reading('Dǎ')]
    assert [w['pinyin'] for w in word.to_yaml('打', e)[0].values()][0] == 'Dǎ'


def test_bound_note_keeps_a_rare_sense_starred_and_replaces_a_repeated_parenthesis(word):
    audit = {'bad_example': [], 'common': [], 'bound': [{'id': '0.0.0', 'pattern': '打人'}, {'id': '0.0.1', 'pattern': '打球, 打人'}], 'missing': []}
    a = rare_answer()
    a['readings'][0]['groups'][0]['senses'][0]['vi'] = 'đánh (trong 打人)'
    hz, e = word.entry('打', {}, scripted(a, audit))
    senses = e['readings'][0]['groups'][0]['senses']
    assert senses[0]['vi'] == 'đánh (chỉ dùng trong 打人)' and senses[0]['common'] is True
    assert senses[1]['common'] is False and senses[1]['vi'].endswith('(chỉ dùng trong 打球, 打人)')


def test_every_staged_sentence_is_a_fixed_point_of_normalize_py(gen):
    out, sources = gen.ROOT / '.cache/words/out', gen.ROOT / '.cache/words/complete.min.json'
    if not out.exists() or not sources.exists():
        pytest.skip('no staged corpus')
    gen.HSK.update({e['s']: e for e in __import__('json').loads(sources.read_text(encoding='utf-8'))})
    sentences = {s['id']: s for s in yaml.safe_load((out / 'sentences/hsk1.yaml').read_text(encoding='utf-8'))}
    moved, settled = [], set()
    for f in sorted((out / 'words').glob('*.yaml')):
        for i, py in gen.restage_sentences(yaml.safe_load(f.read_text(encoding='utf-8')), sentences).items():
            if i not in settled and py != sentences[i]['pinyin']:
                moved.append((i, sentences[i]['pinyin'], py))
            settled.add(i)
    assert moved == []


@pytest.mark.parametrize('hz,py,want', [
    ('他急忙出了办公室。', "Tā jímáng chūle bàng'ōngshì.", 'Tā jímáng chūle bàngōngshì.'),
    ('我喝了牛奶。', "Wǒ hēle niún'ǎi.", 'Wǒ hēle niúnǎi.'),
    ('这是我的答案。', "Zhè shì wǒ de dá'àn.", "Zhè shì wǒde dá'àn."),
    ('他是我女儿。', "Tā shì wǒ nǚ'ér.", "Tā shì wǒ nǚ'ér.")])
def test_a_false_apostrophe_is_dropped_and_a_real_one_kept(gen, hz, py, want):
    assert gen.normalize_py(hz, py) == want


@pytest.mark.parametrize('hz,py,want', [
    ('他不客气地说：“不行。”', 'Tā bù kèqi de shuō: " Bùxíng. "', 'Tā bù kèqi de shuō: "Bùxíng."'),
    ('她喜欢雨和雪。', 'Tā xǐhuan yǔ hé xuě.', 'Tā xǐhuan yǔ hé xuě.'),
    ('二加三的和是五。', 'Èr jiā sān de hé shì wǔ.', 'Èr jiā sānde hé shì wǔ.'),
    ('汤姆喜欢她。', 'Tāngmǔ xǐhuan tā.', 'Tāngmǔ xǐhuan tā.'),
    ('别冻着了。', 'Bié dòng zháo le.', 'Bié dòngzháole.'),
    ('我找着工作了。', 'Wǒ zhǎo zháo gōngzuò le.', 'Wǒ zhǎozháo gōngzuòle.'),
    ('他的脚着地了。', 'Tā de jiǎo zháo dì le.', 'Tāde jiǎo zháodìle.')])
def test_round_nine_pinyin_cuts(gen, hz, py, want):
    assert gen.normalize_py(hz, py) == want


def test_one_hundred_is_exempt_from_the_bare_hanzi_rule(gen):
    e = {'readings': [{'groups': [{'pos': 'Số từ', 'senses': [{'vi': 'trăm', 'ex': {'ai': True, 'hz': '一百块钱够吗？'}}]}]}]}
    assert gen.standins('百', e, {}) == []


def test_main_reading_overrides_cover_ji3_and_zhong1(gen):
    assert gen.MAIN_OVERRIDE['几'] == 'jǐ' and gen.MAIN_OVERRIDE['中'] == 'zhōng'


def test_straight_quotes_alternate_open_and_close(gen):
    assert gen.normalize_py('硬币的一面叫做"公"。', 'Yìngbì de yī miàn jiàozuò" gōng".') == 'Yìngbìde yī miàn jiàozuò "gōng".'


def test_a_bound_form_sense_without_a_note_is_sent_back(word, monkeypatch):
    src = word.source('打')[0]
    src[0]['senses']['0.1'] = '(bound form) to play'
    monkeypatch.setattr(word, 'source', lambda hz: (src, []))
    audit = {'bad_example': [], 'common': [], 'bound': [], 'missing': []}
    calls = []
    def llm(prompt):
        calls.append(prompt)
        return audit if 'bound_form' in prompt and 'Kiểm tra' in prompt else bare_answer()
    word.entry('打', {}, llm)
    assert any('lấy từ dòng' in c and 'Bản trước cần sửa' in c for c in calls)


@pytest.mark.parametrize('hz,py,want', [
    ('这本书我看过两回。', 'Zhè běn shū wǒ kàn guo liǎng huí.', 'Zhè běn shū wǒ kànguo liǎnghuí.'),
    ('那本书是我的。', 'Nà běn shū shì wǒ de.', 'Nà běn shū shì wǒde.'),
    ('这条路很长。', 'Zhè tiáo lù hěn cháng.', 'Zhè tiáo lù hěn cháng.'),
    ('每本书都很好。', 'Měi běn shū dōu hěn hǎo.', 'Měi běn shū dōu hěn hǎo.')])
def test_demonstrative_classifier_and_noun_are_three_words(gen, hz, py, want):
    assert gen.normalize_py(hz, py) == want


def test_every_hand_twin_folds_and_the_hand_sense_is_kept_by_identity(gen):
    senses = [{'vi': 'cảm ơn'}, {'vi': 'cảm ơn', 'pos': 'v', 'example': 's-w-1'}, {'vi': 'cảm ơn', 'pos': 'interj', 'example': 's-w-2'}]
    folded = gen.fold_hand(senses)
    assert folded == [{'vi': 'cảm ơn', 'pos': 'v', 'example': 's-w-1', 'note': 'hand'}]


def test_a_repeated_gloss_is_sent_back(word):
    a = bare_answer()
    a['readings'][0]['groups'][0]['senses'][1]['vi'] = 'đánh (khác)'
    calls = []
    def llm(prompt):
        calls.append(prompt)
        return a if len(calls) == 1 else bare_answer()
    word.entry('打', {}, llm)
    assert any('cùng lời giải thích' in c for c in calls[1:])


def test_a_reviewer_hint_reaches_the_entry_prompt(word, monkeypatch):
    monkeypatch.setitem(word.HINTS, '打', 'không dùng 比')
    seen = []
    word.entry('打', {}, lambda p: seen.append(p) or bare_answer())
    assert 'không dùng 比' in seen[0]


def test_a_doubled_bound_note_collapses_to_the_union_in_order(gen):
    assert gen.collapse_notes('cung cấp (chỉ dùng trong 供给, 补给; chỉ dùng trong 供给, 补给, 配给)') == 'cung cấp (chỉ dùng trong 供给, 补给, 配给)'
    assert gen.collapse_notes('năng lượng (vật lý; chỉ dùng trong 能量, 能源; chỉ dùng trong 能源, 核能)') == 'năng lượng (vật lý; chỉ dùng trong 能量, 能源, 核能)'
    assert gen.collapse_notes('ăn (chỉ dùng trong 吃饭)') == 'ăn (chỉ dùng trong 吃饭)'


def test_a_doubled_bound_note_is_sent_back(word):
    a = bare_answer()
    a['readings'][0]['groups'][0]['senses'][1]['vi'] = 'đánh (chỉ dùng trong 打算盘; chỉ dùng trong 打算盘, 打字)'
    calls = []
    def llm(prompt):
        calls.append(prompt)
        return a if len(calls) == 1 else bare_answer()
    word.entry('打', {}, llm)
    assert any('có hai ghi chú' in c for c in calls[1:])


@pytest.mark.parametrize('hz,py,want', [
    ('他每分钟打字。', 'Tā měifēnzhōng dǎ zì.', 'Tā měi fēnzhōng dǎzì.'),
    ('工人们在打地基。', 'Gōngrén men zài dǎ dìjī.', 'Gōngrénmen zài dǎ dìjī.')])
def test_vocabulary_after_a_demonstrative_stays_whole_and_men_attaches(gen, hz, py, want):
    assert gen.normalize_py(hz, py) == want

@pytest.mark.parametrize('hz,py,want', [
    ('学生', 'xué sheng', 'xuésheng'),
    ('大学生', 'dà xué shēng', 'dàxuéshēng'),
    ('电话', 'diàn huà', 'diànhuà'),
    ('中国', 'Zhōng guó', 'Zhōngguó'),
    ('女儿', 'nǚ ér', "nǚ'ér"),
    ('不客气', 'bù kè qi', 'bù kèqi'),
    ('有一些', 'yǒu yī xiē', 'yǒu yīxiē'),
    ('请坐', 'qǐng zuò', 'qǐng zuò'),
    ('哪儿', 'nǎ r', 'nǎr'),
    ('这儿', 'zhè r', 'zhèr'),
    ('一点儿', 'yī diǎn r', 'yīdiǎnr'),
    ('面条儿', 'miàn tiáo r', 'miàntiáor'),
    ('日本', 'Rì běn', 'Rìběn'),
    ('一般', 'yībān', 'yībān')])
def test_headword_pinyin_groups_by_word_and_joins_erhua(gen, hz, py, want):
    assert gen.normalize_py(hz, py, capital=py[:1].isupper(), override=gen.OVERRIDE) == want


@pytest.mark.parametrize('hz,py,want', [
    ('第二', 'dì èr', 'dì-èr'),
    ('打电话', 'dǎ diàn huà', 'dǎ diànhuà'),
    ('干什么', 'gàn shén me', 'gàn shénme'),
    ('没什么', 'méi shén me', 'méi shénme'),
    ('开玩笑', 'kāi wán xiào', 'kāi wánxiào'),
    ('下雨', 'xià yǔ', 'xià yǔ'),
    ('上车', 'shàng chē', 'shàng chē'),
    ('下车', 'xià chē', 'xià chē'),
    ('没关系', 'méi guān xi', 'méi guānxi'),
    ('星期天', 'Xīng qī tiān', 'xīngqītiān'),
    ('星期日', 'Xīng qī rì', 'xīngqīrì'),
    ('星期三', 'Xīng qī sān', 'xīngqīsān'),
    ('你好', 'nǐ hǎo', 'nǐ hǎo'),
    ('星期', 'xīng qī', 'xīngqī')])
def test_headword_pinyin_phrase_overrides_and_lower_case_weekdays(gen, hz, py, want):
    assert gen.normalize_py(hz, py, capital=py[:1].isupper(), override=gen.OVERRIDE) == want


def test_headword_override_matches_whole_headword_only(gen):
    assert gen.normalize_py('没关系。', 'Méi guān xi.', override=gen.OVERRIDE) == 'Méiguānxi.'
    assert gen.normalize_py('学生', 'xué sheng', capital=False) == 'xuésheng'
    assert gen.normalize_py('学生', 'xué sheng') == 'Xuésheng'


def test_every_staged_headword_is_a_fixed_point_of_normalize_py(gen):
    out = gen.ROOT / '.cache/words/out'
    if not out.exists():
        pytest.skip('no staged corpus')
    moved = []
    for f in sorted((out / 'words').glob('*.yaml')):
        w = yaml.safe_load(f.read_text(encoding='utf-8'))
        py = gen.normalize_py(w['hanzi'], w['pinyin'], capital=w['pinyin'][:1].isupper(), override=gen.OVERRIDE)
        if py != w['pinyin']:
            moved.append((w['id'], w['pinyin'], py))
    assert moved == []


def test_level_2_stages_and_promotes_its_own_sentence_file(gen):
    # Arrange
    gen.LEVEL = 2
    out = gen.out_dir()
    (out / 'words').mkdir(parents=True)
    (out / 'words/打算.yaml').write_text(yaml.safe_dump({'id': '打算', 'hanzi': '打算', 'senses': [{'vi': 'định', 'example': 's-w-new'}], 'examples': ['s-w-new', 's-w-shared']}, allow_unicode=True), encoding='utf-8')
    (out / 'sentences').mkdir()
    (out / 'sentences/hsk2.yaml').write_text(yaml.safe_dump([{'id': 's-w-new', 'hanzi': '新'}, {'id': 's-w-shared', 'hanzi': '旧'}], allow_unicode=True), encoding='utf-8')
    hsk1 = gen.CONTENT.parent / 'sentences/hsk1.yaml'
    hsk1.parent.mkdir(parents=True)
    hsk1.write_text(yaml.safe_dump([{'id': 's-w-shared', 'hanzi': '旧'}], allow_unicode=True), encoding='utf-8')
    (out / 'review-1.md').write_text(f'staged-set sha: {gen.staged_sha(out)}', encoding='utf-8')

    # Act
    gen.promote(out, 1)

    # Assert
    assert out.name == 'out-hsk2'
    ids = [s['id'] for s in yaml.safe_load((gen.CONTENT.parent / 'sentences/hsk2.yaml').read_text(encoding='utf-8'))]
    assert ids == ['s-w-new']
    assert [s['id'] for s in yaml.safe_load(hsk1.read_text(encoding='utf-8'))] == ['s-w-shared']


def test_promote_keeps_a_sentence_only_another_levels_word_cites(gen):
    # Arrange
    out = stage_words(gen, 1)
    staged = out / 'sentences/hsk1.yaml'
    staged.write_text(staged.read_text(encoding='utf-8') + yaml.safe_dump([{'id': 's-w-cited-by-hsk2', 'hanzi': '旧'}], allow_unicode=True), encoding='utf-8')
    gen.CONTENT.mkdir(parents=True, exist_ok=True)
    (gen.CONTENT / '打算.yaml').write_text(yaml.safe_dump({'id': '打算', 'hanzi': '打算', 'level': 2, 'senses': [{'vi': 'định'}], 'examples': ['s-w-cited-by-hsk2']}, allow_unicode=True), encoding='utf-8')
    gen.review(out, 1)

    # Act
    gen.promote(out, 1)

    # Assert
    ids = [s['id'] for s in yaml.safe_load((gen.CONTENT.parent / 'sentences/hsk1.yaml').read_text(encoding='utf-8'))]
    assert 's-w-cited-by-hsk2' in ids
