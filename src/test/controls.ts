export const FREEZE_ACTION = /\b(dùng|mua|kích hoạt|bật|spend|buy|activate)\b/i;

export const controls = (root: ParentNode): HTMLElement[] => [
	...root.querySelectorAll<HTMLElement>('button, a[href], [role=button], input')
];

export const controlName = (el: HTMLElement): string =>
	el.getAttribute('aria-label') ?? el.textContent?.trim() ?? '';
