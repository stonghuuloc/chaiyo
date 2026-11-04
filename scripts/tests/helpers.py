import copy

HSK = {'s': '打', 'l': ['n1'], 'p': ['v'], 'f': [
    {'i': {'y': 'dǎ', 'n': 'da3'}, 'm': ['to hit', 'to play']},
    {'i': {'y': 'dá', 'n': 'da2'}, 'm': ['dozen']}]}
ROW = ['打', 'dǎ', 'da', 'đả', '', 1, [], [['dá', 'tá', []]]]


def sense(vi, src, common=True, ex=None):
    return {'vi': vi, 'src': src, 'common': common,
            'ex': ex or {'ai': True, 'hz': '他打球', 'py': 'Tā dǎ qiú', 'vi': 'Anh ấy chơi bóng.'}}


def answer(second_common=True, covered=('0.0', '0.1', '1.0'), dropped=(), ex0=None, ex1=None, pos='Động từ'):
    da3 = [sense('đánh', ['0.0'], ex=ex0),
           sense('chơi', ['0.1'], ex=ex1 or {'ai': True, 'hz': '打电话', 'py': 'Dǎ diànhuà', 'vi': 'Gọi điện.'})]
    da3 = [s for s in da3 if s['src'][0] in covered]
    readings = [{'pinyin': 'dǎ', 'hanviet': 'đả', 'groups': [{'pos': pos, 'senses': da3}]}]
    if '1.0' in covered:
        readings.append({'pinyin': 'dá', 'hanviet': 'tá', 'groups': [
            {'pos': 'Lượng từ', 'senses': [sense('tá', ['1.0'], second_common,
                                                  {'ai': True, 'hz': '一打纸', 'py': 'Yì dá zhǐ', 'vi': 'Một tá giấy.'})]}]})
    return {'readings': readings, 'dropped': list(dropped), 'luongtu': [], 'cannghia': []}


def scripted(*answers):
    calls = []
    def llm(prompt):
        calls.append(prompt)
        return copy.deepcopy(answers[min(len(calls), len(answers)) - 1])
    llm.calls = calls
    return llm
