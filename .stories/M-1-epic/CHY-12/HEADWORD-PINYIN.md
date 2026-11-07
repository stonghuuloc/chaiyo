# Headword pinyin spacing — proposal (LOC-108)

**Status: proposal.** Docs only. This note changes nothing in `content/words`; the data change happens only after
Loc approves the rule and a re-promote runs. Ticket: [issue #50](https://github.com/stonghuuloc/chaiyo/issues/50).

Decision 26 of S2 (`.stories/M-1-epic/CHY-12/slices/S2-hsk1-corpus-run-rare-flag-loc-spot-check/DISCUSSION.md`)
recorded the current behaviour as "headword pinyin stays per syllable". This note proposes to supersede it.

## The problem

`content/words` holds two pinyin-spacing conventions at once.

| Where | Where the pinyin comes from | Example |
|---|---|---|
| 57 hand-written word files (initial commit, levels 1–5) | authored | 一般 `yībān`, 关系 `guānxi`, 习惯 `xíguàn` |
| 546 generated HSK1 word files (promote `dd750eb`) | the HSK source reading, copied verbatim by `canon()` | 学生 `xué sheng`, 大学生 `dà xué shēng`, 电话 `diàn huà` |
| 1,335 generated sentences | `normalize_py()` — jieba word cuts | `Nǐ shì xuésheng.`, `Méiguānxi.` |
| 19 hand-written h1-01 sentences | authored | `nǐ hǎo`, `méi guānxi`, `duìbuqǐ` |

The per-syllable form in the generated word files is not a design decision. The HSK source
(`complete.min.json`, reading field `f[].i.y`) writes one space per syllable in 10,094 of its 12,623 readings, and
`to_yaml()` writes that string unchanged. `normalize_py()` is never called for a headword.

The erhua defect follows from the same source style: the source writes 儿 as its own syllable (`nǎ r`), so 14
headwords print a lone `r`. Sentence pinyin already attaches it (`yīdiǎnr`).

## Proposed rule

Pinyin groups by word, in headwords as in sentences:

- the syllables of one word are joined: `xué shēng` → `xuésheng`;
- a space separates words only: `qǐng zuò` stays `qǐng zuò`;
- an erhua `r` joins the syllable before it: `nǎ r` → `nǎr`, `yī diǎn r` → `yīdiǎnr`;
- a proper noun keeps its capital: `Zhōng guó` → `Zhōngguó`;
- a weekday name is lower case: `Xīng qī tiān` → `xīngqītiān`;
- an a/o/e syllable inside a word takes the apostrophe: `nǚ ér` → `nǚ'ér`;
- `第` + number takes a hyphen (the standard's ordinal form): `dì èr` → `dì-èr`;
- a verb–object phrase the standard writes apart stays apart: `dǎ diàn huà` → `dǎ diànhuà`,
  `méi guān xi` → `méi guānxi`.

| Word | Today | Proposed |
|---|---|---|
| 学生 | `xué sheng` | `xuésheng` |
| 大学生 | `dà xué shēng` | `dàxuéshēng` |
| 电话 | `diàn huà` | `diànhuà` |
| 中国 | `Zhōng guó` | `Zhōngguó` |
| 女儿 | `nǚ ér` | `nǚ'ér` |
| 第二 | `dì èr` | `dì-èr` |
| 打电话 | `dǎ diàn huà` | `dǎ diànhuà` |
| 没关系 | `méi guān xi` | `méi guānxi` |
| 星期天 | `Xīng qī tiān` | `xīngqītiān` |
| 星期 | `xīng qī` | `xīngqī` |
| 不客气 | `bù kè qi` | `bù kèqi` |
| 有一些 | `yǒu yī xiē` | `yǒu yīxiē` |
| 请坐 | `qǐng zuò` | `qǐng zuò` (unchanged: two words) |
| 哪儿 | `nǎ r` | `nǎr` |
| 一点儿 | `yī diǎn r` | `yīdiǎnr` |
| 面条儿 | `miàn tiáo r` | `miàntiáor` |
| 一般 (hand) | `yībān` | `yībān` (unchanged) |

**Why grouped and not per syllable everywhere.** Keeping per-syllable headwords would instead re-space the 55
grouped hand-written files (`yī bān`, `guān xi`): 69 files against 290. But the product would keep two
conventions — a word and its own example sentence would print the same pinyin differently — and the erhua `r`
would still need a rule of its own. Grouping matches the sentences, the hand-written word files and the hand
lesson sentences already.

## Affected words

290 of the 603 files in `content/words` change one field, `pinyin`. All 290 carry a generated pinyin; no
hand-authored pinyin is touched.

- 283 are generated-only files; 7 are generated files that also had a pre-existing hand file (不客气, 你们, 再见,
  对不起, 没关系, 谢谢, 起床).
- The 57 files that still keep hand-authored pinyin are untouched. 55 of them are already grouped; 你好 is `nǐ hǎo`
  (two words); one is a single syllable.
- All 14 erhua headwords are in the 290; they are the only ones where the fix is not pure de-spacing:

| Word | Today | Proposed |
|---|---|---|
| 一下儿 | `yī xià r` | `yīxiàr` |
| 一会儿 | `yī huì r` | `yīhuìr` |
| 一块儿 | `yī kuài r` | `yīkuàir` |
| 一点儿 | `yī diǎn r` | `yīdiǎnr` |
| 哪儿 | `nǎ r` | `nǎr` |
| 女孩儿 | `nǚ hái r` | `nǚháir` |
| 好玩儿 | `hǎo wán r` | `hǎowánr` |
| 小孩儿 | `xiǎo hái r` | `xiǎoháir` |
| 没事儿 | `méi shì r` | `méishìr` |
| 玩儿 | `wán r` | `wánr` |
| 男孩儿 | `nán hái r` | `nánháir` |
| 这儿 | `zhè r` | `zhèr` |
| 那儿 | `nà r` | `nàr` |
| 面条儿 | `miàn tiáo r` | `miàntiáor` |

The change is spacing, one apostrophe (女儿), one hyphen (第二) and lower case for the two 星期 headwords.
Comparing all 290 case-insensitively with the spaces, apostrophes and hyphens removed shows no syllable or tone
change. Three words the general cut would have joined are already spelled apart in the data and stay unchanged
(上车, 下车, 下雨); the override table keeps them that way.

## The `normalize_py` change

Four edits in `scripts/gen-entries.py`. No content file is edited by hand.

```python
OVERRIDE = {  # NEW: the standard's spelling for headwords the general cut gets wrong
    '第二': 'dì-èr', '打电话': 'dǎ diànhuà', '干什么': 'gàn shénme', '没什么': 'méi shénme',
    '开玩笑': 'kāi wánxiào', '下雨': 'xià yǔ', '上车': 'shàng chē', '下车': 'xià chē',
    '没关系': 'méi guānxi', '星期天': 'xīngqītiān', '星期日': 'xīngqīrì',
}

def normalize_py(hz, py, classifiers=(), capital=True, override=None):
    if override and hz in override:   # whole-headword match only; sentence pinyin is not re-cut
        return override[hz]
    py = re.sub(r'\s+r\b', 'r', py)   # the source writes the erhua tail as its own syllable, 'nǎ r' -> 'nǎr'
    ...                               # (a real r-initial syllable such as 日本 rì is not touched)
    return cut_py(hz, py, classifiers, capital)

def cut_py(hz, py, classifiers, capital=True):
    ...
    return (out[:1].upper() + out[1:]) if capital else out   # sentences keep the capital; headwords keep the source case
```

1. **Erhua.** Joining the lone `r` before `split_syllables()` lets the existing erhua branch
   (`len(syls) == len(chars) - chars.count('儿')`) pair it with 儿. A staged sentence carries no lone `r`, so the
   join changes no sentence that the fixpoint test already covers.
2. **Case.** Add the `capital` flag: sentence callers keep `True`; the headword caller passes the source's
   first-letter case (`proper[:1].isupper()`) so a proper noun keeps its capital (decision 20) and an ordinary word
   stays lower case instead of becoming `Xuésheng`.
3. **Writer.** In `to_yaml()`, write `w['pinyin'] = normalize_py(hz, proper, capital=proper[:1].isupper(),
   override=OVERRIDE)` instead of copying `proper`. `restage()` re-applies the same call and compares its output
   with `w['pinyin']`; today it only compares the source string's case, which would restore the ungrouped source
   string on the next staging run. Add a pytest that every staged headword is a fixed point of `normalize_py`, next
   to `test_every_staged_sentence_is_a_fixed_point_of_normalize_py`.
4. **Override table.** The general cut is wrong for a closed set the standard spells differently. The exact-match
   table above, consulted before the cut, fixes them:

   | Headword | Override | Rule it applies |
   |---|---|---|
   | 第二 | `dì-èr` | `第` + number: hyphen |
   | 打电话 | `dǎ diànhuà` | verb + object: two words |
   | 干什么 | `gàn shénme` | verb + object |
   | 没什么 | `méi shénme` | 没 + 什么 |
   | 开玩笑 | `kāi wánxiào` | verb + object |
   | 下雨 | `xià yǔ` | verb + object |
   | 上车 / 下车 | `shàng chē` / `xià chē` | verb + object |
   | 没关系 | `méi guānxi` | 没 + 关系 |
   | 星期天 / 星期日 | `xīngqītiān` / `xīngqīrì` | weekday name: lower case |
   | 星期一 … 星期六 | `xīngqīyī` … `xīngqīliù` | lower case (no such headword today) |

   The table matches a whole headword only, so the approved sentence pinyin keeps its current cuts. It settles the
   `没关系` phrase cut: the headword now reads `méi guānxi`, the same as `h1-01`.

## What it costs

- `staged_sha()` covers words and sentences, so the promoted sha changes. The change must run through
  `--restage`, a fresh `--sample --seed N` page and Loc's approval (AC5) before `--promote`. It is not a hand edit
  of `content/words`.
- No audio change: word and sentence audio keys hash the hanzi (or the id of a split reading), and syllable keys
  hash the syllable text; none reads `Word.pinyin`.
- Importer and lint need no change: `deriveHanViet` splits grouped pinyin and handles erhua (`hanviet.ts`), and
  lint check 3 reads tone marks and digits only (`3-tone-marks.ts`).

## Not in this note

`content/dictionary.json` carries the same per-syllable source spacing (`学生` `xué sheng`); it is outside this
issue and stays as it is.

## Appendix — the 290 changed words

Proposed strings are the output of the current `normalize_py` plus the erhua join, the case rule and the override
table of this note, run over all 603 files of `content/words`. Erhua words are marked.

| Word | Today | Proposed |
|---|---|---|
| 一下儿 | yī xià r | yīxiàr *(erhua)* |
| 一些 | yī xiē | yīxiē |
| 一会儿 | yī huì r | yīhuìr *(erhua)* |
| 一半 | yī bàn | yībàn |
| 一块儿 | yī kuài r | yīkuàir *(erhua)* |
| 一样 | yī yàng | yīyàng |
| 一点儿 | yī diǎn r | yīdiǎnr *(erhua)* |
| 一起 | yī qǐ | yīqǐ |
| 一边 | yī biān | yībiān |
| 上午 | shàng wǔ | shàngwǔ |
| 上学 | shàng xué | shàngxué |
| 上次 | shàng cì | shàngcì |
| 上班 | shàng bān | shàngbān |
| 上网 | shàng wǎng | shàngwǎng |
| 上课 | shàng kè | shàngkè |
| 上边 | shàng bian | shàngbian |
| 下午 | xià wǔ | xiàwǔ |
| 下次 | xià cì | xiàcì |
| 下班 | xià bān | xiàbān |
| 下课 | xià kè | xiàkè |
| 下边 | xià bian | xiàbian |
| 不客气 | bù kè qi | bù kèqi |
| 不用 | bù yòng | bùyòng |
| 东西 | dōng xī | dōngxī |
| 东西 | dōng xi | dōngxi |
| 东边 | dōng bian | dōngbian |
| 中午 | zhōng wǔ | zhōngwǔ |
| 中国 | Zhōng guó | Zhōngguó |
| 中学 | zhōng xué | zhōngxué |
| 中学生 | zhōng xué shēng | zhōngxuéshēng |
| 中文 | Zhōng wén | Zhōngwén |
| 中间 | zhōng jiān | zhōngjiān |
| 书包 | shū bāo | shūbāo |
| 书店 | shū diàn | shūdiàn |
| 什么 | shén me | shénme |
| 今天 | jīn tiān | jīntiān |
| 今年 | jīn nián | jīnnián |
| 介绍 | jiè shào | jièshào |
| 他们 | tā men | tāmen |
| 休息 | xiū xi | xiūxi |
| 你们 | nǐ men | nǐmen |
| 儿子 | ér zi | érzi |
| 先生 | xiān sheng | xiānsheng |
| 关上 | guān shàng | guānshàng |
| 再见 | zài jiàn | zàijiàn |
| 准备 | zhǔn bèi | zhǔnbèi |
| 出去 | chū qù | chūqù |
| 出来 | chū lái | chūlái |
| 别人 | bié ren | biéren |
| 别的 | bié de | biéde |
| 前天 | qián tiān | qiántiān |
| 前边 | qián bian | qiánbian |
| 动作 | dòng zuò | dòngzuò |
| 包子 | bāo zi | bāozi |
| 北京 | Běi jīng | Běijīng |
| 北边 | běi biān | běibiān |
| 医生 | yī shēng | yīshēng |
| 医院 | yī yuàn | yīyuàn |
| 午饭 | wǔ fàn | wǔfàn |
| 半天 | bàn tiān | bàntiān |
| 半年 | bàn nián | bànnián |
| 南边 | nán bian | nánbian |
| 去年 | qù nián | qùnián |
| 右边 | yòu bian | yòubian |
| 吃饭 | chī fàn | chīfàn |
| 同学 | tóng xué | tóngxué |
| 名字 | míng zi | míngzi |
| 后天 | hòu tiān | hòutiān |
| 后边 | hòu bian | hòubian |
| 听写 | tīng xiě | tīngxiě |
| 听到 | tīng dào | tīngdào |
| 听见 | tīng jiàn | tīngjiàn |
| 告诉 | gào su | gàosu |
| 哥哥 | gē ge | gēge |
| 哪些 | nǎ xiē | nǎxiē |
| 哪儿 | nǎ r | nǎr *(erhua)* |
| 哪里 | nǎ lǐ | nǎlǐ |
| 唱歌 | chàng gē | chànggē |
| 商场 | shāng chǎng | shāngchǎng |
| 商店 | shāng diàn | shāngdiàn |
| 喜欢 | xǐ huan | xǐhuan |
| 回到 | huí dào | huídào |
| 回去 | huí qu | huíqu |
| 回家 | huí jiā | huíjiā |
| 回来 | huí lai | huílai |
| 回答 | huí dá | huídá |
| 国外 | guó wài | guówài |
| 国家 | guó jiā | guójiā |
| 图书馆 | tú shū guǎn | túshūguǎn |
| 在家 | zài jiā | zàijiā |
| 地上 | dì shang | dìshang |
| 地图 | dì tú | dìtú |
| 地方 | dì fāng | dìfāng |
| 地方 | dì fang | dìfang |
| 地点 | dì diǎn | dìdiǎn |
| 坐下 | zuò xia | zuòxia |
| 外国 | wài guó | wàiguó |
| 外语 | wài yǔ | wàiyǔ |
| 外边 | wài bian | wàibian |
| 多少 | duō shao | duōshao |
| 多少 | duō shǎo | duōshǎo |
| 大学 | dà xué | dàxué |
| 大学生 | dà xué shēng | dàxuéshēng |
| 天气 | tiān qì | tiānqì |
| 女人 | nǚ ren | nǚren |
| 女人 | nǚ rén | nǚrén |
| 女儿 | nǚ ér | nǚ'ér |
| 女孩儿 | nǚ hái r | nǚháir *(erhua)* |
| 女朋友 | nǚ péng you | nǚpéngyou |
| 女生 | nǚ shēng | nǚshēng |
| 奶奶 | nǎi nai | nǎinai |
| 她们 | tā men | tāmen |
| 好吃 | hǎo chī | hǎochī |
| 好听 | hǎo tīng | hǎotīng |
| 好玩儿 | hǎo wán r | hǎowánr *(erhua)* |
| 好看 | hǎo kàn | hǎokàn |
| 妈妈 | mā ma | māma |
| 妹妹 | mèi mei | mèimei |
| 姐姐 | jiě jie | jiějie |
| 学习 | xué xí | xuéxí |
| 学校 | xué xiào | xuéxiào |
| 学生 | xué sheng | xuésheng |
| 学院 | xué yuàn | xuéyuàn |
| 孩子 | hái zi | háizi |
| 家人 | jiā rén | jiārén |
| 家里 | jiā lǐ | jiālǐ |
| 对不起 | duì bu qǐ | duìbuqǐ |
| 小姐 | xiǎo jie | xiǎojie |
| 小学 | xiǎo xué | xiǎoxué |
| 小学生 | xiǎo xué shēng | xiǎoxuéshēng |
| 小孩儿 | xiǎo hái r | xiǎoháir *(erhua)* |
| 小时 | xiǎo shí | xiǎoshí |
| 小朋友 | xiǎo péng yǒu | xiǎopéngyǒu |
| 工人 | gōng rén | gōngrén |
| 工作 | gōng zuò | gōngzuò |
| 左边 | zuǒ bian | zuǒbian |
| 帮忙 | bāng máng | bāngmáng |
| 常常 | cháng cháng | chángcháng |
| 干什么 | gàn shén me | gàn shénme |
| 干净 | gān jìng | gānjìng |
| 开会 | kāi huì | kāihuì |
| 开玩笑 | kāi wán xiào | kāi wánxiào |
| 开车 | kāi chē | kāichē |
| 弟弟 | dì di | dìdi |
| 得到 | dé dào | dédào |
| 忘记 | wàng jì | wàngjì |
| 怎么 | zěn me | zěnme |
| 我们 | wǒ men | wǒmen |
| 房子 | fáng zi | fángzi |
| 房间 | fáng jiān | fángjiān |
| 手机 | shǒu jī | shǒujī |
| 打开 | dǎ kāi | dǎkāi |
| 打球 | dǎ qiú | dǎqiú |
| 打电话 | dǎ diàn huà | dǎ diànhuà |
| 打车 | dǎ chē | dǎchē |
| 找到 | zhǎo dào | zhǎodào |
| 放假 | fàng jià | fàngjià |
| 放学 | fàng xué | fàngxué |
| 教学楼 | jiào xué lóu | jiàoxuélóu |
| 新年 | xīn nián | xīnnián |
| 旁边 | páng biān | pángbiān |
| 日期 | rì qī | rìqī |
| 早上 | zǎo shang | zǎoshang |
| 早饭 | zǎo fàn | zǎofàn |
| 时候 | shí hou | shíhou |
| 时间 | shí jiān | shíjiān |
| 明天 | míng tiān | míngtiān |
| 明年 | míng nián | míngnián |
| 明白 | míng bai | míngbai |
| 星期 | xīng qī | xīngqī |
| 星期天 | Xīng qī tiān | xīngqītiān |
| 星期日 | Xīng qī rì | xīngqīrì |
| 昨天 | zuó tiān | zuótiān |
| 是不是 | shì bù shì | shìbùshì |
| 晚上 | wǎn shang | wǎnshang |
| 晚饭 | wǎn fàn | wǎnfàn |
| 最后 | zuì hòu | zuìhòu |
| 最好 | zuì hǎo | zuìhǎo |
| 有一些 | yǒu yī xiē | yǒu yīxiē |
| 有些 | yǒu xiē | yǒuxiē |
| 有名 | yǒu míng | yǒumíng |
| 有时 | yǒu shí | yǒushí |
| 有时候 | yǒu shí hou | yǒushíhou |
| 有用 | yǒu yòng | yǒuyòng |
| 有的 | yǒu de | yǒude |
| 朋友 | péng you | péngyou |
| 本子 | běn zi | běnzi |
| 机场 | jī chǎng | jīchǎng |
| 机票 | jī piào | jīpiào |
| 来到 | lái dào | láidào |
| 杯子 | bēi zi | bēizi |
| 桌子 | zhuō zi | zhuōzi |
| 楼上 | lóu shàng | lóushàng |
| 楼下 | lóu xià | lóuxià |
| 正在 | zhèng zài | zhèngzài |
| 水果 | shuǐ guǒ | shuǐguǒ |
| 汉字 | hàn zì | hànzì |
| 汉语 | Hàn yǔ | Hànyǔ |
| 汽车 | qì chē | qìchē |
| 没事儿 | méi shì r | méishìr *(erhua)* |
| 没什么 | méi shén me | méi shénme |
| 没关系 | méi guān xi | méi guānxi |
| 没有 | méi yǒu | méiyǒu |
| 洗手间 | xǐ shǒu jiān | xǐshǒujiān |
| 火车 | huǒ chē | huǒchē |
| 爱好 | ài hào | àihào |
| 爷爷 | yé ye | yéye |
| 爸爸 | bà ba | bàba |
| 牛奶 | niú nǎi | niúnǎi |
| 玩儿 | wán r | wánr *(erhua)* |
| 现在 | xiàn zài | xiànzài |
| 生日 | shēng rì | shēngrì |
| 生气 | shēng qì | shēngqì |
| 生病 | shēng bìng | shēngbìng |
| 电影 | diàn yǐng | diànyǐng |
| 电影院 | diàn yǐng yuàn | diànyǐngyuàn |
| 电脑 | diàn nǎo | diànnǎo |
| 电视 | diàn shì | diànshì |
| 电视机 | diàn shì jī | diànshìjī |
| 电话 | diàn huà | diànhuà |
| 男人 | nán rén | nánrén |
| 男孩儿 | nán hái r | nánháir *(erhua)* |
| 男朋友 | nán péng you | nánpéngyou |
| 男生 | nán shēng | nánshēng |
| 病人 | bìng rén | bìngrén |
| 白天 | bái tiān | báitiān |
| 看到 | kàn dào | kàndào |
| 看病 | kàn bìng | kànbìng |
| 看见 | kàn jiàn | kànjiàn |
| 真的 | zhēn de | zhēnde |
| 睡觉 | shuì jiào | shuìjiào |
| 知识 | zhī shi | zhīshi |
| 知道 | zhī dào | zhīdào |
| 第二 | dì èr | dì-èr |
| 米饭 | mǐ fàn | mǐfàn |
| 网上 | wǎng shàng | wǎngshàng |
| 网友 | wǎng yǒu | wǎngyǒu |
| 老人 | lǎo rén | lǎorén |
| 老师 | lǎo shī | lǎoshī |
| 考试 | kǎo shì | kǎoshì |
| 衣服 | yī fu | yīfu |
| 西边 | xī biān | xībiān |
| 见面 | jiàn miàn | jiànmiàn |
| 觉得 | jué de | juéde |
| 认真 | rèn zhēn | rènzhēn |
| 认识 | rèn shi | rènshi |
| 记住 | jì zhu | jìzhu |
| 记得 | jì de | jìde |
| 说话 | shuō huà | shuōhuà |
| 请假 | qǐng jià | qǐngjià |
| 请问 | qǐng wèn | qǐngwèn |
| 读书 | dú shū | dúshū |
| 课文 | kè wén | kèwén |
| 课本 | kè běn | kèběn |
| 谢谢 | xiè xie | xièxie |
| 走路 | zǒu lù | zǒulù |
| 起床 | qǐ chuáng | qǐchuáng |
| 起来 | qǐ lai | qǐlai |
| 路上 | lù shang | lùshang |
| 路口 | lù kǒu | lùkǒu |
| 身上 | shēn shang | shēnshang |
| 身体 | shēn tǐ | shēntǐ |
| 车票 | chē piào | chēpiào |
| 车站 | chē zhàn | chēzhàn |
| 还是 | hái shi | háishi |
| 还有 | hái yǒu | háiyǒu |
| 这些 | zhè xiē | zhèxiē |
| 这儿 | zhè r | zhèr *(erhua)* |
| 这边 | zhè biān | zhèbiān |
| 这里 | zhè lǐ | zhèlǐ |
| 进去 | jìn qù | jìnqù |
| 进来 | jìn lái | jìnlái |
| 那些 | nà xiē | nàxiē |
| 那儿 | nà r | nàr *(erhua)* |
| 那边 | nà bian | nàbian |
| 那里 | nà li | nàli |
| 里边 | lǐ bian | lǐbian |
| 重要 | zhòng yào | zhòngyào |
| 钱包 | qián bāo | qiánbāo |
| 门口 | mén kǒu | ménkǒu |
| 门票 | mén piào | ménpiào |
| 非常 | fēi cháng | fēicháng |
| 面包 | miàn bāo | miànbāo |
| 面条儿 | miàn tiáo r | miàntiáor *(erhua)* |
| 飞机 | fēi jī | fēijī |
| 饭店 | fàn diàn | fàndiàn |
| 马上 | mǎ shàng | mǎshàng |
| 马路 | mǎ lù | mǎlù |
| 高兴 | gāo xìng | gāoxìng |
| 鸡蛋 | jī dàn | jīdàn |
