import * as Sentry from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
import { sentryOptions } from '#lib/sentry.js';

Sentry.init(sentryOptions);

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		return resolve(
			{ ...event, request },
			{
				transformPageChunk: ({ html }) =>
					html
						.replace('%paraglide.lang%', locale)
						.replace('%paraglide.dir%', getTextDirection(locale))
			}
		);
	});

export const handle: Handle = sequence(Sentry.sentryHandle(), handleParaglide);

const handleServerError: HandleServerError = ({ error }) => {
	console.error(error);
};

export const handleError = Sentry.handleErrorWithSentry(handleServerError);
