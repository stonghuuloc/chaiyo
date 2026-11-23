<script lang="ts">
	import { getLookup } from './context';
	import { tapLookup } from './tap-lookup';

	let { sentenceId, hanzi }: { sentenceId: string; hanzi: string } = $props();
	const lookup = getLookup();

	let node = $state<HTMLElement>();
	const chars = $derived([...hanzi].map((c, i) => ({ c, i, han: /\p{Script=Han}/u.test(c) })));
	const hit = $derived(lookup?.hit()?.sentenceId === sentenceId ? lookup.hit() : null);
	const on = (i: number) => !!hit && i >= hit.start && i < hit.start + [...hit.hanzi].length;
</script>

{#if lookup}
	<span
		bind:this={node}
		lang="zh-Hans"
		use:tapLookup={{
			sentenceId,
			onhit: (h) => lookup.open(h, (node!.closest('li') ?? node!).getBoundingClientRect())
		}}
		>{#each chars as { c, i, han } (i)}{#if han}<span
					data-i={i}
					data-hit={on(i) || undefined}
					class="cursor-pointer rounded-[6px] data-hit:bg-lantern-red-wash">{c}</span
				>{:else}{c}{/if}{/each}</span
	>
{:else}{hanzi}{/if}
