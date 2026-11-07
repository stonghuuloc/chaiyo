export type Frame = 0 | 1 | 2;

export type TalkingCastPlayer = {
	play(key: string, opts: { slow: boolean }): Promise<void>;
	url(key: string): string;
	element(): HTMLAudioElement | null;
};

const WINDOW_S = 0.02;

export const frameFor = (level: number): Frame => (level < 0.18 ? 0 : level < 0.5 ? 1 : 2);

export const smoothLevel = (level: number, target: number) =>
	level + (target - level) * (target > level ? 0.6 : 0.35);

export const bob = (level: number, t: number) => ({
	y: -5 * level,
	deg: Math.sin(t / 140) * 1.4 * level
});

export function envelope(samples: Float32Array | number[], sampleRate: number): number[] {
	const win = Math.round(sampleRate * WINDOW_S);
	const out: number[] = [];
	for (let s = 0; s < samples.length; s += win) {
		let e = 0;
		for (let k = s; k < s + win && k < samples.length; k++) e += samples[k] * samples[k];
		out.push(Math.sqrt(e / win));
	}
	const max = out.reduce((m, v) => (v > m ? v : m), 0) || 1;
	return out.map((v) => Math.min(1, (v / max) * 1.3));
}

export const levelAt = (env: number[], seconds: number) => env[Math.floor(seconds / WINDOW_S)] ?? 0;

export const clipSrc = (player: TalkingCastPlayer, clip: string) =>
	new URL(player.url(clip), location.href).href;

export const isPlaying = (
	player: TalkingCastPlayer,
	clip: string,
	el: HTMLAudioElement | null
): el is HTMLAudioElement => el !== null && el.src === clipSrc(player, clip);

export function createTap(player: TalkingCastPlayer, clip: string) {
	let taps = 0;
	return () => {
		taps = isPlaying(player, clip, player.element()) ? taps + 1 : 1;
		player.play(clip, { slow: taps % 2 === 0 }).catch(() => {});
	};
}

const envelopes = new Map<string, Promise<number[] | null>>();

export function loadEnvelope(url: string): Promise<number[] | null> {
	const cached = envelopes.get(url);
	if (cached) return cached;
	const p = (async () => {
		try {
			const Ctx = window.OfflineAudioContext;
			const decoded = await new Ctx(1, 44100, 44100).decodeAudioData(
				await (await fetch(url)).arrayBuffer()
			);
			return envelope(decoded.getChannelData(0), decoded.sampleRate);
		} catch {
			envelopes.delete(url);
			return null;
		}
	})();
	envelopes.set(url, p);
	return p;
}
