import type { BotConfigInput } from '@/lib/types/bot-config';

// Define un tipo BotConfig que extiende de BotConfigInput e incluye propiedades adicionales id y updatedAt, ambas de tipo string.
export type BotConfig = BotConfigInput & { id: string; updatedAt: string };
// Función auxiliar para leer la respuesta de una solicitud fetch y manejar errores, devolviendo los datos en caso de éxito.
async function readResponse(response: Response) {
	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(typeof data.error === 'string' ? data.error : 'No se pudo completar la operación.');
	}
	return data;
}
// Función para obtener la configuración del bot desde el endpoint /api/config, utilizando la función readResponse para manejar la respuesta. Es usada por el hook useBotConfig para obtener la configuración del bot.
export async function getBotConfig(): Promise<BotConfig> {
	return readResponse(await fetch('/api/config'));
}
// Función para guardar la configuración del bot enviando una solicitud PUT al endpoint /api/config con los datos de configuración en el cuerpo de la solicitud, utilizando la función readResponse para manejar la respuesta. Es usada por el hook useBotConfig para guardar la configuración del bot.
export async function saveBotConfig(config: BotConfigInput): Promise<BotConfig> {
	return readResponse(await fetch('/api/config', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(config),
	}));
}
