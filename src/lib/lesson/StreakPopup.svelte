<script lang="ts">
	import { untrack } from 'svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { StudyEvent } from '#lib/study/index.js';
	import Button from '#lib/ui/Button.svelte';
	import Dialog from '#lib/ui/Dialog.svelte';
	import { dayCounted } from './done';

	type Props = { events: StudyEvent[] };
	let { events }: Props = $props();

	const n = $derived(dayCounted(events));
	let open = $state(untrack(() => dayCounted(events) !== null));
</script>

<Dialog
	open={open && n !== null}
	title={m.done_streak({ n: n ?? 0 })}
	onclose={() => (open = false)}
>
	<div class="mt-4">
		<Button onclick={() => (open = false)}>{m.done_streak_ok()}</Button>
	</div>
</Dialog>
