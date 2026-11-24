<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { afterSignIn, hrefFor } from '#lib/auth/after-sign-in.js';
	import { callbackOutcome } from '#lib/auth/login.js';
	import { m } from '#lib/paraglide/messages.js';
	import { supabase } from '#lib/supabase.js';

	onMount(async () => {
		const outcome = callbackOutcome(window.location.href);
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve()d path plus a query
		if (outcome === 'expired') return goto(resolve('/login') + '?s=expired', { replace: true });
		if (outcome === 'error') return goto(resolve('/login'), { replace: true });
		const { data } = await supabase.auth.getSession();
		if (!data.session) return goto(resolve('/login'), { replace: true });
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- hrefFor resolve()s
		return goto(hrefFor(await afterSignIn(data.session, Date.now()), localStorage), {
			replace: true
		});
	});
</script>

<p class="p-6 text-muted">{m.login_signing_in()}</p>
