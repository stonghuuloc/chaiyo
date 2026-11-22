<script module lang="ts">
	export const animated: string[] = [];
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	let { char, onprogress }: { char: string; onprogress?: () => void } = $props();

	onMount(() => onprogress?.());

	export async function play() {
		animated.push(char);
	}
</script>

<i data-part="fake-strokes">{char}</i>
