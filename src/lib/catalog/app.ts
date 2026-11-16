import { httpSource } from './http';
import { createCatalog } from './index';

/** One app-wide catalog; its per-session bundle cache lives here. Importing makes no request. */
export const catalog = createCatalog(httpSource());
