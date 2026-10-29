<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div class="pb-[calc(66px+14px+env(safe-area-inset-bottom,0px))]">
	{@render children()}
</div>
