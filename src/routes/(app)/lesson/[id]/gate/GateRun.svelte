<script lang="ts">
	import type { Ledger } from '#lib/ledger/index.js';
	import StepRunner from '#lib/lesson/StepRunner.svelte';
	import type { LessonStep } from '#lib/lesson/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { resolve } from '$app/paths';
	import type { GateHandoff } from './handoff';

	type Props = {
		lesson: string;
		contentSha: string;
		steps: LessonStep[];
		ledger: Ledger;
		ondone?: (h: GateHandoff) => void;
	};
	let { lesson, contentSha, steps, ledger, ondone }: Props = $props();

	const hub = $derived(resolve('/(app)/lesson/[id]', { id: lesson }));
</script>

<StepRunner
	{steps}
	{ledger}
	{lesson}
	{contentSha}
	mode="test"
	section="gate"
	fresh
	note={m.gate_hint()}
	confirmExit={{
		label: m.gate_exit_label(),
		title: m.gate_exit_title(),
		body: m.gate_exit_body(),
		leave: m.gate_exit_leave(),
		keep: m.gate_exit_keep()
	}}
	exit={hub}
	onfinish={(events, answers) =>
		ondone?.({
			lesson,
			steps,
			answers,
			events,
			best: ledger.state().lessons[lesson]?.best ?? 0
		})}
/>
