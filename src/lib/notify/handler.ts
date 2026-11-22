import type { TickResult } from './tick';

const reply = (body: unknown, status: number) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});

export async function handle(
	req: Request,
	o: { secret: string | undefined; run(now: Date): Promise<TickResult> }
): Promise<Response> {
	if (!o.secret || req.headers.get('x-notify-secret') !== o.secret)
		return reply({ error: 'unauthorized' }, 401);
	try {
		return reply(await o.run(new Date()), 200);
	} catch (e) {
		return reply({ error: e instanceof Error ? e.message : String(e) }, 500);
	}
}
