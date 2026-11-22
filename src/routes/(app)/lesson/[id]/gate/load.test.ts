import { isRedirect } from '@sveltejs/kit';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => ({
	state: undefined as unknown,
	fail: false
}));
vi.mock('#lib/learner/index.js', () => ({
	learnerLedger: async () => {
		if (hoisted.fail) throw new Error('idb blocked');
		return { state: () => hoisted.state };
	}
}));
vi.mock('$app/paths', () => ({
	resolve: (_: string, p: { id: string }) => `/lesson/${p.id}`
}));

const { load } = await import('./+page');

const sections = CURRICULUM.lessons.find((l) => l.id === 'h1-01')!.sections;
const withDone = (done: string[]): State => {
	const s = initialState({ curriculum: CURRICULUM });
	s.lessons['h1-01'] = { unlocked: true, passed: false, done };
	return s;
};
const run = (session: { user: { id: string } } | null) =>
	load({ parent: async () => ({ session }), params: { id: 'h1-01' } } as never);
const session = { user: { id: 'u1' } };

beforeEach(() => {
	hoisted.state = initialState({ curriculum: CURRICULUM });
	hoisted.fail = false;
});

describe('gate load', () => {
	it('Given_LockedLearner_When_LoadGate_Then_Redirect307ToHub', async () => {
		// Arrange
		hoisted.state = withDone(sections.slice(0, 4));

		// Act
		const e = await Promise.resolve(run(session)).catch((err: unknown) => err);

		// Assert
		expect(isRedirect(e)).toBe(true);
		expect(e).toMatchObject({ status: 307, location: '/lesson/h1-01' });
	});

	it('Given_AllSectionsDone_When_LoadGate_Then_ShellFocus', async () => {
		// Arrange
		hoisted.state = withDone([...sections]);

		// Act
		const data = await run(session);

		// Assert
		expect(data).toEqual({ shell: { template: 'focus' } });
	});

	it('Given_NoSession_When_LoadGate_Then_ShellFocus', async () => {
		// Arrange
		hoisted.state = withDone([]);

		// Act
		const data = await run(null);

		// Assert
		expect(data).toEqual({ shell: { template: 'focus' } });
	});

	it('Given_LedgerRejects_When_LoadGate_Then_ShellFocus', async () => {
		// Arrange
		hoisted.fail = true;

		// Act
		const data = await run(session);

		// Assert
		expect(data).toEqual({ shell: { template: 'focus' } });
	});
});
