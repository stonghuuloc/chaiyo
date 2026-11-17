import { describe, expect, it } from 'vitest';
import Choice from './steps/Choice.svelte';
import { viewOf } from './steps';

const files = import.meta.glob<{ kind: string }>('./steps/*.svelte', { eager: true });

const sources = import.meta.glob<string>('./steps/*.svelte', {
	query: '?raw',
	import: 'default',
	eager: true
});

describe('step views', () => {
	it('Given_EveryStepView_When_ReadSource_Then_NoLedgerAndTypeOnlyStudy', () => {
		// Arrange
		const entries = Object.entries(sources);

		// Act
		const withLedger = entries.filter(([, src]) => src.includes('#lib/ledger'));
		const study = entries.flatMap(([, src]) =>
			src
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => line.includes('#lib/study'))
		);

		// Assert
		expect(entries.length).toBeGreaterThan(0);
		expect(withLedger).toEqual([]);
		study.forEach((line) => expect(line.startsWith('import type')).toBe(true));
	});

	it('Given_EveryStepFile_When_Loaded_Then_KindMatchesFileName', () => {
		// Arrange
		const entries = Object.entries(files);
		// Act
		const kinds = entries.map(([path, mod]) => [
			path
				.slice(path.lastIndexOf('/') + 1)
				.replace('.svelte', '')
				.toLowerCase(),
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
		// @ts-expect-error unknown kind on purpose
		expect(() => viewOf('nope')).toThrow('unknown step kind');
	});
});
