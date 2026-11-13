import { afterEach, describe, expect, it, vi } from 'vitest';
import { keyIntent, keys, type KeyHandlers } from './keys';
import { modal } from './modal';

const base = {
	code: '',
	isComposing: false,
	metaKey: false,
	ctrlKey: false,
	altKey: false,
	repeat: false,
	defaultPrevented: false,
	target: null as unknown
};
const el = (selectors: string[]) => ({
	closest: (s: string) => (selectors.some((x) => s.includes(x)) ? {} : null)
});
const option = {
	closest: (s: string) => (s === '[aria-pressed]' || s.startsWith('button, a[href]') ? {} : null)
};
const handlers = () => ({ digit: vi.fn(), enter: vi.fn(), space: vi.fn(), escape: vi.fn() });
const fire = (h: KeyHandlers, e: Partial<typeof base>) => keyIntent({ ...base, ...e }, h)?.();

afterEach(() => vi.unstubAllGlobals());

describe('keyIntent', () => {
	it.each([
		['Digit1', 1],
		['Digit9', 9],
		['Numpad1', 1],
		['Numpad5', 5]
	])('Given_%s_When_Pressed_Then_DigitHandlerGets%i', (code, n) => {
		// Arrange
		const h = handlers();
		// Act
		fire(h, { code });
		// Assert
		expect(h.digit).toHaveBeenCalledWith(n);
	});

	it.each([['Digit0'], ['Numpad0'], ['KeyA'], ['Minus']])(
		'Given_%s_When_Pressed_Then_Ignored',
		(code) => {
			// Arrange
			const h = handlers();
			// Act
			const act = keyIntent({ ...base, code }, h);
			// Assert
			expect(act).toBeNull();
		}
	);

	it('Given_VietnameseLayoutDigitRow_When_CodeIsDigit1_Then_DigitOne', () => {
		// Arrange: this layout types "ă" on the physical 1 key, so event.key is no use
		const h = handlers();
		// Act
		keyIntent({ ...base, code: 'Digit1', key: 'ă' } as never, h)?.();
		// Assert
		expect(h.digit).toHaveBeenCalledWith(1);
	});

	it('Given_AzertyKeyOneTypedWithShift_When_CodeIsDigit1_Then_DigitOne', () => {
		// Arrange
		const h = handlers();
		// Act
		keyIntent({ ...base, code: 'Digit1', key: '&', shiftKey: true } as never, h)?.();
		// Assert
		expect(h.digit).toHaveBeenCalledWith(1);
	});

	it.each([
		['Enter', 'enter'],
		['NumpadEnter', 'enter'],
		['Space', 'space'],
		['Escape', 'escape']
	] as const)('Given_%s_When_Pressed_Then_%sHandler', (code, name) => {
		// Arrange
		const h = handlers();
		// Act
		fire(h, { code });
		// Assert
		expect(h[name]).toHaveBeenCalledOnce();
	});

	it.each([
		['composing', { isComposing: true }],
		['Cmd held', { metaKey: true }],
		['Ctrl held', { ctrlKey: true }],
		['Alt held', { altKey: true }],
		['key repeat', { repeat: true }],
		['already handled', { defaultPrevented: true }],
		['in an input', { target: el(['input']) }],
		['in a textarea', { target: el(['textarea']) }]
	])('Given_Digit1_When_%s_Then_Ignored', (_n, extra) => {
		// Arrange
		const h = handlers();
		// Act
		const act = keyIntent({ ...base, code: 'Digit1', ...extra }, h);
		// Assert
		expect(act).toBeNull();
	});

	it.each(['Enter', 'Space'])('Given_%s_When_ButtonFocused_Then_NativeActivationWins', (code) => {
		// Arrange
		const h = handlers();
		// Act
		const act = keyIntent({ ...base, code, target: el(['button']) }, h);
		// Assert
		expect(act).toBeNull();
	});

	it('Given_Enter_When_OptionButtonFocused_Then_EnterHandlerAdvances', () => {
		// Arrange
		const h = handlers();
		// Act
		fire(h, { code: 'Enter', target: option });
		// Assert
		expect(h.enter).toHaveBeenCalledOnce();
	});

	it('Given_Space_When_OptionButtonFocused_Then_NativeSelectWins', () => {
		// Arrange
		const h = handlers();
		// Act
		const act = keyIntent({ ...base, code: 'Space', target: option }, h);
		// Assert
		expect(act).toBeNull();
	});

	it('Given_OptionButtonFocused_When_EnterPressed_Then_ClickIsPrevented', () => {
		// Arrange
		const listeners: ((e: unknown) => void)[] = [];
		vi.stubGlobal('document', { activeElement: null });
		vi.stubGlobal('window', {
			addEventListener: (_: string, l: (e: unknown) => void) => listeners.push(l),
			removeEventListener: vi.fn()
		});
		const enter = vi.fn();
		keys({} as HTMLElement, { enter });
		const ev = {
			...base,
			code: 'Enter',
			target: option,
			preventDefault: vi.fn()
		};
		// Act
		listeners.forEach((l) => l(ev));
		// Assert
		expect(enter).toHaveBeenCalledOnce();
		expect(ev.preventDefault).toHaveBeenCalled();
	});

	it('Given_Escape_When_ButtonFocused_Then_StillCloses', () => {
		// Arrange
		const h = handlers();
		// Act
		fire(h, { code: 'Escape', target: el(['button']) });
		// Assert
		expect(h.escape).toHaveBeenCalledOnce();
	});

	it('Given_NoSpaceHandler_When_Space_Then_Ignored', () => {
		// Arrange
		const h = { enter: vi.fn() };
		// Act
		const act = keyIntent({ ...base, code: 'Space' }, h);
		// Assert
		expect(act).toBeNull();
	});
});

describe('keys action', () => {
	function stubDom() {
		const listeners: ((e: unknown) => void)[] = [];
		vi.stubGlobal('document', { activeElement: null });
		vi.stubGlobal('window', {
			addEventListener: (_: string, l: (e: unknown) => void) => listeners.push(l),
			removeEventListener: (_: string, l: (e: unknown) => void) =>
				listeners.splice(listeners.indexOf(l), 1)
		});
		return (e: Record<string, unknown>) => {
			const ev = { ...base, preventDefault: vi.fn(), ...e };
			[...listeners].forEach((l) => l(ev));
			return ev;
		};
	}

	it('Given_Mounted_When_Digit_Then_HandlerCalledAndKeyConsumed', () => {
		// Arrange
		const press = stubDom();
		const h = handlers();
		keys({} as HTMLElement, h);
		// Act
		const ev = press({ code: 'Digit3' });
		// Assert
		expect(h.digit).toHaveBeenCalledWith(3);
		expect(ev.preventDefault).toHaveBeenCalled();
	});

	it('Given_Unhandled_When_Key_Then_PreventDefaultNotCalled', () => {
		// Arrange
		const press = stubDom();
		keys({} as HTMLElement, { enter: vi.fn() });
		// Act
		const ev = press({ code: 'Space' });
		// Assert
		expect(ev.preventDefault).not.toHaveBeenCalled();
	});

	it('Given_Destroyed_When_Key_Then_Nothing', () => {
		// Arrange
		const press = stubDom();
		const h = handlers();
		keys({} as HTMLElement, h).destroy();
		// Act
		press({ code: 'Enter' });
		// Assert
		expect(h.enter).not.toHaveBeenCalled();
	});

	it('Given_Updated_When_Key_Then_NewHandlerRuns', () => {
		// Arrange
		const press = stubDom();
		const a = handlers();
		const b = handlers();
		const action = keys({} as HTMLElement, a);
		action.update(b);
		// Act
		press({ code: 'Enter' });
		// Assert
		expect(a.enter).not.toHaveBeenCalled();
		expect(b.enter).toHaveBeenCalledOnce();
	});

	it('Given_ModalOpen_When_EscapeOnce_Then_OnlyModalClosesAndFlowKeysStayIdle', () => {
		// Arrange: the modal's listener is registered after keys' and still runs first for the flow check
		const press = stubDom();
		const h = handlers();
		keys({} as HTMLElement, h);
		const onclose = vi.fn();
		const overlay = modal(
			{ focus: vi.fn(), querySelectorAll: () => [] } as unknown as HTMLElement,
			onclose
		);
		// Act
		press({ code: 'Escape', key: 'Escape' });
		press({ code: 'Digit1' });
		overlay.destroy();
		// Assert
		expect(onclose).toHaveBeenCalledOnce();
		expect(h.escape).not.toHaveBeenCalled();
		expect(h.digit).not.toHaveBeenCalled();
	});
});
