import type { BotConfigInput } from '@/lib/types/bot-config';

export type BotConfig = BotConfigInput & { id: string; updatedAt: string };

async function readResponse(response: Response) {
	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(typeof data.error === 'string' ? data.error : 'No se pudo completar la operación.');
	}
	return data;
}

export async function getBotConfig(): Promise<BotConfig> {
	return readResponse(await fetch('/api/config'));
}

export async function saveBotConfig(config: BotConfigInput): Promise<BotConfig> {
	return readResponse(await fetch('/api/config', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(config),
	}));
}
