<script lang="ts">
	import { page } from '$app/state';
	import WordsList from '../../(app)/practice/words/WordsList.svelte';
	import { T, bai1 } from '#lib/study/fixtures/bai1.js';
	import { myWords, type WordMeta } from '#lib/study/index.js';

	const stub: Record<string, WordMeta> = {
		你: { pinyin: 'nǐ', hanViet: 'nhĩ', nghia: 'bạn' },
		好: { pinyin: 'hǎo', hanViet: 'hảo', nghia: 'tốt' },
		你好: { pinyin: 'nǐ hǎo', hanViet: 'nhĩ hảo', nghia: 'xin chào' },
		谢谢: { pinyin: 'xièxie', hanViet: 'tạ tạ', nghia: 'cảm ơn' },
		熊猫: { pinyin: 'xióngmāo', hanViet: 'hùng miêu', nghia: 'gấu trúc' }
	};

	const fallback = (h: string): WordMeta => ({ pinyin: `p-${h}`, hanViet: '', nghia: `n-${h}` });

	const rows = $derived.by(() => {
		const state = bai1();
		if (page.url.searchParams.has('empty')) state.lexicon = {};
		if (page.url.searchParams.has('extra'))
			state.lexicon = {
				...state.lexicon,
				你们2: { saved: false, cards: {} },
				茶: { saved: true, cards: {} }
			};
		return myWords(state, (h) => stub[h] ?? (h === '再见' ? undefined : fallback(h)), T);
	});
</script>

<h1>/dev/my-words</h1>
<WordsList {rows} query={page.url.searchParams.get('q') ?? ''} />
