import { OpenRouterClient } from '@/infrastructure/openrouter/openrouter.client';
// Servicio para manejar la obtención de modelos gratuitos desde OpenRouter. Utiliza el cliente de OpenRouter para listar los modelos disponibles y proporciona una función para obtener estos modelos.
export class ModelsService {
	constructor(private readonly openRouter = new OpenRouterClient()) {}

	getFreeModels() {
		return this.openRouter.listFreeModels();
	}
}

export const modelsService = new ModelsService();