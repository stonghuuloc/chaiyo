<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

{#if page.status === 503}
	<section data-part="lesson-offline">
		<h1 class="text-headline">{m.lesson_offline()}</h1>
		<p>{m.lesson_offline_hint()}</p>
		<a href={resolve('/(app)/(tabs)/today')}>{m.lesson_offline_home()}</a>
	</section>
{:else}
	<h1 class="text-headline">{page.status}</h1>
	<p>{page.error?.message}</p>
{/if}
