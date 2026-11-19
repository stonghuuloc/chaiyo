import { flushSync, mount, unmount } from 'svelte';
import { m } from '#lib/paraglide/messages.js';
import { afterEach, describe, expect, it } from 'vitest';
import type { WordView } from './word-view';
import WordEntry from './WordEntry.svelte';

type Sense = WordView['groups'][number]['senses'][number];

const sense = (over: Partial<Sense> & Pick<Sense, 'vi'>): Sense => ({
	rare: false,
	example: null,
	...over
});

const tatoeba = (hanzi: string, id: number): Sense['example'] => ({
	hanzi,
	pinyin: 'Wǒ hǎolèi.',
	vi: 'Tôi mệt quá.',
	source: { kind: 'tatoeba', url: `https://tatoeba.org/vi/sentences/show/${id}` }
});

const ai = (hanzi: string): Sense['example'] => ({
	hanzi,
	pinyin: 'Nǐ hǎo.',
	vi: 'Chào bạn!',
	source: { kind: 'ai' }
});

const view = (groups: WordView['groups'], over: Partial<WordView> = {}): WordView => ({
	hanzi: '好',
	pinyin: 'hǎo',
	hanviet: 'hảo',
	groups,
	rare: groups.flatMap((g) => g.senses).filter((s) => s.rare).length,
	...over
});

let target: HTMLElement | undefined;
let app: ReturnType<typeof mount> | undefined;

const mounted = (): HTMLElement => {
	if (!target) throw new Error('nothing rendered');
	return target;
};

const render = (v: WordView) => {
	const root = document.createElement('div');
	document.body.append(root);
	target = root;
	app = mount(WordEntry, { target: root, props: { view: v } });
	flushSync();
	return {
		text: () => root.textContent ?? '',
		toggle: () => root.querySelector('button')
	};
};

const click = (el: Element | null) => {
	if (!(el instanceof HTMLElement)) throw new Error('nothing to click');
	el.click();
	flushSync();
};

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	app = undefined;
	target = undefined;
});

describe('WordEntry', () => {
	it('Given_ThreeRare_When_Render_Then_MoreButton_RareHidden', () => {
		// Arrange / Act
		const ui = render(
			view([
				{
					pos: 'adj',
					senses: [
						sense({ vi: 'tốt, khỏe, hay' }),
						sense({ vi: 'thân, thân thiết (hai người)', rare: true }),
						sense({ vi: 'hợp, thích hợp', rare: true }),
						sense({ vi: 'tốt, hay', rare: true })
					]
				}
			])
		);
		// Assert
		expect(ui.toggle()?.textContent?.trim()).toBe('Xem thêm 3 nghĩa ít gặp');
		expect(ui.text()).toContain('tốt, khỏe, hay');
		expect(ui.text()).not.toContain('thân, thân thiết (hai người)');
		expect(ui.text()).not.toContain('hợp, thích hợp');
		expect(ui.text()).not.toContain('tốt, hay');
	});

	it('Given_ThreeRare_When_ClickMore_Then_RareShown_ButtonThuGon', () => {
		// Arrange
		const ui = render(
			view([
				{
					pos: 'adj',
					senses: [
						sense({ vi: 'tốt, khỏe, hay' }),
						sense({ vi: 'thân, thân thiết (hai người)', rare: true }),
						sense({ vi: 'hợp, thích hợp', rare: true }),
						sense({ vi: 'tốt, hay', rare: true })
					]
				}
			])
		);
		// Act
		click(ui.toggle());
		// Assert
		expect(ui.text()).toContain('thân, thân thiết (hai người)');
		expect(ui.text()).toContain('hợp, thích hợp');
		expect(ui.text()).toContain('tốt, hay');
		expect(ui.toggle()?.textContent?.trim()).toBe(m.word_rare_less());
		// Act
		click(ui.toggle());
		// Assert
		expect(ui.text()).not.toContain('thân, thân thiết (hai người)');
		expect(ui.toggle()?.textContent?.trim()).toBe('Xem thêm 3 nghĩa ít gặp');
	});

	it('Given_NoRare_When_Render_Then_NoButton', () => {
		// Arrange / Act
		const ui = render(
			view([
				{ pos: 'adj', senses: [sense({ vi: 'tốt, khỏe, hay' })] },
				{ pos: 'adv', senses: [sense({ vi: 'quá, thật là' })] }
			])
		);
		// Assert
		expect(ui.toggle()).toBeNull();
		expect(ui.text()).toContain('quá, thật là');
	});

	it('Given_GroupOnlyRare_When_Render_Then_GroupHidden_UntilOpened', () => {
		// Arrange / Act
		const ui = render(
			view([
				{ pos: 'adj', senses: [sense({ vi: 'tốt, khỏe, hay' })] },
				{ pos: 'adv', senses: [sense({ vi: 'quá, thật là', rare: true })] }
			])
		);
		// Assert
		expect(ui.text()).not.toContain(m.word_pos_adv());
		expect(ui.text()).not.toContain('quá, thật là');
		// Act
		click(ui.toggle());
		// Assert
		expect(ui.text()).toContain(m.word_pos_adv());
		expect(ui.text()).toContain('quá, thật là');
	});

	it('Given_PosAdj_When_Render_Then_HeadingTinhTu', () => {
		// Arrange / Act
		render(view([{ pos: 'adj', senses: [sense({ vi: 'tốt, khỏe, hay' })] }]));
		// Assert
		expect(mounted().querySelector('h3')?.textContent).toBe(m.word_pos_adj());
		expect(m.word_pos_adj()).toBe('Tính từ');
	});

	it('Given_TatoebaExample_When_Render_Then_LinkLabelled', () => {
		// Arrange / Act
		const ui = render(
			view([
				{
					pos: 'adv',
					senses: [sense({ vi: 'quá, thật là', example: tatoeba('我好累。', 785298) })]
				}
			])
		);
		// Assert
		const link = mounted().querySelector('a');
		if (!link) throw new Error('no link');
		expect(link.getAttribute('href')).toBe('https://tatoeba.org/vi/sentences/show/785298');
		expect(link.textContent?.trim()).toBe('Tatoeba');
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toBe('noopener');
		expect(ui.text()).toContain('我好累。');
	});

	it('Given_AiExample_When_Render_Then_DisclaimerOnce', () => {
		// Arrange / Act
		const ui = render(
			view([
				{ pos: 'adj', senses: [sense({ vi: 'tốt, khỏe, hay', example: ai('你好。') })] },
				{ pos: 'adv', senses: [sense({ vi: 'quá, thật là', example: ai('太好了。') })] }
			])
		);
		// Assert
		const line = 'Ví dụ: Tatoeba hoặc AI · AI biên tập, chưa được giáo viên duyệt';
		expect(ui.text()).toContain(line);
		expect(ui.text().split(line)).toHaveLength(2);
	});

	it('Given_OnlyTatoeba_When_Render_Then_NoDisclaimer', () => {
		// Arrange / Act
		const ui = render(
			view([
				{
					pos: 'adv',
					senses: [sense({ vi: 'quá, thật là', example: tatoeba('我好累。', 785298) })]
				}
			])
		);
		// Assert
		expect(ui.text()).not.toContain(m.word_ai_disclaimer());
	});

	it('Given_OnlyAiOnRareSense_When_Render_Then_NoDisclaimer_UntilOpened', () => {
		// Arrange
		const ui = render(
			view([
				{
					pos: 'adj',
					senses: [
						sense({ vi: 'tốt, khỏe, hay', example: tatoeba('我好累。', 785298) }),
						sense({ vi: 'thân, thân thiết (hai người)', rare: true, example: ai('大家好。') })
					]
				}
			])
		);
		// Assert
		expect(ui.text()).not.toContain(m.word_ai_disclaimer());
		// Act
		click(ui.toggle());
		// Assert
		expect(ui.text()).toContain(m.word_ai_disclaimer());
	});
});
