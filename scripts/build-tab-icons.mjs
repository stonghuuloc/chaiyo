// prototype/icons.svg → src/lib/assets/tab-icons.svg: only the 8 symbols the tab bar uses. Run: pnpm tab-icons
import { readFileSync, writeFileSync } from 'node:fs';

const NAMES = ['house', 'path', 'brain', 'user-circle'];
const ids = NAMES.flatMap((n) => [`i-regular-${n}`, `i-fill-${n}`]);
const root = new URL('..', import.meta.url);
const source = readFileSync(new URL('prototype/icons.svg', root), 'utf8');

const symbols = ids.map((id) => {
	const m = source.match(new RegExp(`<symbol[^>]*\\sid="${id}"[\\s\\S]*?</symbol>`));
	if (!m) throw new Error(`symbol ${id} missing from prototype/icons.svg`);
	return m[0];
});

const out = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true">${symbols.join('')}</svg>\n`;
writeFileSync(new URL('src/lib/assets/tab-icons.svg', root), out);
console.log(
	`wrote src/lib/assets/tab-icons.svg (${Buffer.byteLength(out)} B, ${ids.length} symbols)`
);
