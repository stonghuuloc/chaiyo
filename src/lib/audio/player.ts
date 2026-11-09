import { AUDIO_BASE } from './base';

type Options = { base?: string; createAudio?: () => HTMLAudioElement };
type PlayOptions = { slow?: boolean; base?: string };

export function createPlayer({ base = AUDIO_BASE, createAudio = () => new Audio() }: Options = {}) {
	let audio: HTMLAudioElement | undefined;
	let last: string | null = null;
	let plays = 0;
	let token = 0;

	const url = (key: string, from = base) => `${from}/${key}.mp3`;

	return {
		url,
		element: (): HTMLAudioElement | null => audio ?? null,
		play(key: string, { slow, base: from = base }: PlayOptions = {}): Promise<boolean> {
			audio ??= createAudio();
			plays = slow === undefined ? (key === last ? plays + 1 : 1) : slow ? 2 : 1;
			last = key;
			const mine = ++token;
			audio.src = url(key, from);
			audio.preservesPitch = true;
			if ('webkitPreservesPitch' in audio) audio.webkitPreservesPitch = true;
			audio.defaultPlaybackRate = audio.playbackRate = plays % 2 ? 1 : 0.5;
			audio.currentTime = 0;
			let started: Promise<void>;
			try {
				started = audio.play();
			} catch (err) {
				started = Promise.reject(err);
			}
			return started.then(
				() => true,
				() => {
					if (mine === token) last = null;
					return false;
				}
			);
		}
	};
}

export const player = createPlayer();
export const { play } = player;
