// HSK 1 mock paper (HSK 3.0 Level 1 format): 2 sections × 4 parts × 5 items = 40 questions.
// Picture opts are keys of assets/words/mock-h1/<key>.png. Shared-bank parts (pic6, rpic6, reply6, gap6) keep the 6 options in part.opts.
// Item: { say?|text, q?, opts? (3-way parts), ans, why }.

export const MOCK = {
  id: 'h1-mock-1', level: 1,
  sections: [
    { key: 'nghe', title: 'Nghe', minutes: 12, plays: 2, parts: [
      { type: 'pic3', ask: 'Nghe rồi chọn tranh đúng', items: [
        { say: '飞机', opts: ['huoche', 'feiji', 'xuexiao'], ans: 'feiji', why: '飞机 (phi cơ) là máy bay.' },
        { say: '杯子', opts: ['shuijiao', 'shu', 'beizi'], ans: 'beizi', why: '杯子 (bôi tử) là cái cốc.' },
        { say: '医生', opts: ['yisheng', 'yiyuan', 'dianshi'], ans: 'yisheng', why: '医生 (y sinh) là bác sĩ, người; 医院 là nơi.' },
        { say: '打电话', opts: ['jidan', 'chifan', 'dadianhua'], ans: 'dadianhua', why: '打电话 là gọi điện thoại.' },
        { say: '下雨', opts: ['shouji', 'xiayu', 'zhuozi'], ans: 'xiayu', why: '下雨 là trời mưa.' },
      ] },
      { type: 'ans3', ask: 'Nghe câu hỏi rồi chọn câu trả lời', items: [
        { say: '你叫什么名字？', opts: ['我在家。', '我八岁。', '我叫大山。'], ans: '我叫大山。', why: '叫什么名字 hỏi tên, trả lời bằng 我叫…' },
        { say: '你今年几岁？', opts: ['我八岁。', '我在北京。', '我喝茶。'], ans: '我八岁。', why: '几岁 hỏi tuổi, trả lời bằng số + 岁.' },
        { say: '你想喝什么？', opts: ['我在学校。', '我想喝水。', '我是学生。'], ans: '我想喝水。', why: '喝什么 hỏi uống gì, trả lời 我想喝…' },
        { say: '你在哪儿？', opts: ['我在家。', '我很好。', '我有三个。'], ans: '我在家。', why: '在哪儿 hỏi ở đâu, trả lời 我在…' },
        { say: '现在几点？', opts: ['他是我哥哥。', '我不去。', '现在八点。'], ans: '现在八点。', why: '几点 hỏi giờ, trả lời số + 点.' },
      ] },
      { type: 'pic6', ask: 'Nghe đoạn hội thoại rồi chọn tranh đúng', opts: ['yiyuan', 'xuexiao', 'chifan', 'shuijiao', 'dianshi', 'daqiu'], items: [
        { say: '你在做什么？我在吃饭。', ans: 'chifan', why: '“我在吃饭” là đang ăn cơm.' },
        { say: '你去哪儿？我去医院。', ans: 'yiyuan', why: '“我去医院” là đi bệnh viện.' },
        { say: '你看什么？我看电视。', ans: 'dianshi', why: '“我看电视” là xem tivi.' },
        { say: '你累吗？我想睡觉。', ans: 'shuijiao', why: '“我想睡觉” là muốn đi ngủ.' },
        { say: '你去哪儿？我去打球。', ans: 'daqiu', why: '“我去打球” là đi chơi bóng.' },
      ] },
      { type: 'qa3', ask: 'Nghe câu rồi chọn đáp án cho câu hỏi', items: [
        { say: '我今天去医院看病。', q: '他去哪儿？', opts: ['学校', '医院', '商店'], ans: '医院', why: '“去医院看病”: đi bệnh viện khám bệnh.' },
        { say: '我爸爸是医生，我妈妈是老师。', q: '妈妈做什么工作？', opts: ['老师', '医生', '学生'], ans: '老师', why: '妈妈是老师; 医生 là bố.' },
        { say: '今天星期三，明天星期四。', q: '今天星期几？', opts: ['星期二', '星期四', '星期三'], ans: '星期三', why: '“今天星期三” nên hôm nay là thứ Tư.' },
        { say: '我有三个杯子，两个是白的。', q: '他有几个杯子？', opts: ['两个', '三个', '五个'], ans: '三个', why: '有三个杯子; 两个 chỉ là số cốc màu trắng.' },
        { say: '我坐火车去北京，坐飞机回家。', q: '他怎么回家？', opts: ['开车', '坐火车', '坐飞机'], ans: '坐飞机', why: '去 bằng tàu, 回家 bằng máy bay.' },
      ] },
    ] },
    { key: 'doc', title: 'Đọc', minutes: 20, parts: [
      { type: 'rpic6', ask: 'Đọc câu rồi chọn tranh đúng', opts: ['shu', 'diannao', 'mifan', 'yifu', 'cha', 'zhuozi'], items: [
        { text: '我在看书。', ans: 'shu', why: '看书 là đọc sách.' },
        { text: '他在用电脑。', ans: 'diannao', why: '电脑 là máy tính.' },
        { text: '我想吃米饭。', ans: 'mifan', why: '米饭 là cơm.' },
        { text: '我想买衣服。', ans: 'yifu', why: '衣服 là quần áo.' },
        { text: '我爱喝茶。', ans: 'cha', why: '茶 là trà.' },
      ] },
      { type: 'reply6', ask: 'Chọn câu trả lời cho câu hỏi', opts: ['我很好，谢谢。', '我叫大山。', '我是中国人。', '我去学校。', '不客气。', '再见。'], items: [
        { text: '你好吗？', ans: '我很好，谢谢。', why: '你好吗 hỏi thăm sức khỏe.' },
        { text: '你叫什么名字？', ans: '我叫大山。', why: '叫什么名字 hỏi tên.' },
        { text: '你是哪国人？', ans: '我是中国人。', why: '哪国人 hỏi quốc tịch.' },
        { text: '你去哪儿？', ans: '我去学校。', why: '去哪儿 hỏi đi đâu.' },
        { text: '谢谢！', ans: '不客气。', why: 'đáp lại 谢谢 là 不客气.' },
      ] },
      { type: 'gap6', ask: 'Chọn từ điền vào chỗ trống', opts: ['有', '很', '都', '想', '和', '的'], items: [
        { text: '我（ ）一个哥哥。', ans: '有', why: '有 = có: 我有一个哥哥.' },
        { text: '今天（ ）冷。', ans: '很', why: '很 đứng trước tính từ: 很冷.' },
        { text: '我们（ ）是学生。', ans: '都', why: '都 = đều: 我们都是学生.' },
        { text: '我（ ）喝水。', ans: '想', why: '想 + động từ = muốn: 我想喝水.' },
        { text: '我爸爸（ ）妈妈都在家。', ans: '和', why: '和 nối hai danh từ: 爸爸和妈妈.' },
      ] },
      { type: 'star3', ask: 'Đọc câu rồi chọn đáp án cho câu hỏi ★', items: [
        { text: '今天星期五，明天不上班。', q: '明天他上班吗？', opts: ['不上班', '上班', '去学校'], ans: '不上班', why: '“明天不上班”: mai không đi làm.' },
        { text: '我的手机不见了，我在找。', q: '他在做什么？', opts: ['看书', '打电话', '找手机'], ans: '找手机', why: '手机不见了 nên đang 找 (tìm).' },
        { text: '我家有四个人：爸爸、妈妈、哥哥和我。', q: '他家有几个人？', opts: ['三个人', '四个人', '五个人'], ans: '四个人', why: '爸爸、妈妈、哥哥 và 我 = 4 người.' },
        { text: '现在九点，我们九点半上课。', q: '几点上课？', opts: ['九点', '十点', '九点半'], ans: '九点半', why: '九点半 là 9 giờ rưỡi; 九点 là giờ hiện tại.' },
        { text: '我不想吃米饭，我想吃面条儿。', q: '他想吃什么？', opts: ['面条儿', '米饭', '鸡蛋'], ans: '面条儿', why: '不想吃米饭, 想吃面条儿.' },
      ] },
    ] },
  ],
};
