import { hasOpenModal } from './modal';

// Keys for focus flows (ADR 0008 §6), matched by event.code so the keyboard layout does not matter.
export type KeyHandlers = {
	digit?: (n: number) => void;
	enter?: () => void;
	space?: () => void;
	escape?: () => void;
};

type KeyEventLike = Pick<
	KeyboardEvent,
	'code' | 'isComposing' | 'metaKey' | 'ctrlKey' | 'altKey' | 'repeat' | 'defaultPrevented'
> & { target: unknown };

const TEXT_FIELD = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
const NATIVE_ACTIVATION = 'button, a[href], summary, [role="button"], [role="link"]';

const matches = (target: unknown, selector: string) =>
	typeof (target as Element | null)?.closest === 'function' &&
	(target as Element).closest(selector) !== null;

// What a key press means, or null when the handler must stay out of the way.
export function keyIntent(e: KeyEventLike, handlers: KeyHandlers): (() => void) | null {
	if (e.isComposing || e.defaultPrevented || e.repeat) return null;
	if (e.metaKey || e.ctrlKey || e.altKey) return null;
	if (hasOpenModal() || matches(e.target, TEXT_FIELD)) return null;
	const digit = /^(?:Digit|Numpad)([1-9])$/.exec(e.code)?.[1];
	if (digit) return handlers.digit ? () => handlers.digit!(Number(digit)) : null;
	if (e.code === 'Escape') return handlers.escape ?? null;
	if (matches(e.target, NATIVE_ACTIVATION)) return null;
	if (e.code === 'Enter' || e.code === 'NumpadEnter') return handlers.enter ?? null;
	if (e.code === 'Space') return handlers.space ?? null;
	return null;
}

export function keys(_node: HTMLElement, handlers: KeyHandlers) {
	const onKey = (e: KeyboardEvent) => {
		const act = keyIntent(e, handlers);
		if (!act) return;
		e.preventDefault();
		act();
	};
	window.addEventListener('keydown', onKey);
	return {
		update(next: KeyHandlers) {
			handlers = next;
		},
		destroy() {
			window.removeEventListener('keydown', onKey);
		}
	};
}
