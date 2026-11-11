// Hashed into every lesson clip's key (ADR 0007): a change here gives each clip a new URL.
export const CAST = {
	rate: '-20%',
	format: 'audio-48khz-192kbitrate-mono-mp3',
	voices: {
		redpanda: 'zh-CN-XiaoxiaoNeural',
		takin: 'zh-CN-YunfengNeural'
	} as Record<string, string>
};

export type Cast = typeof CAST;
