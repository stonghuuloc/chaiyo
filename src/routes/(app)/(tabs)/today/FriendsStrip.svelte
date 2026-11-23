<script lang="ts" module>
	export type Friend = { id: string; name: string; streak: number; lesson: number };
</script>

<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	let { friends }: { friends: Friend[] } = $props();
</script>

{#if friends.length}
	<section data-part="friends" class="mt-5">
		<h2 class="text-body text-text">{m.chy45s3_friends()}</h2>
		<ul class="mt-3 grid grid-cols-3 gap-2">
			{#each friends.slice(0, 3) as friend (friend.id)}
				<li
					data-part="friend"
					class="flex items-center gap-2 rounded-action bg-white p-3 text-text"
				>
					<span
						class="grid size-9 shrink-0 place-items-center rounded-full bg-sunflower-wash font-semibold"
						aria-hidden="true">{friend.name[0]}</span
					>
					<span class="min-w-0">
						<b class="block truncate font-semibold">{friend.name}</b>
						<small class="flex items-center gap-1 text-label text-muted">
							<svg class="size-3.5 fill-current text-primary" aria-hidden="true"
								><use href="#i-fill-fire" /></svg
							>
							{m.chy45s3_friend_days({ n: friend.streak })}
						</small>
						<small class="block text-label text-muted"
							>{m.chy45s3_friend_lesson({ n: friend.lesson })}</small
						>
					</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}
