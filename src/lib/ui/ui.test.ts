import { readFileSync } from 'node:fs';
import { createRawSnippet, type Component } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Button from './Button.svelte';
import Chip from './Chip.svelte';
import Dialog from './Dialog.svelte';
import Section from './Section.svelte';
import Sheet from './Sheet.svelte';
import Toast from './Toast.svelte';

const text = (s: string) => createRawSnippet(() => ({ render: () => `<span>${s}</span>` }));
const html = <P extends Record<string, unknown>>(c: Component<P>, props: P) =>
	render(c, { props }).body;
const source = (f: string) => readFileSync(new URL(`./${f}`, import.meta.url), 'utf8');
const tokens = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');
const utilities = readFileSync(new URL('../styles/utilities.css', import.meta.url), 'utf8');
const classOf = (out: string, tag: string) =>
	out.match(new RegExp(`<${tag}[^>]*class="([^"]*)"`))?.[1] ?? '';
const variantClass = { primary: 'bg-lantern-red', ink: 'bg-ink', outline: 'border-ruled-line' };

describe('Button', () => {
	it.each(['primary', 'ink', 'outline'] as const)(
		'Given_Variant_When_Render_Then_HasVariantClass: %s',
		(variant) => {
			// Arrange
			const props = { variant, children: text('Go') };
			// Act
			const out = html(Button, props);
			// Assert
			expect(out).toContain('<button');
			expect(out).toContain(variantClass[variant]);
			expect(out).toContain('Go');
		}
	);

	it('Given_NoVariant_When_Render_Then_Primary', () => {
		// Arrange
		// Act
		const out = html(Button, { children: text('Go') });
		// Assert
		expect(out).toContain(variantClass.primary);
	});

	it('Given_Disabled_When_Render_Then_BothShadowLayersCleared', () => {
		// Arrange
		// Act
		const cls = classOf(html(Button, { disabled: true, children: text('Go') }), 'button').split(
			' '
		);
		// Assert
		expect(cls).toEqual(
			expect.arrayContaining(['disabled:shadow-none', 'disabled:inset-shadow-none'])
		);
	});

	it('Given_Href_When_Render_Then_Anchor', () => {
		// Arrange
		// Act
		const out = html(Button, { href: '/today', children: text('Go') });
		// Assert
		expect(out).toContain('<a');
		expect(out).toContain('href="/today"');
		expect(out).not.toContain('<button');
	});

	it('Given_Disabled_When_Render_Then_DisabledAttribute', () => {
		// Arrange
		// Act
		const out = html(Button, { disabled: true, children: text('Go') });
		// Assert
		expect(out).toMatch(/<button[^>]*disabled/);
	});

	it('Given_IconAndCaret_When_Render_Then_BothSpriteRefs', () => {
		// Arrange
		// Act
		const out = html(Button, { icon: 'fill-play', caret: true, children: text('Go') });
		// Assert
		expect(out).toContain('href="#i-fill-play"');
		expect(out).toContain('href="#i-regular-caret-right"');
	});

	it.each(['primary', 'ink', 'outline'] as const)(
		'Given_Variant_When_Render_Then_GeometryAndPressFromDesign: %s',
		(variant) => {
			// Arrange
			// Act
			const cls = classOf(html(Button, { variant, children: text('Go') }), 'button');
			// Assert
			expect(cls).toContain(variant === 'outline' ? 'h-[56px]' : 'h-[62px]');
			expect(cls).toContain('rounded-action');
			expect(cls).toContain('duration-(--motion-press)');
			expect(cls).toContain('motion-reduce:duration-(--motion-fade-reduced)');
			expect(cls.includes('scale-[.985]')).toBe(variant !== 'outline');
			expect(cls).not.toMatch(/(^| )outline( |$)/);
		}
	);
});

describe('Sheet', () => {
	it('Given_Closed_When_Render_Then_Empty', () => {
		// Arrange
		// Act
		const out = html(Sheet, { open: false, title: 'T', children: text('x') });
		// Assert
		expect(out).not.toContain('role="dialog"');
	});

	it('Given_Open_When_Render_Then_ModalDialogWithTitle', () => {
		// Arrange
		// Act
		const out = html(Sheet, { open: true, title: 'Hello', children: text('Body') });
		// Assert
		expect(out).toContain('role="dialog"');
		expect(out).toContain('aria-modal="true"');
		expect(out).toContain('Hello');
		expect(out).toContain('Body');
	});

	it('Given_Open_When_Render_Then_ColumnWidthActionRadiusAndScrim', () => {
		// Arrange
		// Act
		const out = html(Sheet, { open: true, title: 'T', children: text('x') });
		// Assert
		expect(classOf(out, 'div')).toContain('bg-scrim');
		expect(out).toContain('max-w-column');
		expect(out).toContain('rounded-t-action');
		expect(out).toContain('env(safe-area-inset-bottom');
	});
});

describe('Dialog', () => {
	it('Given_Closed_When_Render_Then_Empty', () => {
		// Arrange
		// Act
		const out = html(Dialog, { open: false, title: 'T', children: text('x') });
		// Assert
		expect(out).not.toContain('role="dialog"');
	});

	it('Given_Open_When_Render_Then_ModalDialogWithTitle', () => {
		// Arrange
		// Act
		const out = html(Dialog, { open: true, title: 'Hello', children: text('Body') });
		// Assert
		expect(out).toContain('role="dialog"');
		expect(out).toContain('aria-modal="true"');
		expect(out).toContain('Hello');
	});

	it('Given_Open_When_Render_Then_MaxWidth340FromToken', () => {
		// Arrange
		// Act
		const out = html(Dialog, { open: true, title: 'T', children: text('x') });
		// Assert
		expect(tokens).toContain('--container-dialog: 340px;');
		expect(out).toContain('max-w-dialog');
		expect(out).toContain('w-[calc(100%-40px)]');
		expect(out).toContain('shadow-overlay');
	});

	it('Given_Open_When_Render_Then_TitleSizeComesFromActionToken', () => {
		// Arrange
		// Act
		const out = html(Dialog, { open: true, title: 'T', children: text('x') });
		// Assert
		expect(tokens).toContain('--text-action: 21px;');
		expect(classOf(out, 'h2')).toContain('text-action');
	});
});

describe('Chip', () => {
	it('Given_Facts_When_Render_Then_AllInsideChip', () => {
		// Arrange
		// Act
		const out = html(Chip, { children: text('12 ngày') });
		// Assert
		expect(classOf(out, 'div')).toContain('bg-frost-tint');
		expect(out).toContain('12 ngày');
	});

	it('Given_Facts_When_Render_Then_FrostPillWithDivider', () => {
		// Arrange
		// Act
		const cls = classOf(html(Chip, { children: text('12 ngày') }), 'div').split(' ');
		// Assert
		expect(cls).toEqual(
			expect.arrayContaining([
				'h-10',
				'text-chip',
				'bg-frost-tint',
				'border-frost-edge',
				'shadow-frost',
				'inset-shadow-frost',
				'backdrop-blur-frost',
				'divide-frost'
			])
		);
		expect(utilities).toContain('var(--color-frost-divider)');
	});
});

describe('Section', () => {
	it('Given_Content_When_Render_Then_SectionElement', () => {
		// Arrange
		// Act
		const out = html(Section, { children: text('Content') });
		// Assert
		expect(out).toContain('<section');
		expect(out).toContain('Content');
	});

	it('Given_Content_When_Render_Then_DividerAndPaddingFromDesign', () => {
		// Arrange
		// Act
		const cls = classOf(html(Section, { children: text('x') }), 'section');
		// Assert
		expect(cls.split(' ')).toEqual(
			expect.arrayContaining([
				'border-t',
				'border-ruled-line',
				'pt-6',
				'mt-5',
				'first:mt-0',
				'first:border-t-0'
			])
		);
	});
});

describe('Toast', () => {
	it('Given_Closed_When_Render_Then_Empty', () => {
		// Arrange
		// Act
		const out = html(Toast, { open: false, message: 'Done' });
		// Assert
		expect(out).not.toContain('role="status"');
	});

	it('Given_OpenWithAction_When_Render_Then_StatusAndActionButton', () => {
		// Arrange
		// Act
		const out = html(Toast, { open: true, message: 'Đã xử lý', actionLabel: 'Hoàn tác' });
		// Assert
		expect(out).toContain('role="status"');
		expect(out).toContain('Đã xử lý');
		expect(out).toMatch(/<button[^>]*>Hoàn tác/);
	});

	it('Given_ToastSource_Then_TimerRestartsOnNewMessage', () => {
		// Arrange
		const effect = source('Toast.svelte').match(/\$effect\(\(\) => \{[\s\S]*?\n\t\}\);/)?.[0] ?? '';
		// Act
		const tracked = ['open', 'message', 'actionLabel', 'duration'].map((p) =>
			new RegExp(`\\b${p}\\b`).test(effect)
		);
		// Assert
		expect(tracked).toEqual([true, true, true, true]);
	});

	it('Given_OpenWithoutAction_When_Render_Then_NoButton', () => {
		// Arrange
		// Act
		const out = html(Toast, { open: true, message: 'Done' });
		// Assert
		expect(out).not.toContain('<button');
	});
});
