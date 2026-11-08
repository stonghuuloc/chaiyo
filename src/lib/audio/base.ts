import { PUBLIC_AUDIO_BASE_URL } from '$app/env/public';
import { AUDIO_VERSION } from './version';

export const AUDIO_BASE = `${(PUBLIC_AUDIO_BASE_URL || '/audio').replace(/\/$/, '')}/${AUDIO_VERSION}`;
