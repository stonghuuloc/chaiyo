<script lang="ts">
	import Button from '#lib/ui/Button.svelte';

	type Props = { title: string; text?: string; next: { label: string; href: string } };
	let { title, text, next }: Props = $props();
</script>

<section class="mx-auto mt-10 flex max-w-dialog flex-col items-center gap-3 text-center">
	<h1 data-part="done-title" class="font-display text-headline">{title}</h1>
	{#if text}
		<p data-part="done-text" class="text-graphite">{text}</p>
	{/if}
	<div data-part="done-next" class="mt-4 w-full">
		<Button href={next.href} caret>{next.label}</Button>
	</div>
</section>
