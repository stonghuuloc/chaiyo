<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div
	class="pb-[calc(66px+14px+env(safe-area-inset-bottom,0px))] lg:pb-16 xl:has-[>.aside]:grid xl:has-[>.aside]:grid-cols-[minmax(0,var(--container-main))_var(--container-aside)] xl:has-[>.aside]:items-start xl:has-[>.aside]:gap-x-12 xl:[&>.span]:col-span-full"
>
	{@render children()}
</div>
