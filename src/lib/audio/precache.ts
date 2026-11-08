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
		const channel = new MessageChannel();
		const timer = setTimeout(() => {
			channel.port1.close();
			resolve(none);
		}, 10_000);
		channel.port1.onmessage = (e) => {
			clearTimeout(timer);
			channel.port1.close();
			const { ok, failed } = e.data ?? {};
			resolve(typeof ok === 'number' && typeof failed === 'number' ? { ok, failed } : none);
		};
		worker.postMessage({ type: 'audio-precache', urls }, [channel.port2]);
	});
}
