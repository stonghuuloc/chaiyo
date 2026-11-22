<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<section data-content-sha={data.lesson.contentSha}>
	<h1>{data.lesson.lesson.titleHanzi} {data.lesson.lesson.title}</h1>
	<p>contentSha: <code>{data.lesson.contentSha}</code></p>
</section>
