import { describe, expect, it } from 'vitest';
import { navFor } from './template.js';

describe('navFor', () => {
	it.each([
		['/today', 0],
		['/roadmap', 1],
		['/practice', 2],
		['/me', 3]
	])('Given_TabRoot_When_%s_Then_TabBarWithTab%i', (path, active) => {
		// Arrange
		// Act
		const nav = navFor({ template: 'tab-root' }, path);
		// Assert
		expect(nav).toEqual({ mode: 'tab-bar', active });
	});

	it.each([
		['practice', 2],
		['me', 3],
		['roadmap', 1]
	] as const)('Given_PushedScreenOf_%s_Then_SidebarOnlyWithThatTabActive', (section, active) => {
		// Arrange
		// Act
		const nav = navFor({ template: 'pushed', section }, '/word/x');
		// Assert
		expect(nav).toEqual({ mode: 'sidebar', active });
	});

	it('Given_PushedScreenWithoutSection_Then_SidebarWithNoActiveTab', () => {
		// Arrange
		// Act
		const nav = navFor({ template: 'pushed' }, '/word/x');
		// Assert
		expect(nav).toEqual({ mode: 'sidebar', active: null });
	});

	it.each(['focus', 'public'] as const)('Given_%sTemplate_Then_NoNav', (template) => {
		// Arrange
		// Act
		const nav = navFor({ template }, '/practice/session');
		// Assert
		expect(nav).toBeNull();
	});

	it('Given_RouteWithNoShell_Then_NoNav', () => {
		// Arrange
		// Act
		const nav = navFor(undefined, '/today');
		// Assert
		expect(nav).toBeNull();
	});
});
