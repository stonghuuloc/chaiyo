import { level } from './hold';

export class MicBlocked extends Error {}

export type Mic = {
	level: () => number;
	close: () => void;
};

export async function openMic(): Promise<Mic> {
	const media = navigator.mediaDevices;
	if (!media?.getUserMedia) throw new MicBlocked('no mediaDevices');

	let stream: MediaStream;
	try {
		stream = await media.getUserMedia({ audio: true });
	} catch {
		throw new MicBlocked('microphone denied');
	}

	let ctx: AudioContext | undefined;
	try {
		ctx = new AudioContext();
		const analyser = ctx.createAnalyser();
		analyser.fftSize = 1024;
		ctx.createMediaStreamSource(stream).connect(analyser);
		const buf = new Uint8Array(analyser.fftSize);
		const audio = ctx;
		let closed = false;
		return {
			level: () => {
				if (closed) return 0;
				analyser.getByteTimeDomainData(buf);
				return level(buf);
			},
			close: () => {
				if (closed) return;
				closed = true;
				for (const track of stream.getTracks()) track.stop();
				void audio.close().catch(() => {});
			}
		};
	} catch {
		for (const track of stream.getTracks()) track.stop();
		void ctx?.close().catch(() => {});
		throw new MicBlocked('audio context');
	}
}
