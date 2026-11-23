<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { ExamRow } from './roadmap';

	let {
		exams,
		ontap
	}: { exams: { rows: ExamRow[]; note: boolean }; ontap: (row: ExamRow) => void } = $props();

	const title = (row: ExamRow) =>
		row.part
			? m.chy49s2_mock_part({
					level: row.level,
					part: row.part === 'noi' ? m.chy49s2_part_noi() : m.chy49s2_part_viet()
				})
			: m.chy49s2_mock({ level: row.level });

	const sub = (row: ExamRow) => {
		const base = row.part === 'noi' ? m.chy49s2_sub_noi() : m.chy49s2_sub_viet();
		return row.status === 'open' ? base : m.chy49s2_mock_after({ sub: base, last: row.last });
	};
</script>

<details data-part="exams" class="group border-b border-ruled-line">
	<summary
		class="grid min-h-[54px] cursor-pointer list-none grid-cols-[1fr_auto_18px] items-center gap-2 text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden"
	>
		<span data-part="topic-title">{m.chy49s2_exams()}</span>
		<span data-part="topic-count" class="text-label font-medium text-faint-pencil tabular-nums">
			{m.chy49s1_count({ passed: 0, total: exams.rows.length })}
		</span>
		<svg
			class="size-4 fill-current text-faint-pencil transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
			aria-hidden="true"><use href="#i-regular-caret-down" /></svg
		>
	</summary>
	<ol class="relative list-none pb-3">
		{#each exams.rows as row (row.part ?? 'mock')}
			<li
				data-part="exam-row"
				data-status={row.status}
				class="relative before:absolute before:inset-y-0 before:left-[17px] before:w-0.5 before:bg-ruled-line first:before:top-1/2 last:before:bottom-1/2"
			>
				<button
					type="button"
					class="grid min-h-[60px] w-full cursor-pointer grid-cols-[36px_1fr_16px] items-center gap-3 py-2 text-left"
					onclick={() => ontap(row)}
				>
					<span
						class="relative z-1 grid size-9 place-items-center rounded-[10px] bg-shaded-paper text-muted"
					>
						<svg class="size-[19px] fill-current" aria-hidden="true"
							><use href="#i-regular-{row.part === 'noi' ? 'microphone' : 'diploma'}" /></svg
						>
					</span>
					<span>
						<b data-part="exam-title" class="block font-serif text-title text-graphite"
							>{title(row)}</b
						>
						<small data-part="exam-note" class="mt-0.5 block text-label text-muted"
							>{sub(row)}</small
						>
					</span>
					<svg class="size-4 fill-current text-faint-pencil" aria-hidden="true"
						><use href="#i-regular-caret-right" /></svg
					>
				</button>
			</li>
		{/each}
		{#if exams.note}
			<li data-part="exam-end" class="pt-1 pl-12 text-[13px] leading-[normal] text-muted">
				{m.chy49s2_exam_note()}
			</li>
		{/if}
	</ol>
</details>
