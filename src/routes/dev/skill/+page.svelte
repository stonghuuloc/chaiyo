<script lang="ts">
	import SkillEntry from '../../(app)/practice/skill/SkillEntry.svelte';
	import { SKILL_KEYS } from '../../(app)/practice/skill/skills';
</script>

<div class="flex flex-col gap-12 p-4">
	{#each SKILL_KEYS as k (k)}
		<section data-k={k}>
			<SkillEntry {k} />
		</section>
	{/each}
	{#each [1, 2, 3] as level (level)}
		<section data-doan-level={level}>
			<SkillEntry k="doan" {level} />
		</section>
	{/each}
</div>
