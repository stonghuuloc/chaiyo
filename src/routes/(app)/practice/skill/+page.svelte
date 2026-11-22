<script lang="ts">
	import SkillEntry from './SkillEntry.svelte';

	let { data } = $props();
</script>

<SkillEntry k={data.k} />
