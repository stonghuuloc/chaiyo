import { describe, expect, it, vi } from 'vitest';
import { runPush, type PushDeps } from './run';

const deps = (o: Partial<PushDeps> = {}): PushDeps => ({
	key: 'BKEY',
	enable: vi.fn(async () => 'on' as const),
	disable: vi.fn(async () => {}),
	invoke: vi.fn(async () => ({ error: null })),
	...o
});

describe('/dev/push runPush', () => {
	it('Given_NoKey_When_On_Then_NoKeyText', async () => {
		const d = deps({ key: undefined });
		expect(await runPush('on', d)).toBe('Chưa cấu hình khóa VAPID');
		expect(d.enable).not.toHaveBeenCalled();
	});

	it('Given_Unsupported_When_On_Then_StateText', async () => {
		const d = deps({ enable: vi.fn(async () => 'unsupported' as const) });
		expect(await runPush('on', d)).toBe('Trạng thái: unsupported');
	});

	it('Given_Granted_When_On_Then_StateOn', async () => {
		expect(await runPush('on', deps())).toBe('Trạng thái: on');
	});

	it('Given_Subscribed_When_Off_Then_DisablesAndStateOff', async () => {
		const d = deps();
		expect(await runPush('off', d)).toBe('Trạng thái: off');
		expect(d.disable).toHaveBeenCalledTimes(1);
	});

	it('Given_InvokeOk_When_Test_Then_OkText', async () => {
		expect(await runPush('test', deps())).toBe('Trạng thái: ok');
	});

	it('Given_InvokeError_When_Test_Then_ErrorText', async () => {
		const d = deps({ invoke: vi.fn(async () => ({ error: { message: 'push not configured' } })) });
		expect(await runPush('test', d)).toBe('Trạng thái: push not configured');
	});
});
