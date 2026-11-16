<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { page } from '$app/state';
	import { sections } from './sections';

	const View = $derived(sections[page.params.section ?? '']);
</script>

{#if View}
	<View lesson={data.lesson} session={data.session} />
{:else}
	<h1>{m.screen_lesson_section()}</h1>
{/if}
