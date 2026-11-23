import { describe, expect, it } from 'vitest';
import { controlName, controls, FREEZE_ACTION } from './controls';

describe('controls', () => {
	it('Given_ButtonLinkAndAriaLabel_When_Controls_Then_NamesInOrder', () => {
		// Arrange
		const root = document.createElement('div');
		root.innerHTML =
			'<button> Tuyệt! </button><a href="/x">Liên kết</a><div role="button" aria-label="Nhãn">bỏ qua</div><input aria-label="Ô nhập"><span>không phải control</span><a>không href</a>';

		// Act
		const names = controls(root).map(controlName);

		// Assert
		expect(names).toEqual(['Tuyệt!', 'Liên kết', 'Nhãn', 'Ô nhập']);
	});

	it('Given_FreezeAction_When_Match_Then_DungAndBuyMatch_HieuRoiNot', () => {
		// Arrange
		const hits = ['Dùng 1 lượt', 'Buy freeze'];
		const misses = ['Hiểu rồi', 'Đóng băng là gì?', 'Chuỗi 12 ngày, còn 1 lượt đóng băng'];

		// Act / Assert
		expect(hits.map((n) => FREEZE_ACTION.test(n))).toEqual([true, true]);
		expect(misses.map((n) => FREEZE_ACTION.test(n))).toEqual([false, false, false]);
	});
});
