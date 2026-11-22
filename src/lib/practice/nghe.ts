import { m } from '#lib/paraglide/messages.js';
import type { Step } from '#lib/lesson/steps/Choice.svelte';
import { itemId } from './queue';

type Input = { word: string; audio: string; pool: string[]; again?: boolean };

const seedOf = (text: string) => {
	let h = 2166136261;
	for (const ch of text) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619);
	return h >>> 0;
};

const shuffled = <T>(items: T[], key: string) => {
	let s = seedOf(key);
	const rand = () => {
		s = (s + 0x6d2b79f5) >>> 0;
		let t = s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
};

export const ngheStep = ({ word, audio, pool, again = false }: Input): Step => {
	const others = shuffled(
		[...new Set(pool)].filter((w) => w !== word),
		`${word}:others`
	);
	const options = shuffled([word, ...others.slice(0, 3)], `${word}:options`);
	return {
		kind: 'choice',
		id: itemId({ word, skill: 'nghe' }, again),
		ask: again ? `${m.practice_nghe_ask()} · ${m.practice_again()}` : m.practice_nghe_ask(),
		title: '',
		script: 'hanzi',
		audio,
		options,
		answer: word,
		instant: true,
		card: { word, skill: 'nghe' },
		missHint: again ? '' : m.practice_requeue_hint()
	};
};
