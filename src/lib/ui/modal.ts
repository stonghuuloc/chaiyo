// Esc closes the top modal only, Tab cycles inside it, focus returns to whoever opened it.
const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const stack: HTMLElement[] = [];

// Where Tab should send focus to stay inside the panel; null = let the browser move it.
export function wrapFocus<T>(items: T[], active: T | null, back: boolean): T | null {
	if (items.length === 0) return null;
	const i = active === null ? -1 : items.indexOf(active);
	if (back) return i <= 0 ? items[items.length - 1] : null;
	return i === -1 || i === items.length - 1 ? items[0] : null;
}

export function modal(node: HTMLElement, onclose: () => void) {
	const opener = document.activeElement as HTMLElement | null;
	stack.push(node);
	node.focus();
	const onKey = (e: KeyboardEvent) => {
		if (stack.at(-1) !== node) return;
		if (e.key === 'Escape') return onclose();
		if (e.key !== 'Tab') return;
		const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)];
		const active = document.activeElement as HTMLElement | null;
		const target = items.length ? wrapFocus(items, active, e.shiftKey) : node;
		if (target) {
			e.preventDefault();
			target.focus();
		}
	};
	window.addEventListener('keydown', onKey);
	return {
		update(next: () => void) {
			onclose = next;
		},
		destroy() {
			window.removeEventListener('keydown', onKey);
			stack.splice(stack.indexOf(node), 1);
			opener?.focus?.();
		}
	};
}
