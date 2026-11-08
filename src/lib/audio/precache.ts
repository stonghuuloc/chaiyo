import { AUDIO_BASE } from './base';

export async function precache(
	keys: string[],
	base = AUDIO_BASE
): Promise<{ ok: number; failed: number }> {
	const none = { ok: 0, failed: keys.length };
	if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return none;
	const worker = (await navigator.serviceWorker.getRegistration())?.active;
	if (!worker) return none;
	const urls = keys.map((key) => new URL(`${base}/${key}.mp3`, location.href).href);
	return new Promise((resolve) => {
		const timer = setTimeout(() => resolve(none), 10_000);
		const channel = new MessageChannel();
		channel.port1.onmessage = (e) => {
			clearTimeout(timer);
			resolve({ ok: e.data.ok, failed: e.data.failed });
		};
		worker.postMessage({ type: 'audio-precache', urls }, [channel.port2]);
	});
}
