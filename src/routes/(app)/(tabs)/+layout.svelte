<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div
	class="page-split pt-[calc(env(safe-area-inset-top,0px)+54px)] pb-[calc(env(safe-area-inset-bottom,0px)+120px)] lg:pt-10 lg:pb-16"
>
	{@render children()}
</div>
