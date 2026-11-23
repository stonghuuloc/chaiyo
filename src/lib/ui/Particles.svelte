<script lang="ts">
	import { untrack } from 'svelte';
	import { particles, reducedMotion, type Kind } from './particles';

	type Props = { kind: Kind };
	let { kind }: Props = $props();

	const specs = untrack(() => (reducedMotion() ? [] : particles(kind)));
</script>

{#if specs.length}
	<div
		data-part="particles"
		class="pointer-events-none fixed inset-0 z-60 overflow-hidden"
		aria-hidden="true"
	>
		{#each specs as p, i (i)}
			<span
				data-part="particle"
				data-kind={kind}
				class="{kind} absolute opacity-85 {kind === 'ember' ? 'text-primary' : 'text-freeze-blue'}"
				style:left="{p.left}vw"
				style:width="{p.size}px"
				style:height="{p.size}px"
				style:animation-duration="{p.duration}s"
				style:animation-delay="{p.delay}s"
			>
				<svg class="size-full fill-current"
					><use href={kind === 'ember' ? '#i-fill-fire' : '#i-regular-snowflake'} /></svg
				>
			</span>
		{/each}
	</div>
{/if}

<style>
	.ember {
		bottom: -24px;
	}
	.snow {
		top: -24px;
	}
	@media (prefers-reduced-motion: no-preference) {
		.ember {
			animation: rise linear forwards;
		}
		.snow {
			animation: fall linear forwards;
		}
	}
	@keyframes rise {
		to {
			transform: translateY(-105vh) rotate(-30deg);
			opacity: 0;
		}
	}
	@keyframes fall {
		to {
			transform: translateY(105vh) rotate(240deg);
		}
	}
</style>
