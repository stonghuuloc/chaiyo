export type Speaker = 'FV2' | 'MV1';

export const SPEAKERS: Speaker[] = ['FV2', 'MV1'];

export const clipKey = (key: string, speaker: Speaker) => (speaker === 'MV1' ? `mv1/${key}` : key);

export const TONE_CONTOURS = ['high, level', 'rising', 'falling then rising', 'falling'] as const;
