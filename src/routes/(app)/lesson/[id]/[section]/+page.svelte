<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import { sections } from './sections';

	let { data }: PageProps = $props();
	const id = $derived(page.params.section ?? '');
	const View = $derived(Object.hasOwn(sections, id) ? sections[id] : undefined);
</script>

{#if View}
	<View lesson={data.lesson} session={data.session} />
{:else}
	<h1 class="text-title">{m.screen_lesson_section()}</h1>
{/if}
