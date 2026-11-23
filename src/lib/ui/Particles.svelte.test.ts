import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Particles from './Particles.svelte';

const original = window.matchMedia;
let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountLayer = (kind: 'ember' | 'snow') => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Particles, { target, props: { kind } }) as Record<string, unknown>;
	flushSync();
	return target;
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	window.matchMedia = original;
	flushSync();
});

describe('Particles', () => {
	it('Given_MotionAllowed_When_MountEmber_Then_18FireParticles', () => {
		// Arrange / Act
		const root = mountLayer('ember');

		// Assert
		const items = root.querySelectorAll('[data-part="particle"]');
		expect(items).toHaveLength(18);
		expect(items[0].getAttribute('data-kind')).toBe('ember');
		expect(items[0].querySelector('use')!.getAttribute('href')).toBe('#i-fill-fire');
	});

	it('Given_MotionAllowed_When_MountSnow_Then_18SnowParticles', () => {
		// Arrange / Act
		const root = mountLayer('snow');

		// Assert
		const items = root.querySelectorAll('[data-part="particle"]');
		expect(items).toHaveLength(18);
		expect(items[0].getAttribute('data-kind')).toBe('snow');
		expect(items[0].querySelector('use')!.getAttribute('href')).toBe('#i-regular-snowflake');
	});

	it('Given_ReducedMotion_When_Mount_Then_NoParticleElement', () => {
		// Arrange
		window.matchMedia = ((media: string) => ({ matches: true, media })) as typeof matchMedia;

		// Act
		const root = mountLayer('ember');

		// Assert
		expect(root.querySelectorAll('[data-part="particle"]')).toHaveLength(0);
		expect(root.querySelector('[data-part="particles"]')).toBeNull();
	});

	it('Given_Layer_When_Mount_Then_AriaHiddenAndPointerEventsNone', () => {
		// Arrange / Act
		const root = mountLayer('snow');

		// Assert
		const layer = root.querySelector('[data-part="particles"]')!;
		expect(layer.getAttribute('aria-hidden')).toBe('true');
		expect(layer.classList.contains('pointer-events-none')).toBe(true);
	});
});
