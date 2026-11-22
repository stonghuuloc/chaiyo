<script module lang="ts">
	export type StrokeProps = {
		char: string;
		mode: string;
		outline: boolean;
		oncomplete?: (p: { mistakes: number }) => void;
		onprogress?: (p: { done: number; total: number; mistakes: number }) => void;
	};
	export const mounted: StrokeProps[] = [];
</script>

<script lang="ts">
	import { untrack } from 'svelte';

	let { char, mode, outline = true, oncomplete, onprogress }: StrokeProps = $props();

	untrack(() => mounted.push({ char, mode, outline, oncomplete, onprogress }));
</script>

<i data-part="fake-strokes">{char}</i>
