import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LookupHit } from '#lib/catalog/index.js';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { memoryStore, openLedger } from '#lib/ledger/index.js';
import { initialState } from '#lib/study/index.js';
import HostProbe from '../../test/HostProbe.svelte';

vi.mock('#lib/catalog/app.js', () => ({
	catalog: { thin: async () => null, find: async () => ({ word: null, char: null }) }
}));

const hit = (hanzi: string): LookupHit => ({
	hanzi,
	pinyin: 'p',
	hanviet: 'h',
	meaning: 'm',
	sentenceId: 's-1',
	start: 0
});

const settle = async () => {
	for (let i = 0; i < 5; i++) {
		await new Promise((r) => setTimeout(r, 0));
		await tick();
	}
	flushSync();
};

let app: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

const render = async () => {
	const ledger = await openLedger({
		initial: initialState({ curriculum: CURRICULUM, tz: 'Asia/Ho_Chi_Minh' }),
		store: memoryStore(),
		db: `host-${Math.random()}`,
		idb: new IDBFactory()
	});
	target = document.createElement('div');
	document.body.append(target);
	app = mount(HostProbe, {
		target,
		props: { ledger, hits: [hit('你好'), hit('谢谢')], rect: { top: 100, bottom: 140 } as DOMRect }
	});
	await settle();
};

const opens = () => [...document.body.querySelectorAll<HTMLElement>('[data-part="probe-open"]')];
const panels = () => document.body.querySelectorAll('[data-part="lookup-panel"]');

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	app = undefined;
	target = undefined;
});

describe('LookupHost', () => {
	it('Given_TwoOpens_When_Render_Then_OnePanelWithSecondHit', async () => {
		// Arrange
		await render();
		// Act
		opens()[0].click();
		opens()[1].click();
		await settle();
		// Assert
		expect(panels()).toHaveLength(1);
		expect(document.body.querySelector('[data-part="lookup-hanzi"]')?.textContent).toBe('谢谢');
	});

	it('Given_Escape_When_Open_Then_Closed', async () => {
		// Arrange
		await render();
		opens()[0].click();
		await settle();
		expect(panels()).toHaveLength(1);
		// Act
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		await settle();
		// Assert
		expect(panels()).toHaveLength(0);
	});
});
