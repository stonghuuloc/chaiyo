import { PUBLIC_AUDIO_BASE_URL } from '$app/env/public';
import { SYLLABLE_VERSION } from './version';

const ORIGIN = (PUBLIC_AUDIO_BASE_URL || '/audio').replace(/\/$/, '');

export const AUDIO_BASE = ORIGIN;
export const SYLLABLE_BASE = `${ORIGIN}/${SYLLABLE_VERSION}`;
