<script lang="ts">
	import { resolve } from '$app/paths';
	import { forget } from './forget';

	let dropped = $state<number>();

	async function reset() {
		dropped = await forget(caches);
	}
</script>

<h1>Offline lesson harness</h1>
<ul>
	<li><a href={resolve('/dev/lesson/[id]', { id: 'h1-01' })}>h1-01</a></li>
	<li><a href={resolve('/dev/lesson/[id]', { id: 'h0-00' })}>h0-00</a></li>
</ul>
<button type="button" data-part="reset" onclick={reset}>Forget cached lessons</button>
{#if dropped !== undefined}<p data-part="dropped">dropped {dropped}</p>{/if}
