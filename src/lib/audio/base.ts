import { PUBLIC_AUDIO_BASE_URL } from '$app/env/public';
import { AUDIO_VERSION, SYLLABLE_VERSION } from './version';

const ORIGIN = (PUBLIC_AUDIO_BASE_URL || '/audio').replace(/\/$/, '');

export const AUDIO_BASE = `${ORIGIN}/${AUDIO_VERSION}`;
export const SYLLABLE_BASE = `${ORIGIN}/${SYLLABLE_VERSION}`;
