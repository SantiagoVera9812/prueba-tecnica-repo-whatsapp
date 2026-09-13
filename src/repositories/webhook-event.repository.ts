import { db } from '@/lib/db';
// Repositorio para manejar los eventos de webhook en la base de datos. Proporciona métodos para crear y actualizar el estado de los eventos de webhook.
export class WebhookEventRepository {
	create(input: { eventType: string; rawPayload: string }) {
		return db.webhookEvent.create({ data: input });
	}

	updateStatus(id: string, input: { processedStatus: string; errorMessage?: string }) {
		return db.webhookEvent.update({ where: { id }, data: input });
	}
}