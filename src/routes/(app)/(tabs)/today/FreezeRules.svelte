<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Button from '#lib/ui/Button.svelte';
	import Sheet from '#lib/ui/Sheet.svelte';
	import type { FreezeRulesView } from './rules';

	let { open, view, onclose }: { open: boolean; view: FreezeRulesView; onclose: () => void } =
		$props();
</script>

<Sheet {open} title={m.chy46s3_title()} {onclose}>
	<p class="mt-3 text-body text-graphite">{m.chy46s3_intro()}</p>
	<div data-part="freeze-have" class="mt-4 flex items-center gap-3 rounded-[14px] bg-white p-3">
		<span class="flex gap-1">
			{#each { length: view.max }, i (i)}
				<svg
					data-part="freeze-slot"
					data-held={i < view.held ? '' : undefined}
					class="size-7 fill-current {i < view.held ? 'text-freeze-blue' : 'text-muted'}"
					aria-hidden="true"><use href="#i-fill-snowflake" /></svg
				>
			{/each}
		</span>
		<span class="grid">
			<b class="text-body text-text">{view.have}</b>
			<small class="text-label text-muted">{view.sub}</small>
		</span>
	</div>
	<ol class="mt-4 grid gap-3">
		{#each view.rules as r, i (i)}
			<li data-part="freeze-rule" class="flex gap-3 text-body text-graphite">
				<span
					class="grid size-6 shrink-0 place-items-center rounded-full bg-white text-label text-text"
					>{i + 1}</span
				>
				<span><b class="text-text">{r.title}</b> {r.text}</span>
			</li>
		{/each}
	</ol>
	<div class="mt-5">
		<Button onclick={onclose}>{m.chy46s3_ok()}</Button>
	</div>
</Sheet>
