import { describe, expect, it } from 'vitest';
import { load } from './+page';

const run = (search: string) =>
	(load as unknown as (e: { url: URL }) => { k: string; shell: unknown; lv?: number })({
		url: new URL(`http://localhost/practice/skill${search}`)
	});

describe('practice skill load', () => {
	it('Given_KDoan_When_Load_Then_PushedPracticeAndDoan', () => {
		// Arrange
		// Act
		const data = run('?k=doan');
		// Assert
		expect(data.k).toBe('doan');
		expect(data.shell).toEqual({ template: 'pushed', section: 'practice' });
	});

	it.each(['', '?k=zzz'])('Given_NoKOrUnknownK_%s_When_Load_Then_Noi', (search) => {
		// Arrange
		// Act
		const data = run(search);
		// Assert
		expect(data.k).toBe('noi');
	});

	it('Given_LvAndM_When_Load_Then_KUnchanged', () => {
		// Arrange
		// Act
		const data = run('?k=thi&lv=3&m=noi');
		// Assert
		expect(data.k).toBe('thi');
		expect(data.lv).toBe(3);
	});

	it('Given_LvOutOfRange_When_Load_Then_LvUndefined', () => {
		// Arrange
		// Act
		const data = run('?k=thi&lv=9');
		// Assert
		expect(data.lv).toBeUndefined();
	});

	it('Given_NoLv_When_Load_Then_LvUndefined', () => {
		// Arrange
		// Act
		const data = run('?k=thi');
		// Assert
		expect(data.lv).toBeUndefined();
	});
});
