import { describe, expect, it } from 'vitest';
import { freezeRules } from './rules';

describe('freezeRules', () => {
	it('Given_Count12Freezes1_When_FreezeRules_Then_Have1of2AndThem2Ngay', () => {
		// Act
		const view = freezeRules({ count: 12, freezes: 1 });

		// Assert
		expect(view.have).toBe('Bạn đang có 1/2 lượt');
		expect(view.sub).toBe('Thêm 2 ngày học liền nữa là được tặng 1');
		expect(view.held).toBe(1);
		expect(view.max).toBe(2);
		expect(view.rules).toEqual([
			{ title: 'Ngày được tính', text: 'khi bạn học xong một phần bài hoặc một buổi luyện.' },
			{ title: 'Học 7 ngày liền', text: 'được tặng 1 lượt, giữ tối đa 2 lượt.' },
			{
				title: 'Lỡ nghỉ một ngày?',
				text: 'App tự dùng 1 lượt, chuỗi giữ nguyên nhưng không cộng thêm.'
			},
			{ title: 'Hết lượt mà nghỉ', text: 'thì chuỗi về 0. Huy hiệu đã có vẫn giữ.' }
		]);
	});

	it('Given_Count14Freezes1_When_FreezeRules_Then_Them7Ngay', () => {
		// Act
		const view = freezeRules({ count: 14, freezes: 1 });

		// Assert
		expect(view.sub).toBe('Thêm 7 ngày học liền nữa là được tặng 1');
	});

	it('Given_Freezes2_When_FreezeRules_Then_DayTui', () => {
		// Act
		const view = freezeRules({ count: 13, freezes: 2 });

		// Assert
		expect(view.sub).toBe('Đầy túi rồi, cứ yên tâm');
		expect(view.held).toBe(2);
	});

	it('Given_Fresh_When_FreezeRules_Then_Have0of2AndThem7Ngay', () => {
		// Act
		const view = freezeRules({ count: 0, freezes: 0 });

		// Assert
		expect(view.have).toBe('Bạn đang có 0/2 lượt');
		expect(view.sub).toBe('Thêm 7 ngày học liền nữa là được tặng 1');
		expect(view.held).toBe(0);
	});
});
