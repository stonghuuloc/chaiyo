import { describe, expect, it } from 'vitest';
import { load } from './+page';

const run = (search: string) =>
	(load as unknown as (e: { url: URL }) => { skill: string | null; shell: unknown })({
		url: new URL(`http://localhost/practice/session${search}`)
	});

describe('practice session load', () => {
	it('Given_SkillNghe_When_Load_Then_FocusAndNghe', () => {
		// Arrange
		// Act
		const data = run('?skill=nghe');
		// Assert
		expect(data.skill).toBe('nghe');
		expect(data.shell).toEqual({ template: 'focus' });
	});

	it.each(['', '?skill=xyz'])('Given_NoOrUnknownSkill_%s_When_Load_Then_Null', (search) => {
		// Arrange
		// Act
		const data = run(search);
		// Assert
		expect(data.skill).toBeNull();
	});

	it('Given_RepeatedSkill_When_Load_Then_First', () => {
		// Arrange
		// Act
		const data = run('?skill=viet&skill=the');
		// Assert
		expect(data.skill).toBe('viet');
	});
});
