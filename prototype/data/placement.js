// Placement test (O2). Per level: 6 reading (hanzi → nghĩa, no pinyin) + 4 listening (clip → chữ).
// DRAFT bank. Clips: audio/pl/<hanzi>.mp3 (edge-tts Xiaoxiao), answers only.
// Every item carries its OWN 3 distractors. No option appears twice in the whole test and no distractor is
// another item's answer, so earlier questions never leak later ones.
export const PASS = 8;   // ≥ 8/10 clears a level
export const BLOCKS = [
  { level: 1,
    read: [
      ['朋友', 'bạn bè', ['người thân', 'hàng xóm', 'đồng nghiệp']],
      ['喜欢', 'thích', ['muốn', 'biết', 'nhớ']],
      ['学校', 'trường học', ['bệnh viện', 'cửa hàng', 'nhà ga']],
      ['今天', 'hôm nay', ['ngày mai', 'hôm qua', 'năm nay']],
      ['医生', 'bác sĩ', ['giáo viên', 'học sinh', 'tài xế']],
      ['吃饭', 'ăn cơm', ['uống trà', 'đi ngủ', 'nấu ăn']]],
    listen: [
      ['谢谢', ['姐姐', '写字', '下雪']],
      ['再见', ['在家', '早上', '再来']],
      ['老师', ['老人', '学生', '同学']],
      ['飞机', ['非常', '电视', '汽车']]] },
  { level: 2,
    read: [
      ['已经', 'đã, rồi', ['vẫn còn', 'sắp sửa', 'thường xuyên']],
      ['准备', 'chuẩn bị', ['quyết định', 'bắt đầu', 'kết thúc']],
      ['旁边', 'bên cạnh', ['phía trước', 'bên trong', 'đối diện']],
      ['便宜', 'rẻ', ['đắt', 'mới', 'cũ']],
      ['觉得', 'cảm thấy', ['quên', 'hiểu', 'chờ đợi']],
      ['生病', 'bị ốm', ['đi làm', 'tập thể dục', 'nghỉ ngơi']]],
    listen: [
      ['机场', ['鸡蛋', '商场', '几张']],
      ['手机', ['手表', '书架', '送给']],
      ['运动', ['运气', '东西', '晚上']],
      ['时间', ['事情', '十点', '房间']]] },
  { level: 3,
    read: [
      ['认真', 'nghiêm túc, chăm chú', ['hài lòng', 'dũng cảm', 'bình thường']],
      ['环境', 'môi trường', ['lịch sử', 'khí hậu', 'xã hội']],
      ['担心', 'lo lắng', ['tức giận', 'ngạc nhiên', 'quan tâm']],
      ['突然', 'đột nhiên', ['cuối cùng', 'lập tức', 'thỉnh thoảng']],
      ['解决', 'giải quyết', ['phát hiện', 'đề nghị', 'ảnh hưởng']],
      ['习惯', 'thói quen', ['sở thích', 'tính cách', 'kế hoạch']]],
    listen: [
      ['比赛', ['比较', '必须', '鼻子']],
      ['健康', ['检查', '见面', '简单']],
      ['文化', ['问题', '变化', '文章']],
      ['安静', ['干净', '安排', '眼镜']]] },
  { level: 4,
    read: [
      ['范围', 'phạm vi', ['tiêu chuẩn', 'mục đích', 'phương diện']],
      ['积累', 'tích luỹ', ['phân tích', 'tổ chức', 'thương lượng']],
      ['竞争', 'cạnh tranh', ['hợp tác', 'phỏng vấn', 'tranh luận']],
      ['尽管', 'mặc dù', ['vì vậy', 'hơn nữa', 'nếu không']],
      ['失望', 'thất vọng', ['kiêu ngạo', 'xấu hổ', 'thất bại']],
      ['详细', 'chi tiết, tỉ mỉ', ['chính xác', 'đơn giản', 'nghiêm trọng']]],
    listen: [
      ['互相', ['互联网', '护士', '胡同']],
      ['经验', ['经济', '经历', '惊讶']],
      ['效果', ['效率', '笑话', '结果']],
      ['原因', ['原来', '愿意', '演员']]] },
  { level: 5,
    read: [
      ['承担', 'gánh vác', ['thừa nhận', 'từ chối', 'tuân thủ']],
      ['迫切', 'cấp bách', ['kiên nhẫn', 'linh hoạt', 'cụ thể']],
      ['犹豫', 'do dự', ['bình tĩnh', 'tự tin', 'hào phóng']],
      ['宝贵', 'quý báu', ['phổ biến', 'đơn điệu', 'tầm thường']],
      ['维护', 'giữ gìn, bảo vệ', ['phá hoại', 'thay thế', 'mở rộng']],
      ['逐渐', 'dần dần', ['đột ngột', 'mãi mãi', 'tạm thời']]],
    listen: [
      ['合同', ['合适', '和平', '盒子']],
      ['秩序', ['程序', '知识', '制度']],
      ['资源', ['自愿', '资格', '支援']],
      ['谨慎', ['紧张', '进行', '尽量']]] },
];

// Interleave R R L R L R R L R L. The page shuffles option order.
const ORDER = 'RRLRLRRLRL';
export function questions(block) {
  let r = 0, l = 0;
  return [...ORDER].map((k) => {
    if (k === 'R') { const [hz, vi, d] = block.read[r++]; return { t: 'read', hz, ans: vi, opts: [vi, ...d] }; }
    const [hz, d] = block.listen[l++];
    return { t: 'listen', hz, ans: hz, opts: [hz, ...d], key: `pl/${hz}` };
  });
}
