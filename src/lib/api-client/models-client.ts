import type { OpenRouterModel } from '@/lib/types/openrouter';
// Función para obtener los modelos gratuitos disponibles desde el endpoint /api/models, utilizando la función readResponse para manejar la respuesta. Es usada por el hook useModels para obtener los modelos disponibles de Open Router.
export async function getFreeModels(): Promise<OpenRouterModel[]> {
	const response = await fetch('/api/models');
	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(typeof data.error === 'string' ? data.error : 'No se pudieron cargar los modelos disponibles.');
	}
	return data;
}