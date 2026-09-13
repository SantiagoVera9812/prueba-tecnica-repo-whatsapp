import type { BotConfigInput } from '@/lib/types/bot-config';

// Función para analizar y validar un objeto desconocido como BotConfigInput. Devuelve el objeto validado si es válido, o null si no lo es. Se asegura de que el prompt y el modelo sean cadenas no vacías y que la temperatura sea un número finito entre 0 y 2.
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
