import { SYLLABLE_BASE } from '#lib/audio/base.js';

export type Tone = { text: string; key: string | null; hanzi: string | null };
export type ChartCell = { syllable: string; initial: string; final: string; tones: Tone[] };
export type Player = (key: string, opts?: { base?: string }) => Promise<boolean>;

export const INITIALS = [
	'',
	'b',
	'p',
	'm',
	'f',
	'd',
	't',
	'n',
	'l',
	'g',
	'k',
	'h',
	'j',
	'q',
	'x',
	'zh',
	'ch',
	'sh',
	'r',
	'z',
	'c',
	's'
];
export const FINALS = [
	'a',
	'o',
	'e',
	'ai',
	'ei',
	'ao',
	'ou',
	'an',
	'en',
	'ang',
	'eng',
	'ong',
	'er',
	'i',
	'ia',
	'ie',
	'iao',
	'iu',
	'ian',
	'in',
	'iang',
	'ing',
	'iong',
	'u',
	'ua',
	'uo',
	'uai',
	'ui',
	'uan',
	'un',
	'uang',
	'ueng',
	'ü',
	'üe',
	'üan',
	'ün'
];

export { CONTOUR } from '#lib/pinyin/contour.js';

export const cellAt = (cells: ChartCell[], initial: string, final: string) =>
	cells.find((c) => c.initial === initial && c.final === final) ?? null;

export const findCell = (cells: ChartCell[], open: string | null) =>
	open ? (cells.find((c) => c.syllable === open) ?? null) : null;

export const arrivedInApp = (from: unknown, type: string | null) =>
	from !== null && type !== 'popstate';

export const backTarget = (hasPrevious: boolean) => (hasPrevious ? 'back' : 'h0-00');

export const playTone = (tone: Tone, player: Player) =>
	tone.key ? player(tone.key, { base: SYLLABLE_BASE }).catch(() => false) : Promise.resolve(false);
