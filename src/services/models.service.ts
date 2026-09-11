import { OpenRouterClient } from '@/infrastructure/openrouter/openrouter.client';

export class ModelsService {
	constructor(private readonly openRouter = new OpenRouterClient()) {}

	getFreeModels() {
		return this.openRouter.listFreeModels();
	}
}

export const modelsService = new ModelsService();