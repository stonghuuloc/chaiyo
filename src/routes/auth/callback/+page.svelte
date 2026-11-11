<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { callbackOutcome, landing } from '#lib/auth/login.js';
	import { m } from '#lib/paraglide/messages.js';
	import { supabase } from '#lib/supabase.js';

	onMount(async () => {
		const outcome = callbackOutcome(window.location.href);
		if (outcome === 'error') return goto(resolve('/login'), { replace: true });
		const { data } = await supabase.auth.getSession();
		if (!data.session) return goto(resolve('/login'), { replace: true });
		const { data: row, error } = await supabase
			.from('settings')
			.select('onboarded_at')
			.eq('learner_id', data.session.user.id)
			.maybeSingle();
		if (error) return goto(resolve('/(app)/(tabs)/today'), { replace: true });
		return goto(resolve(landing(row)), { replace: true });
	});
</script>

<p class="p-6 text-muted">{m.login_signing_in()}</p>
