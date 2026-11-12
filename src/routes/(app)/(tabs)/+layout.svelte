<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div class="page-split pb-[calc(66px+14px+env(safe-area-inset-bottom,0px))] lg:pb-16">
	{@render children()}
</div>
