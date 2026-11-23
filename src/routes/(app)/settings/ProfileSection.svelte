<script lang="ts" module>
	import type { Profile } from './profile';

	export type ProfileDeps = {
		profile: Profile;
		email: string;
		save(patch: Partial<Profile>): Promise<void>;
		decode(file: File): Promise<string>;
		notify(message: string): void;
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { initials, photoPicker } from '#lib/welcome/welcome.js';
	import { leaveName } from './profile';

	let { deps }: { deps: ProfileDeps } = $props();

	let saved = $state(untrack(() => deps.profile.name));
	let name = $state(untrack(() => deps.profile.name));
	let photo = $state(untrack(() => deps.profile.photo));
	let input = $state<HTMLInputElement>();
	const picker = photoPicker((file) => deps.decode(file));

	const rename = async () => {
		const left = leaveName(saved, name);
		name = left.value;
		if (!left.write) return;
		try {
			await deps.save({ name: left.value });
			saved = left.value;
		} catch {
			name = saved;
			deps.notify(m.welcome_save_error());
		}
	};

	const setPhoto = async (next: string | null) => {
		try {
			await deps.save({ photo: next });
			photo = next;
			if (next) deps.notify(m.chy53s1_photo_ok());
		} catch {
			deps.notify(m.welcome_save_error());
		}
	};

	const choose = (e: Event & { currentTarget: HTMLInputElement }) => {
		const file = e.currentTarget.files?.[0];
		e.currentTarget.value = '';
		if (!file) return;
		void picker.pick(file, setPhoto, () => deps.notify(m.welcome_photo_error()));
	};
</script>

<section class="mt-2">
	<h2 class="font-display text-[19px] leading-[1.25] font-semibold">{m.chy53s1_profile()}</h2>
	<p class="mt-0.5 text-[14px] text-pencil">{m.chy53s1_profile_sub()}</p>
	<div class="mt-4 grid grid-cols-[88px_minmax(0,1fr)] items-center gap-4">
		<div class="relative size-22">
			{#if photo}
				<img
					src={photo}
					alt=""
					referrerpolicy="no-referrer"
					class="size-full rounded-full object-cover"
				/>
			{:else}
				<span
					data-avatar
					class="grid size-full place-items-center rounded-full bg-lantern-red-wash font-display text-[32px] font-semibold text-lantern-red-text"
					>{initials(name)}</span
				>
			{/if}
			<button
				type="button"
				class="absolute -right-1 -bottom-1 grid size-11 place-items-center rounded-full border-[3px] border-notebook-paper bg-ink text-notebook-paper"
				aria-label={m.welcome_photo_change()}
				onclick={() => input?.click()}
			>
				<svg class="size-5 fill-current" aria-hidden="true"><use href="#i-fill-camera" /></svg>
			</button>
			<input
				bind:this={input}
				type="file"
				accept="image/*"
				class="hidden"
				tabindex="-1"
				onchange={choose}
			/>
		</div>
		<label class="grid gap-1.5">
			<span class="text-label font-semibold text-pencil">{m.welcome_name_label()}</span>
			<input
				type="text"
				autocomplete="name"
				maxlength="30"
				bind:value={name}
				onchange={rename}
				class="h-12 w-full rounded-cell border border-ruled-line bg-white/60 px-4 text-[16px] font-medium text-ink outline-0 focus:border-ink"
			/>
			<small class="text-[12.5px] text-pencil">{deps.email}</small>
		</label>
	</div>
	{#if photo}
		<button
			type="button"
			class="mt-2 min-h-11 text-[14px] font-semibold text-pencil"
			onclick={() => setPhoto(null)}>{m.chy53s1_photo_remove()}</button
		>
	{/if}
</section>
