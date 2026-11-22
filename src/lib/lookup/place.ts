export const place = (r: { top: number; bottom: number }, H: number) =>
	r.bottom < H / 2
		? { top: r.bottom + 8, maxHeight: H - r.bottom - 24 }
		: { top: 8, maxHeight: Math.max(120, r.top - 16) };
