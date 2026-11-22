import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCatalog, type LessonContent } from '#lib/catalog/index.js';
import { buildBundle } from '#lib/content/import/bundle.js';
import { importContent } from '#lib/content/import/import.js';
import { scopeFor, PRODUCTION_ROOTS } from '#lib/content/import/scope.js';
import { createMemorySink, type ImportedSentence } from '#lib/content/import/sink.js';
import type { Lesson, Primer, Question } from '#lib/content/schemas.js';
import { describe, expect, it } from 'vitest';
import { dialogueSteps } from './dialogue';

const drillText = (steps: { kind: string }[]) =>
	steps.flatMap((s) => {
		const d = s as {
			kind: string;
			ask?: string;
			title?: string;
			options?: string[];
			tiles?: string[];
		};
		if (d.kind !== 'choice' && d.kind !== 'order') return [];
		return [d.ask ?? '', d.title ?? '', ...(d.options ?? []), ...(d.tiles ?? [])];
	});

const sentence = (
	id: string,
	hanzi: string,
	speaker?: string,
	audio?: string
): ImportedSentence => ({
	id,
	hanzi,
	pinyin: `py-${id}`,
	vi: `vi-${id}`,
	seg: [...hanzi],
	...(speaker ? { speaker } : {}),
	...(audio ? { audio } : {})
});

const content = (
	dialogue: Lesson['sections']['dialogue'],
	sentences: ImportedSentence[]
): LessonContent => ({
	contentSha: 'sha',
	lesson: {
		id: 'h1-99',
		level: 1,
		topic: 't',
		order: 1,
		title: 'x',
		titleHanzi: 'x',
		goal: 'g',
		scene: { file: 'f', cast: [], prompt: 'p' },
		sentences: [],
		sections: {
			warmup: {},
			words: { ids: [] },
			grammar: { ids: [], drills: [] },
			dialogue,
			listenSpeak: { items: [] },
			writing: { chars: [] }
		},
		gate: { pool: [], draw: 1 }
	},
	words: [],
	chars: [],
	sentences,
	grammar: [],
	questions: [],
	gateCoverage: {},
	thin: []
});

const choice = (over: Partial<Question & { type: 'choice' }> = {}): Question =>
	({
		id: 'q1',
		type: 'choice',
		tests: { words: [] },
		prompt: { kind: 'audio', ref: 'a' },
		optionKind: 'hanzi',
		options: ['好。', '不。'],
		answer: 0,
		...over
	}) as Question;

describe('dialogueSteps', () => {
	it('Given_Primer_When_Map_Then_NoSteps', () => {
		// Arrange
		const c = { ...content({ parts: [], questions: [] }, []) };
		c.lesson = { kind: 'primer', id: 'h0-00' } as unknown as Primer;

		// Act / Assert
		expect(dialogueSteps(c)).toEqual([]);
	});

	it('Given_PartsWithSpeakers_When_Map_Then_LinesSideAndClipPerSentence', () => {
		// Arrange
		const c = content({ parts: [{ lines: ['a', 'b', 'c'] }], questions: [] }, [
			sentence('a', '你好！', 'redpanda', 'k/a'),
			sentence('b', '你好！', 'takin'),
			sentence('c', '再见！')
		]);

		// Act
		const [step] = dialogueSteps(c);

		// Assert
		expect(step).toEqual({
			kind: 'dialogue',
			id: 'dlg-h1-99-1',
			part: 1,
			of: 1,
			title: '',
			lines: [
				{ id: 'a', speaker: 'redpanda', hanzi: '你好！', pinyin: 'py-a', vi: 'vi-a', audio: 'k/a' },
				{ id: 'b', speaker: 'takin', hanzi: '你好！', pinyin: 'py-b', vi: 'vi-b' },
				{ id: 'c', speaker: 'redpanda', hanzi: '再见！', pinyin: 'py-c', vi: 'vi-c' }
			]
		});
	});

	it('Given_MissingLineSentence_When_Map_Then_Throws', () => {
		// Arrange
		const c = content({ parts: [{ lines: ['zz'] }], questions: [] }, []);

		// Act / Assert
		expect(() => dialogueSteps(c)).toThrow('no sentence zz');
	});

	it('Given_TextChoiceWithoutAskOrSentence_When_Map_Then_PromptTitleAndAnswerExplain', () => {
		// Arrange
		const q = choice({
			prompt: { kind: 'vi', text: 'Chọn câu' },
			optionKind: 'vi',
			options: ['Có', 'Không'],
			answer: 1
		});
		const c = content({ parts: [], questions: [q] }, []);

		// Act
		const [step] = dialogueSteps(c);

		// Assert
		expect(step).toEqual({
			kind: 'choice',
			id: 'q1',
			ask: 'Câu hỏi',
			title: 'Chọn câu',
			options: ['Có', 'Không'],
			answer: 'Không',
			script: 'text'
		});
	});

	it('Given_AudioPromptWithNoClip_When_Map_Then_NoAudioField', () => {
		// Arrange
		const c = content({ parts: [], questions: [choice({ ask: 'Hỏi?' })] }, []);

		// Act
		const [step] = dialogueSteps(c);

		// Assert
		expect(step).toMatchObject({ kind: 'choice', title: 'Hỏi?', script: 'hanzi' });
		expect('audio' in step).toBe(false);
	});

	it('Given_NonChoiceQuestion_When_Map_Then_Skipped', () => {
		// Arrange
		const order = { id: 'o1', type: 'order', tests: {}, tiles: ['a'], answer: 'a' } as Question;
		const c = content({ parts: [], questions: [order] }, []);

		// Act / Assert
		expect(dialogueSteps(c)).toEqual([]);
	});
});

describe('dialogueSteps on Bài 1', () => {
	it('Given_Bai1_When_Build_Then_TwoPartsAndTheTakinQuestion', async () => {
		// Arrange
		const prev = process.env.CHAIYO_VAULT;
		process.env.CHAIYO_VAULT = join(tmpdir(), 'no-such-vault');
		const sink = createMemorySink();
		const r = await importContent('content', sink, { only: scopeFor('content', PRODUCTION_ROOTS) });
		if (prev === undefined) delete process.env.CHAIYO_VAULT;
		else process.env.CHAIYO_VAULT = prev;
		if (!('sha' in r) || !sink.content) throw new Error(JSON.stringify(r));
		const b = buildBundle(sink.content, 'h1-01');
		const c = await createCatalog({ current: async () => b.sha, bundle: async () => b }).lesson(
			'h1-01'
		);

		// Act
		const steps = dialogueSteps(c);

		// Assert
		expect(steps.map((s) => s.kind)).toEqual(['dialogue', 'dialogue', 'choice']);
		const [p1, p2, q] = steps;
		if (p1.kind !== 'dialogue' || p2.kind !== 'dialogue' || q.kind !== 'choice')
			throw new Error('kinds');
		expect([p1.title, p1.lines.length, p2.title, p2.lines.length]).toEqual([
			'Gặp nhau',
			4,
			'Chia tay',
			3
		]);
		expect(p1.lines.map((l) => l.speaker)).toEqual(['redpanda', 'takin', 'takin', 'redpanda']);
		expect(p1.lines.every((l) => l.audio)).toBe(true);
		expect(q).toMatchObject({
			id: 'q-h1-01-d01',
			title: 'Gấu Đỏ nên trả lời thế nào?',
			options: ['没关系。', '不客气。', '再见！'],
			answer: '没关系。',
			explain: 'méi guānxi · Không sao.',
			audio: p1.lines[2].audio
		});
		const pinyin = c.sentences.map((s) => s.pinyin).filter(Boolean);
		const text = drillText(steps);
		expect(text.length).toBeGreaterThan(0);
		for (const t of text) for (const py of pinyin) expect(t).not.toContain(py);
	}, 15_000);
});
