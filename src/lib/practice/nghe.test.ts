import { describe, expect, it } from 'vitest';
import { ngheStep } from './nghe';

const pool = ['你', '好', '您', '你们', '你好', '对不起', '没关系', '谢谢', '不客气', '再见'];

describe('ngheStep', () => {
	it('Given_PoolOfTen_When_Build_Then_FourDistinctOptionsOneCorrect', () => {
		// Arrange / Act
		const step = ngheStep({ word: '你好', audio: 'words/nihao', pool });

		// Assert
		expect(step.options).toHaveLength(4);
		expect(new Set(step.options).size).toBe(4);
		expect(step.options.filter((o) => o === '你好')).toHaveLength(1);
		expect(step.answer).toBe('你好');
		expect(step.ask).toBe('Nghe rồi chọn từ đúng');
		expect(step.instant).toBe(true);
		expect(step.audio).toBe('words/nihao');
		expect(step.card).toEqual({ word: '你好', skill: 'nghe' });
		expect(step.id).toBe('practice:nghe:你好');
	});

	it('Given_PoolOfThree_When_Build_Then_ThreeOptions', () => {
		// Arrange / Act
		const step = ngheStep({ word: '你好', audio: 'a', pool: ['你', '好', '你好'] });

		// Assert
		expect([...step.options].sort()).toEqual(['你', '你好', '好'].sort());
	});

	it('Given_SameInputs_When_BuildTwice_Then_SameOrder', () => {
		// Arrange / Act
		const a = ngheStep({ word: '谢谢', audio: 'a', pool });
		const b = ngheStep({ word: '谢谢', audio: 'a', pool });

		// Assert
		expect(a.options).toEqual(b.options);
	});

	it('Given_Again_When_Build_Then_MarkerLineAndEmptyHint', () => {
		// Arrange / Act
		const step = ngheStep({ word: '你好', audio: 'a', pool, again: true });

		// Assert
		expect(step.ask).toBe('Nghe rồi chọn từ đúng · gặp lại');
		expect(step.missHint).toBe('');
		expect(step.id).toBe('practice:nghe:你好#again');
	});

	it('Given_FirstAppearance_When_Build_Then_RequeueHint', () => {
		// Arrange / Act
		const step = ngheStep({ word: '你好', audio: 'a', pool });

		// Assert
		expect(step.missHint).toBe('Từ này sẽ quay lại cuối lượt');
	});

	it('Given_PoolWithDuplicatesAndAnswer_When_Build_Then_OptionsStayDistinct', () => {
		// Arrange / Act
		const step = ngheStep({ word: '你好', audio: 'a', pool: [...pool, ...pool, '你好'] });

		// Assert
		expect(new Set(step.options).size).toBe(step.options.length);
	});
});
