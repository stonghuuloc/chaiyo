export async function copyText(text: string): Promise<boolean> {
	const clip = globalThis.navigator?.clipboard;
	if (!clip?.writeText) return false;
	try {
		await clip.writeText(text);
		return true;
	} catch {
		return false;
	}
}
