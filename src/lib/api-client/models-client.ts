import type { OpenRouterModel } from '@/lib/types/openrouter';

export async function getFreeModels(): Promise<OpenRouterModel[]> {
	const response = await fetch('/api/models');
	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(typeof data.error === 'string' ? data.error : 'No se pudieron cargar los modelos disponibles.');
	}
	return data;
}