// design.tokens.json (DTCG) → src/lib/styles/tokens.css as a Tailwind v4 @theme. Run: pnpm tokens
// Theme namespaces become utilities: color → bg-*/text-*, font → font-*, space → p-*/gap-*, radius → rounded-*,
// type → text-display etc. (size + line-height + weight + tracking). Groups Tailwind has no namespace for
// (frost, icon) stay plain :root variables.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const isRef = (v) => typeof v === 'string' && /^\{[^}]+\}$/.test(v);
const varName = (path) => `--${path.join('-')}`;

function color(v) {
	if (typeof v === 'string') return v;
	const [r, g, b] = v.components.map((c) => Math.round(c * 255));
	return v.alpha === undefined || v.alpha === 1
		? `rgb(${r} ${g} ${b})`
		: `rgb(${r} ${g} ${b} / ${v.alpha})`;
}
const dim = (v) => (typeof v === 'object' ? `${v.value}${v.unit}` : String(v));
const family = (v) =>
	Array.isArray(v) ? v.map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(', ') : v;

/**
 * Format a DTCG token value for CSS. References such as `{color.ink}` become
 * CSS variable references without resolving the target. Dimension and duration
 * objects retain their supplied units; unhandled types use string conversion.
 */
function value(type, v) {
	if (isRef(v)) return `var(${varName(v.slice(1, -1).split('.'))})`;
	switch (type) {
		case 'color':
			return color(v);
		case 'dimension':
			return dim(v);
		case 'duration':
			return `${v.value}${v.unit}`;
		case 'fontFamily':
			return family(v);
		case 'shadow':
			return [v]
				.flat()
				.map(
					(s) =>
						`${dim(s.offsetX)} ${dim(s.offsetY)} ${dim(s.blur)} ${dim(s.spread)} ${color(s.color)}`
				)
				.join(', ');
		default:
			return String(v);
	}
}

// Token group → Tailwind namespace. Groups not listed here go to :root.
const THEME = { color: 'color', font: 'font', space: 'spacing', radius: 'radius', type: 'text' };

export function toCss(tokens) {
	const theme = [];
	const root = [];
	const walk = (node, path, inherited) => {
		const type = node.$type ?? inherited;
		if ('$value' in node) {
			const ns = THEME[path[0]];
			const name = [ns ?? path[0], ...path.slice(1)];
			const out = ns ? theme : root;
			if (type === 'typography') {
				const t = node.$value;
				const base = varName(name);
				out.push(`\t${base}: ${value('dimension', t.fontSize)};`);
				if (t.lineHeight !== undefined) out.push(`\t${base}--line-height: ${t.lineHeight};`);
				if (t.fontWeight !== undefined) out.push(`\t${base}--font-weight: ${t.fontWeight};`);
				if (t.letterSpacing !== undefined)
					out.push(`\t${base}--letter-spacing: ${value('dimension', t.letterSpacing)};`);
				// family can't ride on text-*; expose it as font-<name> (e.g. font-display)
				out.push(`\t${varName(['font', ...path.slice(1)])}: ${value('fontFamily', t.fontFamily)};`);
			} else out.push(`\t${varName(name)}: ${value(type, node.$value)};`);
			return;
		}
		for (const [k, child] of Object.entries(node))
			if (!k.startsWith('$') && child && typeof child === 'object') walk(child, [...path, k], type);
	};
	walk(tokens, [], undefined);
	return [
		'/* Generated from design.tokens.json by scripts/build-tokens.mjs — do not edit. */',
		`@theme {\n${theme.join('\n')}\n}`,
		`:root {\n${root.join('\n')}\n}`,
		''
	].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const root = new URL('..', import.meta.url);
	const tokens = JSON.parse(readFileSync(new URL('design.tokens.json', root), 'utf8'));
	mkdirSync(new URL('src/lib/styles/', root), { recursive: true });
	writeFileSync(new URL('src/lib/styles/tokens.css', root), toCss(tokens));
	console.log('wrote src/lib/styles/tokens.css');
}
