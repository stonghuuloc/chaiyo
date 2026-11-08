import { PUBLIC_AUDIO_BASE_URL } from '$app/env/public';

export const AUDIO_BASE = (PUBLIC_AUDIO_BASE_URL || '/audio').replace(/\/$/, '');
