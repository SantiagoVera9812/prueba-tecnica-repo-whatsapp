import { db } from '@/lib/db';
// Repositorio para manejar la configuración del bot en la base de datos. Proporciona métodos para obtener o crear la configuración del bot y guardar cambios en la configuración.
export const defaultBotConfig = {
	name: 'Configuración principal',
	systemPrompt: 'Eres un asistente de IA útil y conciso.',
	model: 'google/gemma-4-31b-it:free',
	temperature: 0.7,
	maxTokens: 512,
	isActive: true,
};

export class BotConfigRepository {
	async getOrCreate() {
		return db.botConfig.upsert({
			where: { id: 'default' },
			update: {},
			create: { id: 'default', ...defaultBotConfig },
		});
	}

	async save(input: { prompt: string; model: string; temperature: number }) {
		return db.botConfig.upsert({
			where: { id: 'default' },
			update: { systemPrompt: input.prompt, model: input.model, temperature: input.temperature },
			create: { id: 'default', ...defaultBotConfig, systemPrompt: input.prompt, model: input.model, temperature: input.temperature },
		});
	}
}
