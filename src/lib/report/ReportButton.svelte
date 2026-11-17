<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { report } from '#lib/report/index.js';
	import type { Category, ReportContext } from '#lib/report/types.js';
	import Button from '#lib/ui/Button.svelte';
	import Sheet from '#lib/ui/Sheet.svelte';
	import Toast from '#lib/ui/Toast.svelte';

	type Props = {
		context: ReportContext;
		send?: (context: ReportContext, category: Category, note: string) => Promise<void>;
	};
	let { context, send = report }: Props = $props();

	const CHIPS: { code: Category; label: () => string }[] = [
		{ code: 'meaning', label: m.report_meaning },
		{ code: 'pinyin', label: m.report_pinyin },
		{ code: 'hanviet', label: m.report_hanviet },
		{ code: 'audio', label: m.report_audio },
		{ code: 'other', label: m.report_other }
	];

	let open = $state(false);
	let category = $state<Category | null>(null);
	let note = $state('');
	let sent = $state(false);
	let sending = $state(false);

	function close() {
		open = false;
		category = null;
		note = '';
	}

	async function submit() {
		if (!category || sending) return;
		sending = true;
		try {
			await send(context, category, note);
		} catch (e) {
			console.error(e);
			return;
		} finally {
			sending = false;
		}
		close();
		sent = true;
	}
</script>

<button
	type="button"
	class="grid size-11 place-items-center rounded-full"
	aria-label={m.report_open()}
	onclick={() => (open = true)}
>
	<svg class="size-[22px] fill-current" aria-hidden="true"><use href="#i-fill-flag" /></svg>
</button>

<Sheet {open} title={m.report_title()} onclose={close}>
	<div class="mt-4 flex flex-col gap-4">
		<div class="flex flex-wrap gap-2" role="group" aria-label={m.report_group()}>
			{#each CHIPS as chip (chip.code)}
				<button
					type="button"
					class="min-h-11 rounded-pill border px-4 text-title {category === chip.code
						? 'border-lantern-red bg-lantern-red text-white'
						: 'border-ruled-line bg-white/50 text-ink'}"
					aria-pressed={category === chip.code}
					onclick={() => (category = chip.code)}
				>
					{chip.label()}
				</button>
			{/each}
		</div>
		<textarea
			bind:value={note}
			maxlength="1000"
			rows="3"
			placeholder={m.report_note()}
			aria-label={m.report_note()}
			class="w-full rounded-action border border-ruled-line bg-white/50 p-3 text-title text-ink"
		></textarea>
		<Button disabled={!category || sending} onclick={submit}>{m.report_send()}</Button>
		<button type="button" class="min-h-11 rounded-pill text-title text-graphite" onclick={close}>
			{m.report_cancel()}
		</button>
	</div>
</Sheet>

<Toast open={sent} message={m.report_sent()} onclose={() => (sent = false)} />
