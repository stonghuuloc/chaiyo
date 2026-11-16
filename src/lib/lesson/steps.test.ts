import { describe, expect, it } from 'vitest';
import Choice from './steps/Choice.svelte';
import { viewOf } from './steps';

const files = import.meta.glob<{ kind: string }>('./steps/*.svelte', { eager: true });

describe('step views', () => {
	it('Given_EveryStepFile_When_Loaded_Then_KindMatchesFileName', () => {
		// Arrange
		const entries = Object.entries(files);
		// Act
		const kinds = entries.map(([path, mod]) => [
			path.split('/').pop()!.replace('.svelte', '').toLowerCase(),
			mod.kind
		]);
		// Assert
		expect(entries.length).toBeGreaterThan(0);
		kinds.forEach(([stem, kind]) => expect(kind).toBe(stem));
	});

	it('Given_ChoiceKind_When_ViewOf_Then_ReturnsChoice', () => {
		expect(viewOf('choice').default).toBe(Choice);
	});

	it('Given_UnknownKind_When_ViewOf_Then_Throws', () => {
		expect(() => viewOf('nope' as never)).toThrow('unknown step kind');
	});
});
