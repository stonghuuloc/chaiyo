// jsdom gaps the UI kit needs before its modules evaluate: Kit's dev env, svelte/motion's media
// queries, and Web Animations (each transition finishes at once, so an exited sheet leaves the DOM).
Object.assign(globalThis, { __sveltekit_dev: { env: {} } });

// jsdom ships no MediaQueryList constructor, so the object literal stands in for it.
const noMatch = (media: string) =>
	({
		matches: false,
		media,
		onchange: null,
		addEventListener() {},
		removeEventListener() {},
		addListener() {},
		removeListener() {},
		dispatchEvent: () => false
	}) as MediaQueryList;

window.matchMedia = noMatch;

Object.defineProperty(Element.prototype, 'animate', {
	configurable: true,
	value: () => {
		const animation = {
			onfinish: null as null | (() => void),
			playState: 'running',
			currentTime: 0,
			effect: null,
			cancel() {}
		};
		queueMicrotask(() => animation.onfinish?.());
		return animation;
	}
});
