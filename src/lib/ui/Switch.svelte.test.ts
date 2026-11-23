import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Switch from './Switch.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const render = (props: { checked: boolean; disabled?: boolean }) => {
	const onchange = vi.fn();
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Switch, { target, props: { label: 'Ẩn hồ sơ', onchange, ...props } }) as Record<
		string,
		unknown
	>;
	flushSync();
	return { onchange, el: target.querySelector<HTMLButtonElement>('[role="switch"]')! };
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('Switch', () => {
	it('Given_Off_When_Click_Then_OnchangeOnce', () => {
		const { onchange, el } = render({ checked: false });
		el.click();
		expect(onchange).toHaveBeenCalledOnce();
		expect(el.getAttribute('aria-checked')).toBe('false');
		expect(el.getAttribute('aria-label')).toBe('Ẩn hồ sơ');
	});

	it('Given_Checked_When_Render_Then_AriaCheckedTrue', () => {
		const { el } = render({ checked: true });
		expect(el.getAttribute('aria-checked')).toBe('true');
	});

	it('Given_Disabled_When_Click_Then_NoCall', () => {
		const { onchange, el } = render({ checked: false, disabled: true });
		el.click();
		expect(onchange).not.toHaveBeenCalled();
	});
});
