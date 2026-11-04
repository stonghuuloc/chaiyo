const NEUTRAL = new Set([
	'de',
	'le',
	'ma',
	'me',
	'men',
	'ne',
	'ba',
	'zi',
	'zhe',
	'guo',
	'a',
	'ya',
	'na',
	'chu lai',
	'qi lai'
]);
const MARK = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;

export const stripTones = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[\u0300\u0301\u0304\u030C]/g, '')
		.normalize('NFC');

export const badPinyin = (s: string) => {
	const t = s.normalize('NFC').toLowerCase();
	if (/\d/.test(t)) return 'digit';
	return MARK.test(t) || NEUTRAL.has(t.trim()) ? null : 'no tone mark';
};

export const ideographs = (s: string) => [...s].filter((c) => /[\u3400-\u9fff]/.test(c));

export const pathOf = (parts: (string | number)[]) =>
	parts.map((k, i) => (typeof k === 'number' ? `[${k}]` : (i ? '.' : '') + k)).join('');
