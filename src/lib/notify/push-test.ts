import type { Channel, ChannelName } from './channel';

const CORS = {
	'access-control-allow-origin': '*',
	'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type'
};

const reply = (body: unknown, status: number) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { ...CORS, 'content-type': 'application/json' }
	});

export async function handlePushTest(
	req: Request,
	o: {
		uid(auth: string | null): Promise<string | null>;
		channel: Channel | null;
		name: ChannelName;
		now(): Date;
	}
): Promise<Response> {
	if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
	const learnerId = await o.uid(req.headers.get('authorization'));
	if (!learnerId) return reply({ error: 'unauthorized' }, 401);
	if (!o.channel) return reply({ error: `${o.name} not configured` }, 503);
	try {
		await o.channel.send({ learnerId, day: o.now().toISOString().slice(0, 10) });
		return reply({ ok: true }, 200);
	} catch (e) {
		return reply({ error: e instanceof Error ? e.message : String(e) }, 502);
	}
}
