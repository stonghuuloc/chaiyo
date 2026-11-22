import { IDBFactory } from 'fake-indexeddb';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { flushSync, mount, tick, unmount } from 'svelte';
import { createCatalog, type LessonContent } from '#lib/catalog/index.js';
import { buildBundle } from '#lib/content/import/bundle.js';
import { importContent } from '#lib/content/import/import.js';
import { PRODUCTION_ROOTS, scopeFor } from '#lib/content/import/scope.js';
import { createMemorySink } from '#lib/content/import/sink.js';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { memoryStore, openLedger, type Ledger } from '#lib/ledger/index.js';
import { initialState } from '#lib/study/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { primerSteps } from './primer';

const hoisted = vi.hoisted(() => ({ section: { value: 'tones' } }));
vi.mock('$app/state', () => ({
	page: {
		params: {
			get section() {
				return hoisted.section.value;
			}
		}
	}
}));
vi.mock('#lib/audio/index.js', () => ({
	player: { play: vi.fn(async () => true), url: (k: string) => `/a/${k}.mp3`, element: () => null },
	play: vi.fn()
}));
vi.mock('#lib/learner/index.js', () => ({ learnerLedger: async () => undefined }));

const { default: PrimerSection } = await import('./PrimerSection.svelte');

const load = async (): Promise<LessonContent> => {
	const prev = process.env.CHAIYO_VAULT;
	process.env.CHAIYO_VAULT = join(tmpdir(), 'no-such-vault');
	try {
		const sink = createMemorySink();
		const r = await importContent('content', sink, { only: scopeFor('content', PRODUCTION_ROOTS) });
		if (!('sha' in r)) throw new Error(JSON.stringify(r.errors, null, 2));
		const b = buildBundle(sink.content!, 'h0-00');
		return createCatalog({ current: async () => b.sha, bundle: async () => b }).lesson('h0-00');
	} finally {
		if (prev === undefined) delete process.env.CHAIYO_VAULT;
		else process.env.CHAIYO_VAULT = prev;
	}
};

const lesson = await load();
const session = { user: { id: 'u1' } } as never;

const openMemory = () =>
	openLedger({
		initial: initialState({ curriculum: CURRICULUM }),
		store: memoryStore(),
		db: `primer-${crypto.randomUUID()}`,
		idb: new IDBFactory()
	});

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	flushSync();
	await tick();
	await Promise.resolve();
	flushSync();
};

let props: {
	lesson: LessonContent;
	session: never | null;
	ledger?: Promise<Ledger>;
	section?: string;
};

const mountSection = async (ledger: Ledger | null, section = 'tones') => {
	hoisted.section.value = section;
	target = document.createElement('div');
	document.body.append(target);
	const live = $state({
		lesson,
		session: ledger ? session : null,
		ledger: ledger ? Promise.resolve(ledger) : undefined,
		section
	});
	props = live;
	app = mount(PrimerSection, { target, props: live }) as Record<string, unknown>;
	await settle();
};

const cta = () => target!.querySelector<HTMLButtonElement>('.actions button');
const click = async (b: HTMLButtonElement | null) => {
	b!.click();
	await settle();
};

const answered = () => target!.querySelectorAll('[data-seg] i[data-on=true]').length;

const play = async (section: string, right: number) => {
	const steps = primerSteps(lesson, section);
	let drill = 0;
	for (const [i, s] of steps.entries()) {
		if (s.kind === 'choice') {
			const options = [
				...target!.querySelectorAll<HTMLButtonElement>('.body button[aria-pressed]')
			];
			const want = drill++ < right;
			await click(options.find((o) => (o.textContent?.trim() === s.answer) === want)!);
			await click(cta());
		}
		await click(cta());
		if (i < steps.length - 1) await vi.waitFor(() => expect(answered()).toBe(i + 1));
	}
	await vi.waitFor(() => expect(target!.querySelector('[data-part=done-title]')).not.toBeNull());
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('PrimerSection', () => {
	it('Given_TonesThreeDrillsRight_When_Finished_Then_DoneTitleAndThreeOfFour', async () => {
		// Arrange
		const ledger = await openMemory();
		await mountSection(ledger);
		expect(target!.querySelectorAll('[data-part=chip]').length).toBeGreaterThan(0);

		// Act
		await play('tones', 3);

		// Assert
		expect(target!.querySelector('[data-part=done-title]')!.textContent).toBe(
			'Xong phần Thanh điệu'
		);
		expect(target!.querySelector('[data-part=done-text]')!.textContent).toBe('3/4 câu luyện đúng');
		expect(target!.querySelector('[data-part=done-next] a')!.getAttribute('href')).toMatch(
			/\/lesson\/h0-00\/finals$/
		);
		expect(ledger.state().lessons['h0-00'].done).toEqual(['tones']);
	});

	it('Given_SandhiOldRunAllRight_When_RedoneTwoRight_Then_ScoreIsNewRun', async () => {
		// Arrange
		const ledger = await openMemory();
		await mountSection(ledger, 'sandhi');
		await play('sandhi', 4);
		unmount(app as never);
		target!.remove();

		// Act
		await mountSection(ledger, 'sandhi');
		await play('sandhi', 2);

		// Assert
		expect(target!.querySelector('[data-part=done-title]')!.textContent).toBe(
			'Xong phần Biến điệu'
		);
		expect(target!.querySelector('[data-part=done-text]')!.textContent).toBe('2/4 câu luyện đúng');
		expect(target!.querySelector('[data-part=done-next] a')!.getAttribute('href')).toBe(
			'/lesson/h0-00'
		);
	});

	it('Given_NullSession_When_Mounted_Then_Placeholder', async () => {
		// Arrange / Act
		await mountSection(null);

		// Assert
		expect(target!.querySelector('h1')!.textContent).toBe('Phần học');
		expect(target!.querySelector('.actions')).toBeNull();
	});

	it('Given_TonesDone_When_SectionPropMovesToFinals_Then_FreshRunnerNotOldDone', async () => {
		// Arrange
		const ledger = await openMemory();
		await mountSection(ledger);
		await play('tones', 3);
		expect(target!.querySelector('[data-part=done-title]')).not.toBeNull();

		const first = primerSteps(lesson, 'finals')[0];
		if (first.kind !== 'card') throw new Error('finals starts with a card');

		// Act
		props.section = 'finals';
		hoisted.section.value = 'finals';
		await settle();

		// Assert
		expect(target!.querySelector('[data-part=done-title]')).toBeNull();
		expect(target!.querySelector('[data-seg]')).not.toBeNull();
		expect(target!.querySelector('h2')!.textContent).toBe(first.title);
	});
});
