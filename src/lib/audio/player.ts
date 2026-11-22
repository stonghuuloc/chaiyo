import { AUDIO_BASE } from './base';

type Options = { base?: string; createAudio?: () => HTMLAudioElement };
type PlayOptions = { slow?: boolean; base?: string };

export function createPlayer({ base = AUDIO_BASE, createAudio = () => new Audio() }: Options = {}) {
	let audio: HTMLAudioElement | undefined;
	let last: string | null = null;
	let plays = 0;
	let token = 0;

	let stop: ((ended: boolean) => void) | null = null;

	const url = (key: string, from = base) => `${from}/${key}.mp3`;
	const interrupt = () => stop?.(false);

	function play(key: string, { slow, base: from = base }: PlayOptions = {}): Promise<boolean> {
		interrupt();
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

	// true when the clip ended (or cannot play); false when pause or another clip cut it off.
	function playToEnd(key: string, opts: PlayOptions = {}): Promise<boolean> {
		const started = play(key, opts);
		const el = audio!;
		return new Promise((resolve) => {
			const done = (ended: boolean) => {
				if (stop !== done) return;
				stop = null;
				el.removeEventListener('ended', finish);
				el.removeEventListener('error', finish);
				resolve(ended);
			};
			const finish = () => done(true);
			stop = done;
			el.addEventListener('ended', finish);
			el.addEventListener('error', finish);
			void started.then((ok) => ok || done(true));
		});
	}

	return {
		url,
		element: (): HTMLAudioElement | null => audio ?? null,
		play,
		playToEnd,
		pause() {
			audio?.pause();
			interrupt();
		}
	};
}

export const player = createPlayer();
export const { play } = player;
