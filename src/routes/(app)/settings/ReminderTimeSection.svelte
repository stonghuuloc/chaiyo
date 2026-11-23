<script lang="ts" module>
	export type ReminderTimeDeps = {
		time: string;
		save(time: string): Promise<void>;
		notify(message: string): void;
	};
</script>

<script lang="ts">
	import { type Snippet, untrack } from 'svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { TIMES, pressed } from '#lib/welcome/welcome.js';
	import { serial } from './prefs';

	let { deps, children }: { deps: ReminderTimeDeps; children?: Snippet } = $props();

	const isPreset = (t: string) => TIMES.some(([p]) => p === t);
	const run = serial();

	let saved = untrack(() => deps.time);
	let shown = $state(saved);
	let custom = $state(false);
	let draft = $state(isPreset(saved) ? '' : saved);
	let inflight = 0;

	const other = $derived(custom || !isPreset(shown));
	const on = $derived(custom ? [] : pressed({ time: shown }));

	const write = async (t: string) => {
		shown = t;
		custom = false;
		draft = isPreset(t) ? '' : t;
		inflight++;
		try {
			await run(() => deps.save(t));
			saved = t;
		} catch {
			if (inflight === 1) {
				shown = saved;
				custom = false;
				draft = isPreset(saved) ? '' : saved;
			}
			deps.notify(m.welcome_save_error());
		} finally {
			inflight--;
		}
	};

	const tap = (t: string) => {
		if (t !== shown) return write(t);
		custom = false;
		draft = '';
	};

	const typing = (v: string) => {
		draft = v;
		custom = true;
	};

	const commit = (v: string) => {
		if (v === '') {
			custom = false;
			draft = isPreset(shown) ? '' : shown;
			return;
		}
		if (v === shown) {
			custom = false;
			draft = isPreset(v) ? '' : v;
			return;
		}
		return write(v);
	};
</script>

<section class="mt-6 border-t border-ruled-line pt-5">
	<h2 class="font-display text-[19px] leading-[1.25] font-semibold">{m.chy53s2_reminder()}</h2>
	<p class="mt-0.5 text-[14px] leading-[normal] text-pencil">{m.chy53s2_reminder_sub()}</p>
	<p class="mt-4 text-label leading-[normal] font-semibold text-pencil">{m.welcome_time_label()}</p>
	<div class="mt-2 grid grid-cols-3 gap-2" role="group" aria-label={m.welcome_time_label()}>
		{#each TIMES as [t, label] (t)}
			<button
				type="button"
				aria-pressed={on.includes(t)}
				class="grid h-16 content-center gap-0.5 rounded-cell border border-ruled-line bg-white/40 hover:not-aria-pressed:bg-white aria-pressed:border-2 aria-pressed:border-ink aria-pressed:bg-white"
				onclick={() => tap(t)}
			>
				<b class="font-display text-[19px] font-semibold tabular-nums">{t}</b>
				<small class="text-[12.5px] leading-[normal] text-pencil">{label}</small>
			</button>
		{/each}
	</div>
	<label
		class={other
			? 'mt-2 flex min-h-12 items-center gap-3 rounded-cell border-2 border-ink bg-white px-[15px]'
			: 'mt-2 flex min-h-12 items-center gap-3 rounded-cell border border-ruled-line bg-white/40 px-4'}
	>
		<span class="flex-1 text-[15px] leading-[normal] text-graphite">{m.welcome_time_other()}</span>
		<input
			type="time"
			aria-label={m.chy53s2_other_aria()}
			value={draft}
			oninput={(e) => typing(e.currentTarget.value)}
			onchange={(e) => commit(e.currentTarget.value)}
			class="min-h-11 bg-transparent font-sans text-[17px] font-semibold text-ink outline-none [&::-webkit-calendar-picker-indicator]:hidden"
		/>
	</label>
	{@render children?.()}
</section>
