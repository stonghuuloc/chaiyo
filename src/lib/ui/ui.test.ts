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
			expect(out).toContain(`btn ${variant}`);
			expect(out).toContain('Go');
		}
	);

	it('Given_NoVariant_When_Render_Then_Primary', () => {
		// Arrange
		// Act
		const out = html(Button, { children: text('Go') });
		// Assert
		expect(out).toContain('btn primary');
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

	it('Given_ButtonSource_Then_GeometryComesFromDesign', () => {
		// Arrange
		const s = source('Button.svelte');
		// Act
		const checks = [
			/height:\s*62px/.test(s),
			/height:\s*56px/.test(s),
			s.includes('var(--radius-action)'),
			s.includes('scale(0.985)'),
			s.includes('var(--motion-press)'),
			s.includes('prefers-reduced-motion')
		];
		// Assert
		expect(checks).toEqual([true, true, true, true, true, true]);
	});
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

	it('Given_SheetSource_Then_UsesColumnAndActionRadius', () => {
		// Arrange
		const s = source('Sheet.svelte');
		// Act
		const checks = [
			s.includes('var(--size-column)'),
			s.includes('var(--radius-action)'),
			s.includes('env(safe-area-inset-bottom'),
			s.includes('var(--overlay-scrim)')
		];
		// Assert
		expect(checks).toEqual([true, true, true, true]);
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

	it('Given_DialogSource_Then_MaxWidth340FromToken', () => {
		// Arrange
		const s = source('Dialog.svelte');
		// Act
		const uses = s.includes('min(var(--size-dialog-max)');
		// Assert
		expect(tokens).toContain('--size-dialog-max: 340px;');
		expect(uses).toBe(true);
		expect(s).toContain('var(--overlay-shadow)');
	});
});

describe('Chip', () => {
	it('Given_Facts_When_Render_Then_AllInsideChip', () => {
		// Arrange
		// Act
		const out = html(Chip, { children: text('12 ngày') });
		// Assert
		expect(out).toContain('class="chip');
		expect(out).toContain('12 ngày');
	});

	it('Given_ChipSource_Then_FrostTokensAndDivider', () => {
		// Arrange
		const s = source('Chip.svelte');
		// Act
		const checks = [
			'--frost-tint',
			'--frost-blur',
			'--frost-rim',
			'--frost-shadow',
			'--frost-divider'
		].map((t) => s.includes(`var(${t}`));
		// Assert
		expect(checks).toEqual([true, true, true, true, true]);
		expect(s).toMatch(/height:\s*40px/);
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

	it('Given_SectionSource_Then_DividerAndPaddingFromDesign', () => {
		// Arrange
		const s = source('Section.svelte');
		// Act
		const checks = [
			s.includes('border-top: 1px solid var(--color-ruled-line)'),
			s.includes('padding-top: var(--spacing-s6)'),
			s.includes('margin-top: var(--spacing-s5)')
		];
		// Assert
		expect(checks).toEqual([true, true, true]);
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

	it('Given_OpenWithoutAction_When_Render_Then_NoButton', () => {
		// Arrange
		// Act
		const out = html(Toast, { open: true, message: 'Done' });
		// Assert
		expect(out).not.toContain('<button');
	});
});
