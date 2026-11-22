import { describe, expect, it } from 'vitest';
import { load } from './+page';

describe('load', () => {
	it('returns the pushed practice shell', () => {
		// Arrange / Act
		const data = load();

		// Assert
		expect(data).toEqual({ shell: { template: 'pushed', section: 'practice' } });
	});
});
