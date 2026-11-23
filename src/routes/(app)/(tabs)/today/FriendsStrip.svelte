<script lang="ts" module>
	export type Friend = { id: string; name: string; streak: number; lesson: number };
</script>

<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	let { friends }: { friends: Friend[] } = $props();
</script>

{#if friends.length}
	<section data-part="friends" class="mt-5 border-t border-ruled-line pt-6">
		<h2 class="mb-3 font-headline text-headline text-ink">{m.chy45s3_friends()}</h2>
		<ul class="grid grid-cols-3 gap-2 xl:grid-cols-1 xl:gap-3">
			{#each friends.slice(0, 3) as friend (friend.id)}
				<li data-part="friend" class="flex min-w-0 items-center gap-2 text-ink">
					<span
						class="grid size-[38px] shrink-0 place-items-center rounded-full bg-sunflower-wash font-display text-[17px] font-semibold"
						aria-hidden="true">{friend.name[0]}</span
					>
					<span class="min-w-0">
						<b class="block truncate text-[15px] font-semibold">{friend.name}</b>
						<small
							class="flex items-center gap-[3px] text-[12.5px] leading-[1.35] whitespace-nowrap text-pencil xl:mr-2 xl:inline-flex"
						>
							<svg class="size-[13px] fill-current text-lantern-red" aria-hidden="true"
								><use href="#i-fill-fire" /></svg
							>
							{m.chy45s3_friend_days({ n: friend.streak })}
						</small>
						<small class="block text-[12.5px] leading-[1.35] text-pencil xl:inline"
							>{m.chy45s3_friend_lesson({ n: friend.lesson })}</small
						>
					</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}
