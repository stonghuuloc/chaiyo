import type { Shell } from '#lib/shell/template.js';

export const load = () => ({ shell: { template: 'pushed', section: 'me' } satisfies Shell });
