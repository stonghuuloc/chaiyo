import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProfileSection, { type ProfileDeps } from './ProfileSection.svelte';

const PHOTO = 'data:image/jpeg;base64,AAA';
const SAVE_ERROR = 'Chưa lưu được. Bạn thử lại nhé.';
const PHOTO_ERROR = 'Chưa mở được ảnh này. Bạn thử ảnh khác nhé.';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	await new Promise((r) => setTimeout(r, 0));
	flushSync();
};

const mountWith = (over: Partial<ProfileDeps> = {}) => {
	const deps = {
		profile: { name: 'Tống Lộc', photo: null, hidden: false },
		email: 'loc@example.com',
		save: vi.fn<ProfileDeps['save']>(async () => {}),
		decode: vi.fn<ProfileDeps['decode']>(async () => PHOTO),
		notify: vi.fn<ProfileDeps['notify']>(),
		...over
	} satisfies ProfileDeps;
	target = document.createElement('div');
	document.body.append(target);
	app = mount(ProfileSection, { target, props: { deps } }) as Record<string, unknown>;
	flushSync();
	return deps;
};

const field = () => document.querySelector<HTMLInputElement>('input[type="text"]')!;
const avatar = () => document.querySelector('[data-avatar]')!;
const removeButton = () =>
	[...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Bỏ ảnh');
const type = (value: string) => {
	field().value = value;
	field().dispatchEvent(new Event('input', { bubbles: true }));
	flushSync();
};
const leave = async () => {
	field().dispatchEvent(new Event('change', { bubbles: true }));
	await settle();
};
const pick = async () => {
	const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
	Object.defineProperty(input, 'files', {
		value: [new File(['x'], 'a.png', { type: 'image/png' })],
		configurable: true
	});
	input.dispatchEvent(new Event('change', { bubbles: true }));
	await settle();
	await settle();
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	flushSync();
});

describe('ProfileSection', () => {
	it('Given_SavedName_When_Mount_Then_FieldInitialsAndEmail', () => {
		mountWith();
		expect(document.querySelector('h2')?.textContent).toBe('Hồ sơ');
		expect(document.body.textContent).toContain('Tên và ảnh bạn bè sẽ thấy.');
		expect(field().value).toBe('Tống Lộc');
		expect(avatar().textContent?.trim()).toBe('TL');
		expect(document.body.textContent).toContain('loc@example.com');
		expect(removeButton()).toBeUndefined();
	});

	it('Given_TypeLocT_When_Input_Then_InitialsLTAndNoSave', () => {
		const deps = mountWith();
		type('Lộc T');
		expect(avatar().textContent?.trim()).toBe('LT');
		expect(deps.save).not.toHaveBeenCalled();
	});

	it('Given_TypeLocT_When_Change_Then_SaveNameOnce', async () => {
		const deps = mountWith();
		type('Lộc T');
		await leave();
		expect(deps.save).toHaveBeenCalledOnce();
		expect(deps.save).toHaveBeenCalledWith({ name: 'Lộc T' });
	});

	it('Given_Cleared_When_Change_Then_RestoredAndNoSave', async () => {
		const deps = mountWith();
		type('');
		await leave();
		expect(field().value).toBe('Tống Lộc');
		expect(avatar().textContent?.trim()).toBe('TL');
		expect(deps.save).not.toHaveBeenCalled();
	});

	it('Given_Field_When_Render_Then_Maxlength30', () => {
		mountWith();
		expect(field().maxLength).toBe(30);
		expect(field().getAttribute('autocomplete')).toBe('name');
	});

	it('Given_File_When_Pick_Then_SavePhotoToastAndBoAnh', async () => {
		const deps = mountWith();
		await pick();
		expect(deps.save).toHaveBeenCalledWith({ photo: PHOTO });
		expect(document.querySelector('img')?.getAttribute('src')).toBe(PHOTO);
		expect(deps.notify).toHaveBeenCalledWith('Ảnh đẹp đó!');
		expect(removeButton()).toBeDefined();
	});

	it('Given_SavedPhoto_When_Mount_Then_ImgAndBoAnh', () => {
		mountWith({ profile: { name: 'Tống Lộc', photo: PHOTO, hidden: false } });
		expect(document.querySelector('img')?.getAttribute('src')).toBe(PHOTO);
		expect(removeButton()).toBeDefined();
	});

	it('Given_Photo_When_BoAnh_Then_SaveNullAndInitials', async () => {
		const deps = mountWith({ profile: { name: 'Tống Lộc', photo: PHOTO, hidden: false } });
		removeButton()!.click();
		await settle();
		expect(deps.save).toHaveBeenCalledWith({ photo: null });
		expect(document.querySelector('img')).toBeNull();
		expect(avatar().textContent?.trim()).toBe('TL');
		expect(removeButton()).toBeUndefined();
		expect(deps.notify).not.toHaveBeenCalled();
	});

	it('Given_DecodeFails_When_Pick_Then_ErrorToastNoSave', async () => {
		const deps = mountWith({ decode: vi.fn(async () => Promise.reject(new Error('bad'))) });
		await pick();
		expect(deps.notify).toHaveBeenCalledWith(PHOTO_ERROR);
		expect(deps.save).not.toHaveBeenCalled();
		expect(document.querySelector('img')).toBeNull();
	});

	it('Given_SaveRejects_When_Change_Then_OldNameAndSaveErrorToast', async () => {
		const deps = mountWith({ save: vi.fn(async () => Promise.reject(new Error('rls'))) });
		type('Lộc T');
		await leave();
		expect(field().value).toBe('Tống Lộc');
		expect(avatar().textContent?.trim()).toBe('TL');
		expect(deps.notify).toHaveBeenCalledWith(SAVE_ERROR);
	});

	it('Given_SaveRejects_When_Pick_Then_NoPhotoAndSaveErrorToast', async () => {
		const deps = mountWith({ save: vi.fn(async () => Promise.reject(new Error('rls'))) });
		await pick();
		expect(document.querySelector('img')).toBeNull();
		expect(removeButton()).toBeUndefined();
		expect(deps.notify).toHaveBeenCalledWith(SAVE_ERROR);
	});

	it('Given_SaveRejects_When_BoAnh_Then_PhotoStays', async () => {
		const deps = mountWith({
			profile: { name: 'Tống Lộc', photo: PHOTO, hidden: false },
			save: vi.fn(async () => Promise.reject(new Error('rls')))
		});
		removeButton()!.click();
		await settle();
		expect(document.querySelector('img')?.getAttribute('src')).toBe(PHOTO);
		expect(deps.notify).toHaveBeenCalledWith(SAVE_ERROR);
	});
});
