import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LookupHit } from '#lib/catalog/index.js';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { memoryStore, openLedger, type Ledger } from '#lib/ledger/index.js';
import { initialState } from '#lib/study/index.js';
import LookupSheet from './LookupSheet.svelte';

const held = vi.hoisted(() => ({ release: () => {} }));

vi.mock('#lib/catalog/app.js', () => ({
	catalog: {
		thin: async (hanzi: string) =>
			hanzi === '大' ? { hanzi: '大', pinyin: 'dà', hanviet: 'đại', meaning: 'to, lớn' } : null,
		find: async (hanzi: string) => {
			if (hanzi === '错') throw new Error('offline');
			if (hanzi === '慢') await new Promise<void>((r) => (held.release = r));
			if (hanzi === '家')
				return {
					word: null,
					char: { hanzi: '家', readings: [{ pinyin: 'jiā', hanviet: 'gia', rare: true }] }
				};
			if (hanzi === '谢谢') return { word: { id: '谢谢', taughtIn: 'h1-01' }, char: null };
			if (hanzi === '谢')
				return {
					word: null,
					char: { hanzi: '谢', readings: [{ pinyin: 'xiè', hanviet: 'tạ' }] }
				};
			return { word: null, char: null };
		}
	}
}));

const hit = (hanzi: string, pinyin: string, meaning: string): LookupHit => ({
	hanzi,
	pinyin,
	hanviet: 'tạ tạ',
	meaning,
	sentenceId: 's-1',
	start: 0
});

const ledgerWith = async (saved: string[] = []): Promise<Ledger> => {
	const l = await openLedger({
		initial: initialState({ curriculum: CURRICULUM, tz: 'Asia/Ho_Chi_Minh' }),
		store: memoryStore(),
		db: `lookup-${Math.random()}`,
		idb: new IDBFactory()
	});
	for (const word of saved) await l.record({ kind: 'saved', word, at: new Date().toISOString() });
	return l;
};

const settle = async () => {
	for (let i = 0; i < 5; i++) {
		await new Promise((r) => setTimeout(r, 0));
		await tick();
	}
	flushSync();
};

const part = (name: string) => document.body.querySelector<HTMLElement>(`[data-part="${name}"]`);
const parts = (name: string) => [
	...document.body.querySelectorAll<HTMLElement>(`[data-part="${name}"]`)
];

let app: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

const open = async (h: LookupHit | null, ledger: Ledger) => {
	const props = $state({ hit: h, ledger, onclose: () => {} });
	target = document.createElement('div');
	document.body.append(target);
	app = mount(LookupSheet, { target, props });
	await settle();
	return props;
};

const rectOf = (top: number, bottom: number) => ({ top, bottom }) as DOMRect;

const openAnchored = async (h: LookupHit, ledger: Ledger, anchor: DOMRect) => {
	const props = $state({ hit: h, ledger, anchor, onclose: () => {} });
	target = document.createElement('div');
	document.body.append(target);
	app = mount(LookupSheet, { target, props });
	await settle();
	return props;
};

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	app = undefined;
	target = undefined;
});

describe('LookupSheet', () => {
	it('Given_TaughtWord_When_Open_Then_DetailLinkNoAdd', async () => {
		// Arrange
		const ledger = await ledgerWith();
		// Act
		await open(hit('谢谢', 'xièxie', 'cảm ơn'), ledger);
		// Assert
		expect(part('lookup-hanzi')?.textContent).toBe('谢谢');
		expect(part('lookup-meaning')?.textContent).toBe('cảm ơn');
		expect(part('lookup-detail')?.getAttribute('href')).toMatch(
			/\/word\/(谢谢|%E8%B0%A2%E8%B0%A2)$/
		);
		expect(part('lookup-add')).toBeNull();
	});

	it('Given_MultiCharHit_When_TapChip_Then_ShrinksToCharAndBack', async () => {
		// Arrange
		const ledger = await ledgerWith();
		await open(hit('谢谢', 'xièxie', 'cảm ơn'), ledger);
		expect(parts('lookup-char').map((c) => c.textContent)).toEqual(['谢', '谢']);
		// Act
		parts('lookup-char')[0].click();
		await settle();
		// Assert
		expect(part('lookup-hanzi')?.textContent).toBe('谢');
		expect(part('lookup-pinyin')?.textContent).toBe('xiè');
		expect(part('lookup-hanviet')?.textContent).toBe('tạ');
		expect(part('lookup-meaning')).toBeNull();
		part('lookup-back')?.click();
		await settle();
		expect(part('lookup-hanzi')?.textContent).toBe('谢谢');
	});

	it('Given_UntaughtWord_When_Add_Then_SavedAndBadgeShown', async () => {
		// Arrange
		const ledger = await ledgerWith();
		await open(hit('咖啡', 'kāfēi', 'cà phê'), ledger);
		expect(part('lookup-detail')).toBeNull();
		// Act
		part('lookup-add')?.click();
		await settle();
		// Assert
		expect(ledger.state().lexicon['咖啡']?.saved).toBe(true);
		expect(part('lookup-add')).toBeNull();
		expect(part('lookup-self')?.textContent).toBe('tự thêm');
	});

	it('Given_AlreadySaved_When_Open_Then_NoAddButton', async () => {
		// Arrange
		const ledger = await ledgerWith(['咖啡']);
		// Act
		await open(hit('咖啡', 'kāfēi', 'cà phê'), ledger);
		// Assert
		expect(part('lookup-add')).toBeNull();
		expect(part('lookup-self')).not.toBeNull();
	});

	it('Given_FindRejects_When_Open_Then_ReadingsWithoutActions', async () => {
		// Arrange
		const ledger = await ledgerWith();
		// Act
		await open(hit('错', 'cuò', 'sai'), ledger);
		// Assert
		expect(part('lookup-hanzi')?.textContent).toBe('错');
		expect(part('lookup-add')).toBeNull();
		expect(part('lookup-detail')).toBeNull();
	});

	it('Given_CharWithoutRecord_When_Shrink_Then_NotFoundShown', async () => {
		// Arrange
		const ledger = await ledgerWith();
		await open(hit('咖啡', 'kāfēi', 'cà phê'), ledger);
		// Act
		parts('lookup-char')[0].click();
		await settle();
		// Assert
		expect(part('lookup-hanzi')?.textContent).toBe('咖');
		expect(part('lookup-missing')?.textContent).toBe('Chưa có trong từ điển');
		expect(part('lookup-back')?.textContent).toBe('← 咖啡');
	});

	it('Given_CharInLoadedThin_When_Shrink_Then_ThinReadingsAndMeaning', async () => {
		// Arrange
		const ledger = await ledgerWith();
		await open(hit('大家', 'dàjiā', 'mọi người'), ledger);
		// Act
		parts('lookup-char')[0].click();
		await settle();
		// Assert
		expect(part('lookup-hanzi')?.textContent).toBe('大');
		expect(part('lookup-pinyin')?.textContent).toBe('dà');
		expect(part('lookup-hanviet')?.textContent).toBe('đại');
		expect(part('lookup-meaning')?.textContent).toBe('to, lớn');
		expect(part('lookup-missing')).toBeNull();
	});

	it('Given_CharWithOnlyRareReadings_When_Shrink_Then_FirstReadingShown', async () => {
		// Arrange
		const ledger = await ledgerWith();
		await open(hit('大家', 'dàjiā', 'mọi người'), ledger);
		// Act
		parts('lookup-char')[1].click();
		await settle();
		// Assert
		expect(part('lookup-pinyin')?.textContent).toBe('jiā');
	});

	it('Given_ShrinkPending_When_HitChanges_Then_LateCharIgnored', async () => {
		// Arrange
		const ledger = await ledgerWith();
		const props = await open(hit('慢慢', 'mànman', 'chậm'), ledger);
		held.release();
		await settle();
		parts('lookup-char')[0].click();
		await settle();
		// Act
		props.hit = hit('咖啡', 'kāfēi', 'cà phê');
		held.release();
		await settle();
		// Assert
		expect(part('lookup-hanzi')?.textContent).toBe('咖啡');
		expect(part('lookup-back')).toBeNull();
	});

	it('Given_FindPending_When_HitChanges_Then_StaleWordIgnored', async () => {
		// Arrange
		const ledger = await ledgerWith();
		const props = await open(hit('慢', 'màn', 'chậm'), ledger);
		// Act
		props.hit = hit('谢谢', 'xièxie', 'cảm ơn');
		await settle();
		held.release();
		await settle();
		// Assert
		expect(part('lookup-detail')).not.toBeNull();
	});

	it('Given_NoHit_When_Open_Then_SheetClosed', async () => {
		// Arrange
		const ledger = await ledgerWith();
		// Act
		await open(null, ledger);
		// Assert
		expect(part('lookup-hanzi')).toBeNull();
	});

	it('Given_Anchor_When_Hit_Then_PanelPlacedByRule', async () => {
		// Arrange
		const ledger = await ledgerWith();
		vi.stubGlobal('innerHeight', 667);
		// Act
		await openAnchored(hit('谢谢', 'xièxie', 'cảm ơn'), ledger, rectOf(430, 500));
		// Assert
		const panel = part('lookup-panel');
		expect(panel?.style.top).toBe('8px');
		expect(panel?.style.maxHeight).toBe('414px');
		expect(panel?.getAttribute('role')).toBe('dialog');
		expect(part('lookup-hanzi')?.textContent).toBe('谢谢');
		vi.unstubAllGlobals();
	});

	it('Given_NoAnchor_When_Hit_Then_SheetPath', async () => {
		// Arrange
		const ledger = await ledgerWith();
		// Act
		await open(hit('谢谢', 'xièxie', 'cảm ơn'), ledger);
		// Assert
		expect(part('lookup-panel')).toBeNull();
		expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
	});
});
