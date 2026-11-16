<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<section data-content-sha={data.lesson.contentSha}>
	<h1>{data.lesson.lesson.titleHanzi} {data.lesson.lesson.title}</h1>
	<ol>
		{#each data.lesson.words as w (w.id)}
			<li>{`${w.hanzi} ${w.pinyin}${w.hanviet ? ` — ${w.hanviet}` : ''}`}</li>
		{/each}
	</ol>
</section>
