import { afterEach, describe, expect, it, vi } from 'vitest';
import { modal, wrapFocus } from './modal';

type Listener = (e: Partial<KeyboardEvent>) => void;

const fakeNode = (items: unknown[] = []) =>
	({ focus: vi.fn(), querySelectorAll: () => items }) as unknown as HTMLElement;

function stubDom() {
	const listeners: Listener[] = [];
	vi.stubGlobal('document', { activeElement: null });
	vi.stubGlobal('window', {
		addEventListener: (_: string, l: Listener) => listeners.push(l),
		removeEventListener: (_: string, l: Listener) => listeners.splice(listeners.indexOf(l), 1)
	});
	return (key: string, shiftKey = false) => {
		const e = { key, shiftKey, preventDefault: vi.fn() };
		[...listeners].forEach((l) => l(e));
		return e;
	};
}

afterEach(() => vi.unstubAllGlobals());

describe('wrapFocus', () => {
	const items = ['a', 'b', 'c'];

	it.each([
		['last item, Tab', 'c', false, 'a'],
		['first item, Shift+Tab', 'a', true, 'c'],
		['panel itself, Tab', null, false, 'a'],
		['panel itself, Shift+Tab', null, true, 'c'],
		['middle item, Tab', 'b', false, null],
		['middle item, Shift+Tab', 'b', true, null]
	])('Given_%s_Then_Target', (_, active, back, expected) => {
		// Arrange
		// Act
		const target = wrapFocus(items, active, back);
		// Assert
		expect(target).toBe(expected);
	});
});

describe('modal', () => {
	it('Given_DialogOverSheet_When_Escape_Then_OnlyDialogCloses', () => {
		// Arrange
		const press = stubDom();
		const closeSheet = vi.fn();
		const closeDialog = vi.fn();
		const sheet = modal(fakeNode(), closeSheet);
		const dialog = modal(fakeNode(), closeDialog);
		// Act
		press('Escape');
		dialog.destroy();
		press('Escape');
		sheet.destroy();
		// Assert
		expect(closeDialog).toHaveBeenCalledTimes(1);
		expect(closeSheet).toHaveBeenCalledTimes(1);
	});

	it('Given_FocusOnLastItem_When_Tab_Then_WrapsToFirst', () => {
		// Arrange
		const press = stubDom();
		const first = { focus: vi.fn() };
		const last = { focus: vi.fn() };
		const panel = modal(fakeNode([first, last]), vi.fn());
		vi.stubGlobal('document', { activeElement: last });
		// Act
		const e = press('Tab');
		panel.destroy();
		// Assert
		expect(e.preventDefault).toHaveBeenCalled();
		expect(first.focus).toHaveBeenCalled();
	});

	it('Given_NoFocusableItems_When_Tab_Then_FocusStaysOnPanel', () => {
		// Arrange
		const press = stubDom();
		const node = fakeNode();
		const panel = modal(node, vi.fn());
		// Act
		const e = press('Tab');
		panel.destroy();
		// Assert
		expect(e.preventDefault).toHaveBeenCalled();
		expect(node.focus).toHaveBeenCalledTimes(2);
	});
});
