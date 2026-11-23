import { describe, expect, it } from 'vitest';
import { navFor } from '#lib/shell/template.js';
import { load } from './+page.js';

describe('badges route', () => {
	it('load declares the pushed shell in section me', () => {
		// Arrange
		const expected = { shell: { template: 'pushed', section: 'me' } };

		// Act
		const data = load();

		// Assert
		expect(data).toEqual(expected);
		expect(navFor(data.shell, '/me/badges')).toEqual({ mode: 'sidebar', active: 3 });
	});
});
