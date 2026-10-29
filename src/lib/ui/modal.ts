// Esc closes, focus moves into the panel and returns to whoever opened it. No focus trap (no AC asks for one).
export function modal(node: HTMLElement, onclose: () => void) {
	const opener = document.activeElement as HTMLElement | null;
	node.focus();
	const onKey = (e: KeyboardEvent) => {
		if (e.key === 'Escape') onclose();
	};
	window.addEventListener('keydown', onKey);
	return {
		update(next: () => void) {
			onclose = next;
		},
		destroy() {
			window.removeEventListener('keydown', onKey);
			opener?.focus?.();
		}
	};
}
