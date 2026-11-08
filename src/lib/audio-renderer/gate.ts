import { spawnSync } from 'node:child_process';

const MIN_SECONDS_PER_SYLLABLE = 0.13;
const DIGITS = '零一二三四五六七八九';

function assertStarted(r: ReturnType<typeof spawnSync>) {
	if (!r.error) return;
	throw new Error(
		(r.error as NodeJS.ErrnoException).code === 'ENOENT'
			? 'ffmpeg is not installed or not on PATH'
			: `ffmpeg could not start: ${r.error.message}`
	);
}

export const countHanzi = (text: string) => (text.match(/[\u4e00-\u9fff]/g) ?? []).length;

export const heard = (text: string) =>
	[...text]
		.map((c) => (/[0-9]/.test(c) ? DIGITS[+c] : c === '您' ? '你' : c === '對' ? '对' : c))
		.filter((c) => /[一-鿿]/.test(c))
		.join('');

export function audioFaults(file: string, hanzi?: number): string[] {
	const r = spawnSync(
		'ffmpeg',
		[
			'-hide_banner',
			'-i',
			file,
			'-af',
			'silencedetect=noise=-35dB:d=0.1,volumedetect',
			'-f',
			'null',
			'-'
		],
		{ encoding: 'utf8' }
	);
	assertStarted(r);
	const log = r.stderr;
	const dur = log
		.match(/time=(\d+):(\d+):([\d.]+)/g)
		?.pop()
		?.match(/(\d+):(\d+):([\d.]+)/);
	const total = dur ? +dur[1] * 3600 + +dur[2] * 60 + +dur[3] : 0;
	const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
	const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
	const silent = starts.reduce((acc, st, i) => acc + (ends[i] ?? total) - st, 0);
	const speech = total - silent;
	const peak = +(log.match(/max_volume: (-?[\d.]+) dB/)?.[1] ?? -99);
	const faults: string[] = [];
	if (total < 0.3) faults.push(`too short (${total.toFixed(2)} s)`);
	if (total > 0 && silent / total > 0.8) faults.push('mostly silence');
	if (peak > -0.1) faults.push(`clipping (peak ${peak} dB)`);
	if (hanzi && speech / hanzi < MIN_SECONDS_PER_SYLLABLE)
		faults.push(
			`rushed (${(speech / hanzi).toFixed(2)} s/syllable, min ${MIN_SECONDS_PER_SYLLABLE})`
		);
	return faults;
}

const TRIM_SILENCE =
	'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse';

export function mp3Filter(tempo: number, opts: { trimSilence?: boolean } = {}): string {
	return [
		opts.trimSilence ? TRIM_SILENCE : '',
		tempo === 1 ? '' : `atempo=${tempo}`,
		'loudnorm=I=-16:TP=-1.5:LRA=11'
	]
		.filter(Boolean)
		.join(',');
}

export function encodeMp3(
	wav: string,
	out: string,
	tempo: number,
	opts: { trimSilence?: boolean } = {}
) {
	const filter = mp3Filter(tempo, opts);
	const r = spawnSync(
		'ffmpeg',
		[
			'-y',
			'-loglevel',
			'error',
			'-i',
			wav,
			'-af',
			filter,
			'-ac',
			'1',
			'-ar',
			'24000',
			'-b:a',
			'48k',
			out
		],
		{ encoding: 'utf8' }
	);
	assertStarted(r);
	if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr.trim()}`);
}
