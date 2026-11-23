import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/env/public', () => ({ PUBLIC_ADMIN_EMAILS: undefined }));

const { isAdmin } = await import('./admin');

describe('isAdmin', () => {
	it('Given_EmailInList_When_IsAdmin_Then_True', () => {
		expect(isAdmin('learner@example.com', 'a@example.com, Learner@Example.com')).toBe(true);
	});

	it('Given_EmailNotInList_When_IsAdmin_Then_False', () => {
		expect(isAdmin('b@example.com', 'a@example.com, Learner@Example.com')).toBe(false);
	});

	it('Given_UnsetList_When_IsAdmin_Then_False', () => {
		expect(isAdmin('a@example.com')).toBe(false);
		expect(isAdmin('a@example.com', undefined)).toBe(false);
	});

	it('Given_NoEmail_When_IsAdmin_Then_False', () => {
		expect(isAdmin(undefined, 'a@example.com')).toBe(false);
	});

	it('Given_EmptyEntries_When_IsAdmin_Then_EmptyEmailFalse', () => {
		expect(isAdmin('', 'a@example.com,,')).toBe(false);
	});
});
