import type { BotConfigInput } from '@/lib/types/bot-config';

export function parseBotConfigInput(value: unknown): BotConfigInput | null {
	if (!value || typeof value !== 'object') return null;

	const body = value as Record<string, unknown>;
	const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
	const model = typeof body.model === 'string' ? body.model.trim() : '';
	const temperature = Number(body.temperature);

	if (!prompt || !model || !Number.isFinite(temperature) || temperature < 0 || temperature > 2) {
		return null;
	}

	return { prompt, model, temperature };
}
