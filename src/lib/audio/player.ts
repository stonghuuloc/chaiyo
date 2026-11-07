type Options = { base?: string; createAudio?: () => HTMLAudioElement };

export function createPlayer({ base = '/audio', createAudio = () => new Audio() }: Options = {}) {
	let audio: HTMLAudioElement | undefined;
	let last: string | null = null;
	let plays = 0;
	let token = 0;

	return {
		play(key: string, { slow }: { slow?: boolean } = {}): Promise<boolean> {
			audio ??= createAudio();
			plays = slow === undefined ? (key === last ? plays + 1 : 1) : slow ? 2 : 1;
			last = key;
			const mine = ++token;
			audio.src = `${base}/${key}.mp3`;
			audio.preservesPitch = true;
			(audio as { webkitPreservesPitch?: boolean }).webkitPreservesPitch = true;
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

export const { play } = createPlayer();
