<script lang="ts">
	import TabBar from '#lib/shell/TabBar.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

{@render children()}
<TabBar />
