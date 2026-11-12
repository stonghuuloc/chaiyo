export async function avatarDataUrl(file: File, size = 256) {
	const bmp = await createImageBitmap(file);
	const s = Math.min(bmp.width, bmp.height);
	const c = Object.assign(document.createElement('canvas'), { width: size, height: size });
	const ctx = c.getContext('2d');
	if (!ctx) throw new Error('no 2d canvas');
	ctx.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
	return c.toDataURL('image/jpeg', 0.8);
}
