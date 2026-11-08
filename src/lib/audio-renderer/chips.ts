import type { AudioEntry } from '../content/import/audio';
import { encodeMp3 } from './gate';

/** Marked-pinyin text as the audio manifest stores a chip -> the phrase Azure reads. */
export const CHIP_HANZI: Readonly<Record<string, string>> = {
	'yì qǐ': '一起',
	'nǐ men': '你们',
	'shí yī': '十一',
	'hěn hǎo': '很好',
	'hǎo chī': '好吃',
	'ní hǎo': '你好',
	'bù chī': '不吃',
	'bú shì': '不是',
	'yí gè': '一个',
	'bù lái': '不来',
	'yí dìng': '一定',
	'lǎo shī': '老师',
	'bú qù': '不去',
	'shuǐ guǒ': '水果',
	'yí xià': '一下',
	'bù hǎo': '不好',
	'yì tiān': '一天',
	'yì nián': '一年',
	'mā ma': '妈妈',
	'nǐ hǎo': '你好',
	'duì bu qǐ': '对不起'
};

const CHIP_VOICE = 'zh-CN-YunxiNeural';
const CHIP_RATE = '-10%';
const CHIP_OUTPUT_FORMAT = 'riff-24khz-16bit-mono-pcm';

const TTS_URL = (region: string) =>
	`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

export type AzureSpeech = { key: string; region: string };

/** Chips are multi-syllable syllable entries: the manifest stores their marked pinyin in `hanzi`. */
export const chipEntries = (entries: AudioEntry[]): AudioEntry[] =>
	entries.filter((e) => e.kind === 'syllable' && e.hanzi.includes(' '));

export function chipSsml(phrase: string): string {
	return (
		'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">' +
		`<voice name="${CHIP_VOICE}"><prosody rate="${CHIP_RATE}">${phrase}</prosody></voice></speak>`
	);
}

export async function chipWaveform(
	azure: AzureSpeech,
	phrase: string,
	fetchImpl: typeof fetch = fetch
): Promise<Uint8Array<ArrayBuffer>> {
	const res = await fetchImpl(TTS_URL(azure.region), {
		method: 'POST',
		headers: {
			'Ocp-Apim-Subscription-Key': azure.key,
			'Content-Type': 'application/ssml+xml',
			'X-Microsoft-OutputFormat': CHIP_OUTPUT_FORMAT,
			'User-Agent': 'chaiyo-render-chip-clips'
		},
		body: chipSsml(phrase)
	});
	if (!res.ok) throw new Error(`Azure Speech answered ${res.status}`);
	return new Uint8Array(await res.arrayBuffer());
}

/** Encode a chip wav: trim both silences and loudnorm, mono 24 kHz 48 kbps, no atempo. */
export const encodeChipMp3 = (wav: string, out: string) =>
	encodeMp3(wav, out, 1, { trimSilence: true });
