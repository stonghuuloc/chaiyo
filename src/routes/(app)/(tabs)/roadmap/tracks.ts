import { m } from '#lib/paraglide/messages.js';
import { currentLevel, type State } from '#lib/study/index.js';

export type Track = {
	id: string;
	title: string;
	hz: string;
	icon: string;
	need: number;
	note: string;
	lessons: string[];
};
export type TrackItem = Track & { locked: boolean };

export const TRACKS: Track[] = [
	{
		id: 'travel',
		title: 'Du lịch',
		hz: '旅游',
		icon: 'suitcase',
		need: 2,
		note: 'Sân bay, khách sạn, hỏi đường',
		lessons: [
			'Ở sân bay',
			'Nhận phòng khách sạn',
			'Hỏi đường',
			'Gọi món đặc sản',
			'Mua vé tham quan',
			'Gặp sự cố',
			'Mặc cả ở chợ',
			'Chụp ảnh giúp tôi'
		]
	},
	{
		id: 'slang',
		title: 'Tiếng lóng',
		hz: '网络用语',
		icon: 'chat-dots',
		need: 2,
		note: 'Cách người trẻ nói trên mạng · không thi HSK',
		lessons: [
			'666 và 牛',
			'YYDS',
			'躺平 nằm im',
			'内卷 cuộn vào trong',
			'破防 vỡ phòng tuyến',
			'绝绝子',
			'Biểu cảm khi chat',
			'Gọi bạn bè thân'
		]
	},
	{
		id: 'it',
		title: 'Tiếng Trung IT',
		hz: '信息技术',
		icon: 'code',
		need: 3,
		note: 'Họp dev, bug, deploy, phỏng vấn',
		lessons: [
			'Giới thiệu dự án',
			'Báo bug',
			'Họp daily',
			'Code review',
			'Deploy và sự cố',
			'Viết tài liệu',
			'Phỏng vấn kỹ thuật',
			'Làm việc remote',
			'Hỏi đáp với PM',
			'Thuật ngữ cơ bản'
		]
	},
	{
		id: 'finance',
		title: 'Tiếng Trung tài chính',
		hz: '金融',
		icon: 'wallet',
		need: 3,
		note: 'Ngân hàng, đầu tư, báo cáo',
		lessons: [
			'Mở tài khoản',
			'Chuyển khoản',
			'Lãi suất',
			'Cổ phiếu',
			'Báo cáo tài chính',
			'Thuế',
			'Bảo hiểm',
			'Vay vốn',
			'Họp với khách hàng',
			'Thị trường hôm nay',
			'Rủi ro',
			'Thuật ngữ cơ bản'
		]
	},
	{
		id: 'business',
		title: 'Tiếng Trung thương mại',
		hz: '商务',
		icon: 'case',
		need: 4,
		note: 'Đàm phán, email, hợp đồng',
		lessons: [
			'Email công việc',
			'Gọi điện cho đối tác',
			'Đàm phán giá',
			'Hợp đồng',
			'Thuyết trình',
			'Tiệc công ty',
			'Đi công tác',
			'Giải quyết khiếu nại'
		]
	}
];

export function trackView(state: State): { open: number; total: number; items: TrackItem[] } {
	const top = currentLevel(state);
	const items = TRACKS.map((t) => ({ ...t, locked: top <= t.need }));
	return { open: items.filter((t) => !t.locked).length, total: items.length, items };
}

export const trackToast = (item: TrackItem) =>
	item.locked
		? m.chy49s3_track_lock({ need: item.need, title: item.title })
		: m.chy49s3_track_soon({ title: item.title });
