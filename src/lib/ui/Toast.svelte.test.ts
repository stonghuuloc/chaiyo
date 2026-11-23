import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Toast from './Toast.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

afterEach(() => {
	vi.useRealTimers();
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('Toast timer', () => {
	it('Given_SameMessageNewNonce_When_Rerender_Then_TimerRestarts', () => {
		// Arrange
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		const onclose = vi.fn();
		const props = $state({ open: true, message: 'Khoá', duration: 2200, nonce: 1, onclose });
		target = document.createElement('div');
		document.body.append(target);
		app = mount(Toast, { target, props }) as Record<string, unknown>;
		flushSync();
		vi.advanceTimersByTime(2000);

		// Act
		props.nonce = 2;
		flushSync();
		vi.advanceTimersByTime(2100);
		const early = onclose.mock.calls.length;
		vi.advanceTimersByTime(100);

		// Assert
		expect(early).toBe(0);
		expect(onclose).toHaveBeenCalledTimes(1);
	});
});
