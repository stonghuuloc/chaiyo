<script lang="ts">
	import { asset } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>Chaiyo!</title>
</svelte:head>

<main class="mx-auto grid max-w-[420px] justify-items-center gap-4 px-6 py-16 text-center">
	<img src={asset('brand/logo.png')} alt="Chaiyo!" width="200" height="200" />
	<h1 class="font-display text-display">{m.landing_title()}</h1>
	<p class="text-graphite">{m.landing_lede()}</p>
</main>
