import type { InstanceConnection } from '@/lib/types/instance';
// Función para obtener la conexión de la instancia desde el endpoint /api/instance, utilizando la función readResponse para manejar la respuesta. Es usada por el hook useInstanceConnection para obtener el estado de la conexión de la instancia de WhatsApp.
export async function getInstanceConnection(): Promise<InstanceConnection> {
	const response = await fetch('/api/instance', { cache: 'no-store' });
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'No se pudo consultar la conexión.');
	return data;
}
// Función para iniciar la conexión de la instancia enviando una solicitud POST al endpoint /api/instance/connect, utilizando la función readResponse para manejar la respuesta. Es usada por el hook useInstanceConnection para iniciar la conexión de la instancia de WhatsApp.
export async function startInstanceConnection(): Promise<InstanceConnection> {
	const response = await fetch('/api/instance/connect', { method: 'POST' });
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'No se pudo iniciar la conexión.');
	return data;
}