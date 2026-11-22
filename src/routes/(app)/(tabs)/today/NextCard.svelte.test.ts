import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import NextCard from './NextCard.svelte';
import type { Cta, Scene } from './today';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountCard = (view: { cta: Cta; scene: Scene }) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(NextCard, { target, props: { view } }) as Record<string, unknown>;
	flushSync();
	return {
		anchors: () => [...target!.querySelectorAll<HTMLAnchorElement>('a')],
		buttons: () => target!.querySelectorAll('button').length,
		done: () => target!.querySelector('[data-part=next-done]')?.textContent?.trim(),
		img: () => target!.querySelector<HTMLImageElement>('img[data-part=scene]')
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('NextCard', () => {
	it('Given_ReviewsCta_When_Mount_Then_OneAnchorToPracticeSession', () => {
		// Arrange
		const view = { cta: { kind: 'reviews' } as Cta, scene: 'reviews-due' as Scene };

		// Act
		const card = mountCard(view);

		// Assert
		expect(card.anchors()).toHaveLength(1);
		expect(card.anchors()[0].textContent?.trim()).toBe('Luyện hôm nay');
		expect(card.anchors()[0].getAttribute('href')).toMatch(/\/practice\/session$/);
	});

	it('Given_LessonCta_When_Mount_Then_TiepTucBai1HrefLessonH1_01', () => {
		// Arrange
		const view = {
			cta: { kind: 'lesson', id: 'h1-01', n: 1 } as Cta,
			scene: 'lesson-next' as Scene
		};

		// Act
		const card = mountCard(view);

		// Assert
		expect(card.anchors()).toHaveLength(1);
		expect(card.anchors()[0].textContent?.trim()).toBe('Tiếp tục Bài 1');
		expect(card.anchors()[0].getAttribute('href')).toMatch(/\/lesson\/h1-01$/);
	});

	it('Given_ThiCta_When_Mount_Then_ThiThuHsk5HrefSkillThiLv5', () => {
		// Arrange
		const view = { cta: { kind: 'thi', level: 5 } as Cta, scene: 'lesson-next' as Scene };

		// Act
		const card = mountCard(view);

		// Assert
		expect(card.anchors()).toHaveLength(1);
		expect(card.anchors()[0].textContent?.trim()).toBe('Thi thử HSK 5');
		expect(card.anchors()[0].getAttribute('href')).toMatch(/\/practice\/skill\?k=thi&lv=5$/);
	});

	it('Given_DoneCta_When_Mount_Then_XongHomNayNoAnchorNoButton', () => {
		// Arrange
		const view = { cta: { kind: 'done' } as Cta, scene: 'day-done' as Scene };

		// Act
		const card = mountCard(view);

		// Assert
		expect(card.done()).toBe('Xong hôm nay');
		expect(card.anchors()).toHaveLength(0);
		expect(card.buttons()).toBe(0);
	});

	const scenes: Scene[] = [
		'reviews-due',
		'lesson-next',
		'day-done',
		'streak-at-risk',
		'freeze-used'
	];
	const alts = new Set<string>();

	it.each(scenes)('Given_EachScene_When_Mount_Then_ImgSrcEndsSceneWebpWithAlt (%s)', (scene) => {
		// Arrange
		const view = { cta: { kind: 'reviews' } as Cta, scene };

		// Act
		const img = mountCard(view).img();

		// Assert
		expect(img?.getAttribute('src')).toMatch(new RegExp(`/home/${scene}\\.webp$`));
		expect(img?.getAttribute('alt')?.length).toBeGreaterThan(0);
		alts.add(img!.getAttribute('alt')!);
	});

	it('Given_FiveScenes_When_Collected_Then_FiveDistinctAlts', () => {
		// Assert
		expect(alts.size).toBe(5);
	});
});
