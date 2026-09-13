import { WebhookEventRepository } from '@/repositories/webhook-event.repository';
// Servicio para manejar eventos de webhook, incluyendo el registro de eventos recibidos y la actualización del estado de procesamiento de los eventos. Utiliza el repositorio WebhookEventRepository para interactuar con la base de datos.
export class WebhookEventService {
	constructor(private readonly repository = new WebhookEventRepository()) {}
	// Función para registrar un evento de webhook recibido. Toma el payload del evento, extrae el tipo de evento y lo guarda en la base de datos junto con el payload crudo.
	recordReceived(payload: unknown) {
		const body = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
		return this.repository.create({
			eventType: typeof body.event === 'string' ? body.event : 'unknown',
			rawPayload: JSON.stringify(payload),
		});
	}
	// Función para marcar un evento de webhook como procesado, ignorado o con error. Toma el ID del evento, el estado de procesamiento y un mensaje de error opcional, y actualiza el registro correspondiente en la base de datos.
	markProcessed(id: string, status: 'processed' | 'ignored' | 'error', errorMessage?: string) {
		return this.repository.updateStatus(id, { processedStatus: status, errorMessage });
	}
}

export const webhookEventService = new WebhookEventService();