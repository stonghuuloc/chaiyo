<script lang="ts">
	import { learnerLedger } from '#lib/learner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { badgesView, type State } from '#lib/study/index.js';
	import { supabase } from '#lib/supabase.js';
	import { fromUser } from '#lib/welcome/welcome.js';
	import type { PageProps } from './$types';
	import { loadProfile, type Profile } from '../../settings/profile';
	import MeBadges from './MeBadges.svelte';
	import MeHero from './MeHero.svelte';
	import MeMenu from './MeMenu.svelte';
	import MeProfile from './MeProfile.svelte';
	import SkillMemory from './SkillMemory.svelte';
	import { isAdmin } from './admin';
	import { joinedMonth, meLevel } from './level';
	import { meStats } from './me';

	let { data }: PageProps = $props();

	let study = $state<State | null>(null);
	let profile = $state<Profile | null>(null);

	const who = $derived.by(() => {
		const user = data.session?.user;
		const meta = fromUser(user);
		return {
			name: profile?.name || meta.name || (user?.email ?? '').split('@')[0],
			photo: profile?.photo ?? meta.photo
		};
	});

	$effect(() => {
		const session = data.session;
		study = null;
		profile = null;
		if (!session) return;
		let live = true;
		let off = () => {};
		loadProfile(supabase, session.user.id)
			.then((p) => live && (profile = p))
			.catch(() => {});
		learnerLedger(session)
			.then((ledger) => {
				if (!live) return;
				study = ledger.state();
				off = ledger.subscribe((next) => (study = next));
			})
			.catch(() => {});
		return () => {
			live = false;
			off();
		};
	});
</script>

{#if study && data.session}
	{@const s = meStats(study, new Date())}
	<MeProfile {...who} {...joinedMonth(data.session.user.created_at, study.tz)} />
	<MeHero stats={s} lv={meLevel(study)} />
	<SkillMemory skills={s.skills} />
	<MeBadges view={badgesView(study)} />
	<MeMenu admin={isAdmin(data.session.user.email)} />
{:else}
	<h1 class="sr-only">{m.tab_me()}</h1>
{/if}
