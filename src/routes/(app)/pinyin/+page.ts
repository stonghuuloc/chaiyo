import type { Shell } from '#lib/shell/template.js';

export const load = ({ url }: { url: URL }) => ({
	shell: { template: 'pushed', section: 'roadmap' } satisfies Shell,
	open: url.searchParams.get('open')
});
