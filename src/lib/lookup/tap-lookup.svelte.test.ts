import { afterEach, describe, expect, it, vi } from 'vitest';
import { tapLookup } from './tap-lookup';

const lookup = vi.fn(async (sentenceId: string, i: number) => ({
	hanzi: '谢谢',
	pinyin: 'xièxie',
	hanviet: 'tạ tạ',
	meaning: 'cảm ơn',
	sentenceId,
	start: i
}));

vi.mock('#lib/catalog/app.js', () => ({ catalog: { lookup } }));

const flush = () => new Promise((r) => setTimeout(r, 0));

const sentence = () => {
	const node = document.createElement('p');
	node.innerHTML = '<span data-i="0">谢</span><span data-i="1">谢</span><span>。</span>';
	document.body.append(node);
	return node;
};

const click = (el: Element, detail = 1) =>
	el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail }));

afterEach(() => {
	getSelection()?.removeAllRanges();
	document.body.innerHTML = '';
	lookup.mockClear();
});

describe('tapLookup', () => {
	it('Given_SpanWithIndex_When_Click_Then_OnhitGetsCatalogHit', async () => {
		// Arrange
		const node = sentence();
		const onhit = vi.fn();
		tapLookup(node, { sentenceId: 's-1', onhit });
		// Act
		click(node.querySelectorAll('span')[1]);
		await flush();
		// Assert
		expect(lookup).toHaveBeenCalledWith('s-1', 1);
		expect(onhit).toHaveBeenCalledWith(expect.objectContaining({ hanzi: '谢谢', start: 1 }));
	});

	it('Given_SpanWithoutIndex_When_Click_Then_NoLookup', async () => {
		// Arrange
		const node = sentence();
		const onhit = vi.fn();
		tapLookup(node, { sentenceId: 's-1', onhit });
		// Act
		click(node.querySelectorAll('span')[2]);
		await flush();
		// Assert
		expect(lookup).not.toHaveBeenCalled();
		expect(onhit).not.toHaveBeenCalled();
	});

	it('Given_UpdatedThenDestroyed_When_Click_Then_UsesNewParamsThenStops', async () => {
		// Arrange
		const node = sentence();
		const first = vi.fn();
		const next = vi.fn();
		const action = tapLookup(node, { sentenceId: 's-1', onhit: first });
		action.update({ sentenceId: 's-2', onhit: next });
		// Act
		click(node.querySelectorAll('span')[0]);
		await flush();
		action.destroy();
		click(node.querySelectorAll('span')[0]);
		await flush();
		// Assert
		expect(lookup).toHaveBeenCalledTimes(1);
		expect(lookup).toHaveBeenCalledWith('s-2', 0);
		expect(first).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledTimes(1);
	});

	it('Given_LookupFails_When_Click_Then_OnmissCalled', async () => {
		// Arrange
		lookup.mockRejectedValueOnce(new Error('not-found'));
		const node = sentence();
		const onhit = vi.fn();
		const onmiss = vi.fn();
		tapLookup(node, { sentenceId: 's-1', onhit, onmiss });
		// Act
		click(node.querySelectorAll('span')[0]);
		await flush();
		// Assert
		expect(onhit).not.toHaveBeenCalled();
		expect(onmiss).toHaveBeenCalledOnce();
	});

	it('Given_DoubleClick_When_Click_Then_NoLookup', async () => {
		// Arrange
		const node = sentence();
		const onhit = vi.fn();
		tapLookup(node, { sentenceId: 's-1', onhit });
		// Act
		click(node.querySelectorAll('span')[0], 2);
		await flush();
		// Assert
		expect(lookup).not.toHaveBeenCalled();
	});

	it('Given_TextSelected_When_Click_Then_NoLookup', async () => {
		// Arrange
		const node = sentence();
		const onhit = vi.fn();
		tapLookup(node, { sentenceId: 's-1', onhit });
		getSelection()?.selectAllChildren(node);
		// Act
		click(node.querySelectorAll('span')[0]);
		await flush();
		// Assert
		expect(lookup).not.toHaveBeenCalled();
	});

	it('Given_SingleClickCollapsedSelection_When_Click_Then_Lookup', async () => {
		// Arrange
		const node = sentence();
		const onhit = vi.fn();
		tapLookup(node, { sentenceId: 's-1', onhit });
		// Act
		click(node.querySelectorAll('span')[0]);
		await flush();
		// Assert
		expect(lookup).toHaveBeenCalledWith('s-1', 0);
	});
});
