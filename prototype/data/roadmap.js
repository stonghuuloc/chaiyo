// Roadmap (T2). ALL lesson titles are a DRAFT outline (HSK标准教程 themes), not the generated syllabus.
// HSK2–5 rows are Vietnamese titles only (no hanzi) and fewer lessons than the ~350 estimate: shape only.
// Learner state for the prototype: Bài 0 passed, Bài 1 in progress, everything after locked.
export const LEVELS = [
  {
    level: 1, title: 'HSK 1', words: 300,
    primer: { n: 0, title: 'Nhập môn', hz: '拼音', href: 'l0-hub.html' },
    topics: [
      { title: 'Chào hỏi', lessons: [['Xin chào', '你好'], ['Bạn tên gì?', '你叫什么名字']] },
      { title: 'Gia đình', lessons: [['Gia đình', '我的家'], ['Đây là ai?', '这是谁'], ['Bạn mấy tuổi?', '你几岁'], ['Nhà bạn có mấy người?', '你家有几口人'], ['Bố mẹ làm nghề gì?', '做什么工作']] },
      { title: 'Quốc tịch và ngôn ngữ', lessons: [['Bạn là người nước nào?', '你是哪国人'], ['Tôi biết nói tiếng Trung', '我会说汉语'], ['Cô giáo tiếng Trung', '汉语老师'], ['Rất vui được gặp bạn', '认识你很高兴']] },
      { title: 'Số và thời gian', lessons: [['Số đếm', '一二三'], ['Hôm nay ngày mấy?', '今天几号'], ['Thứ mấy?', '星期几'], ['Bây giờ mấy giờ?', '现在几点'], ['Hôm qua, ngày mai', '昨天明天']] },
      { title: 'Ăn uống', lessons: [['Tôi muốn uống trà', '我想喝茶'], ['Bạn ăn gì?', '你吃什么'], ['Ở nhà hàng', '在饭馆'], ['Bao nhiêu tiền?', '多少钱'], ['Tôi thích ăn táo', '我喜欢吃苹果']] },
      { title: 'Nơi chốn', lessons: [['Ở đâu?', '在哪儿'], ['Tôi ngồi đây được không?', '我能坐这儿吗'], ['Trường học', '学校'], ['Đi bệnh viện', '去医院'], ['Ở nhà', '在家']] },
      { title: 'Thời tiết và đi lại', lessons: [['Thời tiết ngày mai', '明天天气'], ['Trời nóng, trời lạnh', '很热很冷'], ['Đi máy bay', '坐飞机'], ['Đi taxi', '坐出租车'], ['Bạn đến bằng gì?', '怎么来的']] },
      { title: 'Mua sắm', lessons: [['Mua quần áo', '买衣服'], ['Cái này đẹp', '这个很漂亮'], ['Mua bao nhiêu?', '买多少'], ['Cửa hàng', '商店']] },
      { title: 'Sinh hoạt', lessons: [['Gọi điện thoại', '打电话'], ['Nấu món Trung', '做中国菜'], ['Xem phim', '看电影'], ['Đi ngủ', '睡觉'], ['Bạn đang làm gì?', '你在做什么呢']] },
    ],
  },
  {
    level: 2, title: 'HSK 2', words: 500,
    topics: [
      { title: 'Thói quen hằng ngày', lessons: ['Mấy giờ bạn dậy?', 'Đi học bằng xe buýt', 'Buổi sáng ăn gì?', 'Cuối tuần làm gì?', 'Tôi đang tập thể dục'] },
      { title: 'Sức khỏe', lessons: ['Bạn bị làm sao?', 'Uống thuốc', 'Đi khám bác sĩ', 'Ngủ sớm dậy sớm'] },
      { title: 'Sở thích', lessons: ['Bạn thích môn thể thao nào?', 'Chơi bóng đá', 'Nghe nhạc, hát', 'Đọc sách', 'Chụp ảnh'] },
      { title: 'So sánh', lessons: ['Cao hơn, thấp hơn', 'Cái nào rẻ hơn?', 'Hôm nay lạnh hơn hôm qua', 'Giống nhau và khác nhau'] },
      { title: 'Du lịch', lessons: ['Bạn đã đến Bắc Kinh chưa?', 'Đặt phòng khách sạn', 'Hỏi đường', 'Mua vé tàu', 'Chuyến đi vui không?'] },
      { title: 'Công việc', lessons: ['Đi làm muộn', 'Gặp đồng nghiệp', 'Nghỉ phép', 'Công việc mới'] },
    ],
  },
  {
    level: 3, title: 'HSK 3', words: 1000,
    topics: [
      { title: 'Trường lớp', lessons: ['Kỳ thi sắp đến', 'Làm bài tập', 'Thầy cô và học sinh', 'Thư viện', 'Tốt nghiệp'] },
      { title: 'Nhà cửa', lessons: ['Thuê nhà', 'Dọn dẹp phòng', 'Hàng xóm', 'Chuyển nhà'] },
      { title: 'Cảm xúc', lessons: ['Đừng lo lắng', 'Tức giận', 'Vui quá đi', 'Nhớ nhà', 'Ngạc nhiên'] },
      { title: 'Thành phố', lessons: ['Giao thông giờ cao điểm', 'Công viên', 'Siêu thị', 'Ngân hàng'] },
      { title: 'Lễ hội', lessons: ['Tết Nguyên đán', 'Tết Trung thu', 'Sinh nhật', 'Tặng quà'] },
      { title: 'Môi trường', lessons: ['Bốn mùa', 'Bảo vệ cây xanh', 'Tiết kiệm nước', 'Thời tiết thay đổi'] },
    ],
  },
  {
    level: 4, title: 'HSK 4', words: 1200,
    topics: [
      { title: 'Quan hệ', lessons: ['Bạn bè thân thiết', 'Hiểu lầm', 'Xin lỗi và tha thứ', 'Hẹn hò', 'Kết hôn'] },
      { title: 'Nghề nghiệp', lessons: ['Phỏng vấn xin việc', 'Viết sơ yếu lý lịch', 'Lương và thưởng', 'Đổi nghề'] },
      { title: 'Công nghệ', lessons: ['Điện thoại thông minh', 'Mua sắm trên mạng', 'Mạng xã hội', 'Học online'] },
      { title: 'Văn hóa', lessons: ['Trà Trung Quốc', 'Thư pháp', 'Ẩm thực các vùng', 'Phong tục chào hỏi'] },
      { title: 'Cuộc sống', lessons: ['Áp lực', 'Thời gian rảnh', 'Lập kế hoạch', 'Thói quen tốt', 'Ước mơ'] },
    ],
  },
  {
    level: 5, title: 'HSK 5', words: 1300,
    topics: [
      { title: 'Xã hội', lessons: ['Thành thị và nông thôn', 'Người già', 'Giáo dục', 'Tình nguyện'] },
      { title: 'Kinh tế', lessons: ['Khởi nghiệp', 'Quảng cáo', 'Tiêu dùng', 'Tiết kiệm và đầu tư'] },
      { title: 'Khoa học', lessons: ['Vũ trụ', 'Y học', 'Trí tuệ nhân tạo', 'Phát minh'] },
      { title: 'Lịch sử và văn học', lessons: ['Thành ngữ', 'Truyện cổ', 'Thơ Đường', 'Nhân vật lịch sử'] },
      { title: 'Quan điểm', lessons: ['Thành công là gì?', 'Hạnh phúc', 'Tranh luận', 'Lựa chọn', 'Thay đổi bản thân'] },
    ],
  },
];

// HSK 3.0: speaking is part of the level exam from HSK 3 up (HSK 1–2 written only).
export const SPEAKING_FROM = 3;

// Chuyên đề: short side tracks outside the 1→5 chain, each gated by an HSK level. Draft titles.
export const TRACKS = [
  { id: 'travel', title: 'Du lịch', hz: '旅游', icon: 'suitcase', need: 2, note: 'Sân bay, khách sạn, hỏi đường',
    lessons: ['Ở sân bay', 'Nhận phòng khách sạn', 'Hỏi đường', 'Gọi món đặc sản', 'Mua vé tham quan', 'Gặp sự cố', 'Mặc cả ở chợ', 'Chụp ảnh giúp tôi'] },
  { id: 'slang', title: 'Tiếng lóng', hz: '网络用语', icon: 'chat-dots', need: 2, note: 'Cách người trẻ nói trên mạng · không thi HSK',
    lessons: ['666 và 牛', 'YYDS', '躺平 nằm im', '内卷 cuộn vào trong', '破防 vỡ phòng tuyến', '绝绝子', 'Biểu cảm khi chat', 'Gọi bạn bè thân'] },
  { id: 'it', title: 'Tiếng Trung IT', hz: '信息技术', icon: 'code', need: 3, note: 'Họp dev, bug, deploy, phỏng vấn',
    lessons: ['Giới thiệu dự án', 'Báo bug', 'Họp daily', 'Code review', 'Deploy và sự cố', 'Viết tài liệu', 'Phỏng vấn kỹ thuật', 'Làm việc remote', 'Hỏi đáp với PM', 'Thuật ngữ cơ bản'] },
  { id: 'finance', title: 'Tiếng Trung tài chính', hz: '金融', icon: 'wallet', need: 3, note: 'Ngân hàng, đầu tư, báo cáo',
    lessons: ['Mở tài khoản', 'Chuyển khoản', 'Lãi suất', 'Cổ phiếu', 'Báo cáo tài chính', 'Thuế', 'Bảo hiểm', 'Vay vốn', 'Họp với khách hàng', 'Thị trường hôm nay', 'Rủi ro', 'Thuật ngữ cơ bản'] },
  { id: 'business', title: 'Tiếng Trung thương mại', hz: '商务', icon: 'case', need: 4, note: 'Đàm phán, email, hợp đồng',
    lessons: ['Email công việc', 'Gọi điện cho đối tác', 'Đàm phán giá', 'Hợp đồng', 'Thuyết trình', 'Tiệc công ty', 'Đi công tác', 'Giải quyết khiếu nại'] },
];

export const PROGRESS = {
  passed: { 0: 90 },          // lesson number → best gate score (%)
  current: { n: 1, section: 'Từ mới', href: 'l1-hub.html', img: '../assets/lessons/h1-01.png' },
};
