import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { z } from 'zod';
import { audioFaults, countHanzi, encodeMp3, heard } from './gate';
import type { Engine } from './types';

const Cast = z.object({
	audition: z.string().min(1),
	voices: z.record(
		z.string(),
		z.object({ id: z.string(), instruct: z.string(), seed: z.number(), pace: z.number() })
	),
	overrides: z
		.record(
			z.string(),
			z.object({
				hanzi: z.string(),
				voice: z.string(),
				say: z.string().optional(),
				seed: z.number().optional()
			})
		)
		.default({})
});
export type Cast = z.infer<typeof Cast>;

export const parseCast = (yamlText: string): Cast => Cast.parse(parse(yamlText));

export type RenderJob = {
	out: string;
	text: string;
	seed: number;
	instruct?: string;
	ref_audio?: string;
	ref_text?: string;
};

export type Worker = {
	render(job: RenderJob): Promise<void>;
	transcribe(mp3: string): Promise<string>;
	close(): void;
};

export type EngineDeps = {
	startWorker: () => Worker;
	cacheDir: string;
	encode?: (wav: string, mp3: string, tempo: number) => void;
	faults?: (file: string, hanzi?: number) => string[];
};

const MAX_ATTEMPTS = 4;

export function pythonWorker(python: string): Worker {
	const script = join(dirname(fileURLToPath(import.meta.url)), 'omnivoice_worker.py');
	const child = spawn(python, [script], { stdio: ['pipe', 'pipe', 'inherit'] });
	const lines = createInterface({ input: child.stdout })[Symbol.asyncIterator]();
	const spawnFailed = new Promise<never>((_, reject) => child.once('error', reject));
	const ask = async (request: object) => {
		child.stdin.write(JSON.stringify(request) + '\n');
		const next = await Promise.race([lines.next(), spawnFailed]);
		if (next.done) throw new Error('OmniVoice worker exited');
		const reply = JSON.parse(next.value) as { text?: string; error?: string };
		if (reply.error) throw new Error(reply.error);
		return reply;
	};
	return {
		async render(job) {
			await ask({ op: 'render', ...job });
		},
		async transcribe(mp3) {
			return (await ask({ op: 'transcribe', mp3 })).text ?? '';
		},
		close: () => child.stdin.end()
	};
}

export function omniVoiceEngine(cast: Cast, deps: EngineDeps): Engine & { close(): void } {
	const encode = deps.encode ?? encodeMp3;
	const faultsOf = deps.faults ?? audioFaults;
	const work = mkdtempSync(join(tmpdir(), 'chaiyo-render-'));
	let worker: Worker | undefined;
	const getWorker = () => (worker ??= deps.startWorker());
	const refs = new Map<string, Promise<string>>();
	let clip = 0;

	const refWav = (name: string) => {
		const voice = cast.voices[name];
		if (!voice) return Promise.reject(new Error(`unknown voice: ${name}`));
		let ref = refs.get(name);
		if (ref) return ref;
		const hash = createHash('sha256').update(voice.instruct).digest('hex').slice(0, 8);
		const wav = join(deps.cacheDir, 'voices', `${voice.id}-${voice.seed}-${hash}.wav`);
		ref = (async () => {
			if (existsSync(wav)) return wav;
			mkdirSync(dirname(wav), { recursive: true });
			await getWorker().render({
				out: wav,
				text: cast.audition,
				seed: voice.seed,
				instruct: voice.instruct
			});
			const faults = faultsOf(wav);
			if (faults.length) {
				rmSync(wav, { force: true });
				throw new Error(`audition for ${name} failed: ${faults.join('; ')}`);
			}
			return wav;
		})();
		refs.set(name, ref);
		return ref;
	};

	return {
		async synthesize(req) {
			const voice = cast.voices[req.voice];
			if (!voice) throw new Error(`unknown voice: ${req.voice}`);
			const ref = await refWav(req.voice);
			const override = cast.overrides[req.key];
			const pinned = override?.seed !== undefined || override?.say !== undefined;
			const text = override?.say ?? req.text;
			let seed = override?.seed ?? voice.seed;
			const wav = join(work, `${clip}.wav`);
			const mp3 = join(work, `${clip++}.mp3`);
			let lastFault = '';
			for (let attempt = 0; attempt < (pinned ? 1 : MAX_ATTEMPTS); attempt++) {
				seed += attempt * 1000;
				await getWorker().render({ out: wav, text, seed, ref_audio: ref, ref_text: cast.audition });
				encode(wav, mp3, voice.pace);
				const faults = faultsOf(mp3, countHanzi(req.hanzi));
				if (!faults.length && !pinned && req.kind !== 'syllable') {
					const said = await getWorker().transcribe(mp3);
					if (heard(said) !== heard(req.hanzi))
						faults.push(`Whisper heard "${said}", want "${req.hanzi}"`);
				}
				if (!faults.length) return readFileSync(mp3);
				lastFault = faults.join('; ');
			}
			throw new Error(`${req.hanzi}: ${lastFault}`);
		},
		close() {
			worker?.close();
			rmSync(work, { recursive: true, force: true });
		}
	};
}
