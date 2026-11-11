import {
	audioKey,
	DIALOGUE_STYLE,
	READING_STYLE,
	WORD_STYLE,
	type ClipFolder
} from '#lib/content/import/audio.js';

const sample: [string, string, string | undefined, ClipFolder][] = [
	...['不客气。', '你好！', '谢谢！', '对不起！', '没关系。', '您好！', '再见！', '你们好！'].map(
		(t): [string, string, string, ClipFolder] => [t, 'redpanda', READING_STYLE, 'examples']
	),
	['对不起！', 'takin', DIALOGUE_STYLE.takin, 'dialogue'],
	...['你们', '对不起', '再见', '好', '没关系', '谢谢', '您', '你好', '不客气', '你'].map(
		(t): [string, string, string, ClipFolder] => [t, 'redpanda', WORD_STYLE, 'words']
	)
];

export const clips = sample.map(([hanzi, voice, style, folder]) => ({
	key: audioKey(hanzi, voice, style, folder),
	hanzi,
	voice
}));
