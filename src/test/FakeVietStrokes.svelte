<script module lang="ts">
	export type VietStrokeProps = {
		char: string;
		mode: string;
		outline: boolean;
		oncomplete?: (p: { mistakes: number }) => void;
		onpeek?: () => void;
		onerror?: () => void;
	};
	export const mounted: VietStrokeProps[] = [];
</script>

<script lang="ts">
	import { untrack } from 'svelte';

	let { char, mode, outline = true, oncomplete, onpeek, onerror }: VietStrokeProps = $props();

	untrack(() => mounted.push({ char, mode, outline, oncomplete, onpeek, onerror }));
</script>

<i data-part="fake-strokes">{char}</i>
