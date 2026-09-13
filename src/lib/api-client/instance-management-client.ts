// lib/api-client/instance-management-client.ts
// Función para eliminar la instancia enviando una solicitud DELETE al endpoint /api/instance, utilizando la función readResponse para manejar la respuesta. Es usada por el hook useDeleteInstance para eliminar la instancia de WhatsApp.
export async function deleteInstance(): Promise<{ pending: boolean }> {
	const response = await fetch('/api/instance', { method: 'DELETE' });
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'No se pudo desvincular el dispositivo.');
	return { pending: Boolean(data.pending) };
}