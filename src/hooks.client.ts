import * as Sentry from '@sentry/sveltekit';
import type { HandleClientError } from '@sveltejs/kit/hooks';
import { sentryOptions } from '#lib/sentry.js';

Sentry.init(sentryOptions);

const handleClientError: HandleClientError = ({ error }) => {
	console.error(error);
};

export const handleError = Sentry.handleErrorWithSentry(handleClientError);
