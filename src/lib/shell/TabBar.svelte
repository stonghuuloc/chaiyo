<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { TABS, tabFor } from './tabs';

	const active = $derived(tabFor(page.url.pathname));
</script>

<nav class="tabs" aria-label={m.tabs_label()}>
	{#each TABS as tab, i (tab.path)}
		<a class="tab" href={resolve(tab.route)} aria-current={i === active ? 'page' : undefined}
			>{tab.label()}</a
		>
	{/each}
</nav>
