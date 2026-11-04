from pathlib import Path

from helpers import answer, scripted

FIXTURES = Path(__file__).parent / 'fixtures/out'
ROWS = {'5670795': ('他打球。', {'他', '打', '球'}, {'en': 'He plays ball.'})}


def golden_answer():
    a = answer(ex0={'tatoeba': '5670795', 'hz': '他打球', 'py': 'Tā dǎ qiú.', 'vi': 'Anh ấy chơi bóng.'})
    a['readings'][0]['groups'][0]['senses'][1]['common'] = False
    return a


def test_golden_fixture_matches_script_output(word):
    word.write_out([word.entry('打', ROWS, scripted(golden_answer()))])
    out = word.CACHE / 'out'
    for fixture in FIXTURES.rglob('*.yaml'):
        assert (out / fixture.relative_to(FIXTURES)).read_text() == fixture.read_text()
    assert {p.relative_to(out) for p in out.rglob('*.yaml')} == {p.relative_to(FIXTURES) for p in FIXTURES.rglob('*.yaml')}
