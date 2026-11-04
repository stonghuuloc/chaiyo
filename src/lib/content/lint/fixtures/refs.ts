import type { LintRefs } from '../types';

export const fixtureRefs: LintRefs = {
	polyphones: new Map([['好', ['hǎo', 'hào']]]),
	syllabus: new Map([
		[1, 1],
		[277, 4]
	]),
	mnemonics: new Map([
		[
			'你',
			{
				hinh: 'Người đứng (亻) bên chữ 尔.',
				am: 'Hán-Việt nhĩ, đọc gần với 尔.',
				doiThat: 'Chào ai thì nhìn vào người đó.',
				tuongPhan: '你 là bạn, 您 thêm 心 là người lớn tuổi.'
			}
		]
	])
};
