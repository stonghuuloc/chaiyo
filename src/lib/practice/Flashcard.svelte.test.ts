import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/paraglide/messages.js';

const hoisted = vi.hoisted(() => ({ play: vi.fn() }));
vi.mock('#lib/audio/index.js', () => ({ play: hoisted.play }));

const { default: Flashcard } = await import('./Flashcard.svelte');

const card = {
	hanzi: '学生',
	pinyin: 'xuéshēng',
	hanviet: 'học sinh',
	meaning: 'học sinh',
	audio: 'word/学生',
	example: { hanzi: '他是学生。', pinyin: 'Tā shì xuéshēng.', vi: 'Anh ấy là học sinh.' }
};

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

beforeEach(() => {
	hoisted.play.mockReset();
	hoisted.play.mockResolvedValue(true);
});

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

const render = (props: Partial<{ card: typeof card; ondecide: () => void }> = {}) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Flashcard, {
		target,
		props: { card, ondecide: vi.fn(), ...props } as never
	}) as Record<string, unknown>;
	flushSync();
};

const flipButton = () => target!.querySelector<HTMLButtonElement>('[data-part="flip"]')!;
const speakers = () => [...target!.querySelectorAll<HTMLButtonElement>('[data-part="speaker"]')];
const text = () => target!.textContent ?? '';

describe('Flashcard faces', () => {
	it('Given_NewCard_When_Render_Then_FrontShowsHintAndHidesBack', () => {
		// Arrange
		// Act
		render();

		// Assert
		expect(text()).toContain('学生');
		expect(text()).toContain(m.practice_card_hint());
		expect(text()).not.toContain('xuéshēng');
		expect(text()).not.toContain('học sinh');
		expect(text()).not.toContain('Anh ấy là học sinh.');
		expect(text()).not.toContain(m.practice_card_guide());
		expect(target!.querySelector('[data-part="remember"]')).toBeNull();
	});

	it('Given_Front_When_Click_Then_BackShowsFieldsAndGuide', () => {
		// Arrange
		render();

		// Act
		flipButton().click();
		flushSync();

		// Assert
		expect(text()).toContain('xuéshēng');
		expect(text()).toContain('học sinh');
		expect(text()).toContain('他是学生。');
		expect(text()).toContain('Tā shì xuéshēng.');
		expect(text()).toContain('Anh ấy là học sinh.');
		expect(text()).toContain(m.practice_card_guide());
		expect(text()).not.toContain(m.practice_card_hint());
	});
});

describe('Flashcard speaker', () => {
	it('Given_Front_When_SpeakerPressed_Then_PlaysOnceAndStaysFront', async () => {
		// Arrange
		render();

		// Act
		speakers()[0].click();
		flushSync();

		// Assert
		await vi.waitFor(() => expect(hoisted.play).toHaveBeenCalledTimes(1));
		expect(hoisted.play).toHaveBeenCalledWith('word/学生');
		expect(text()).toContain(m.practice_card_hint());
		expect(text()).not.toContain('xuéshēng');
	});

	it('Given_Back_When_SpeakerPressed_Then_PlaysOnceAndStaysBack', async () => {
		// Arrange
		render();
		flipButton().click();
		flushSync();

		// Act
		speakers()[0].click();
		flushSync();

		// Assert
		await vi.waitFor(() => expect(hoisted.play).toHaveBeenCalledTimes(1));
		expect(hoisted.play).toHaveBeenCalledWith('word/学生');
		expect(text()).toContain('xuéshēng');
		expect(text()).not.toContain(m.practice_card_hint());
	});

	it('Given_NoAudio_When_Render_Then_NoSpeakerOnEitherFace', () => {
		// Arrange
		render({ card: { ...card, audio: undefined } as never });

		// Act
		const front = speakers().length;
		flipButton().click();
		flushSync();

		// Assert
		expect(front).toBe(0);
		expect(speakers()).toHaveLength(0);
	});

	it('Given_RejectedPlay_When_SpeakerPressed_Then_ButtonStaysEnabled', async () => {
		// Arrange
		hoisted.play.mockRejectedValue(new Error('blocked'));
		render();

		// Act
		speakers()[0].click();
		flushSync();

		// Assert
		await vi.waitFor(() => expect(hoisted.play).toHaveBeenCalledTimes(1));
		await Promise.resolve();
		expect(speakers()[0].disabled).toBe(false);
	});
});
