<script lang="ts" module>
	import type { Profile } from './profile';

	export type PrivacyDeps = {
		hidden: boolean;
		save(patch: Partial<Profile>): Promise<void>;
		notify(message: string): void;
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { m } from '#lib/paraglide/messages.js';
	import Switch from '#lib/ui/Switch.svelte';

	let { deps }: { deps: PrivacyDeps } = $props();

	let hidden = $state(untrack(() => deps.hidden));
	let pending = false;

	const flip = async () => {
		if (pending) return;
		pending = true;
		const next = !hidden;
		hidden = next;
		try {
			await deps.save({ hidden: next });
			deps.notify(next ? m.chy53s1_hidden_on() : m.chy53s1_hidden_off());
		} catch {
			hidden = !next;
			deps.notify(m.welcome_save_error());
		} finally {
			pending = false;
		}
	};
</script>

<section class="mt-6 border-t border-ruled-line pt-5">
	<h2 class="font-display text-[19px] leading-[1.25] font-semibold">{m.chy53s1_privacy()}</h2>
	<ul class="mt-2 overflow-hidden rounded-[18px] border border-ruled-line bg-white/55">
		<li class="grid min-h-16 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2">
			<span class="grid size-10 place-items-center rounded-cell bg-shaded-paper text-ink">
				<svg class="size-[22px] fill-current" aria-hidden="true"
					><use href="#i-regular-eye-slash" /></svg
				>
			</span>
			<span class="min-w-0">
				<b class="block text-[16px] leading-[normal] font-semibold">{m.chy53s1_hide()}</b>
				<small class="mt-px block text-[13px] leading-[normal] text-pencil">{m.chy53s1_hide_hint()}</small>
			</span>
			<Switch checked={hidden} label={m.chy53s1_hide()} onchange={flip} />
		</li>
	</ul>
</section>
