import { BotConfigRepository } from '@/repositories/bot-config.repository';
import type { BotConfigInput } from '@/lib/types/bot-config';

export type { BotConfigInput } from '@/lib/types/bot-config';


// Servicio para manejar la configuración del bot, incluyendo la obtención y el guardado de la configuración. Utiliza el repositorio BotConfigRepository para interactuar con la base de datos.
export class BotConfigService {
	constructor(private readonly repository = new BotConfigRepository()) {}

	getConfig() {
		return this.repository.getOrCreate().then((config) => ({
			id: config.id,
			prompt: config.systemPrompt,
			model: config.model,
			temperature: config.temperature,
			maxTokens: config.maxTokens,
			isActive: config.isActive,
			updatedAt: config.updatedAt,
		}));
	}

	saveConfig(input: BotConfigInput) {
		return this.repository.save(input).then((config) => ({
			id: config.id,
			prompt: config.systemPrompt,
			model: config.model,
			temperature: config.temperature,
			maxTokens: config.maxTokens,
			isActive: config.isActive,
			updatedAt: config.updatedAt,
		}));
	}
}

export const botConfigService = new BotConfigService();
