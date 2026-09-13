import { NextResponse } from 'next/server';
import { chatService } from '@/services/chat.service';
import { instanceService } from '@/services/instance.service';
import { parseEvolutionWebhook } from '@/lib/validation/webhook';
import { webhookEventService } from '@/services/webhook-event.service';

export const dynamic = 'force-dynamic';

// app/api/webhook/evolution/route.ts
// POST: Recibe eventos de webhook de la API de Evolution. Registra el evento recibido, analiza el tipo de evento y maneja los mensajes entrantes o actualizaciones de conexión según corresponda. Devuelve un estado en formato JSON indicando el resultado del procesamiento del evento. Maneja errores y devuelve un mensaje de error si no se puede procesar el evento.
export async function POST(req: Request) {
	let eventId: string | undefined;

	try {
		// Obtiene el payload del webhook y registra el evento recibido en el servicio de eventos de webhook. Se guarda el ID del evento para poder marcarlo como procesado o con error más adelante.
		const payload = await req.json();
		const event = await webhookEventService.recordReceived(payload);
		eventId = event.id; 
		// Valida el payload del webhook y determina el tipo de evento recibido. Si es una actualización de conexión o código QR, se aplica la actualización correspondiente a la instancia de WhatsApp. Si es un mensaje entrante, se maneja el mensaje a través del servicio de chat.
		const body = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
		const eventType = typeof body.event === 'string' ? body.event.toLowerCase().replace(/_/g, '.') : '';
		const instanceName = typeof body.instance === 'string' ? body.instance : '';
		// Maneja eventos de actualización de conexión y código QR, aplicando las actualizaciones a la instancia de WhatsApp y marcando el evento como procesado. Si es un mensaje entrante, se maneja a través del servicio de chat y se marca el evento como procesado.
		if (eventType === 'connection.update' && instanceName) {
			await instanceService.applyConnectionUpdate(instanceName, body.data);
			await webhookEventService.markProcessed(event.id, 'processed');
			return NextResponse.json({ status: 'connection_updated' });
		}
		// Maneja eventos de actualización de código QR, aplicando la actualización a la instancia de WhatsApp y marcando el evento como procesado. Devuelve un estado indicando que el código QR ha sido actualizado.
		if (eventType === 'qrcode.updated' && instanceName) {
			await instanceService.applyQrCodeUpdate(instanceName, body.data);
			await webhookEventService.markProcessed(event.id, 'processed');
			return NextResponse.json({ status: 'qr_updated' });
		}
		// Valida y maneja eventos de mensajes entrantes. Si el evento no es un mensaje, se marca como ignorado. Si es un mensaje, se maneja a través del servicio de chat y se marca como procesado. Devuelve el resultado del manejo del mensaje en formato JSON.
		const parsed = parseEvolutionWebhook(payload);
		if (parsed.status !== 'message') {
			await webhookEventService.markProcessed(event.id, 'ignored');
			return NextResponse.json({ status: parsed.status });
		}
		// Maneja el mensaje entrante a través del servicio de chat y marca el evento como procesado. Devuelve el resultado del manejo del mensaje en formato JSON.
		const result = await chatService.handleIncomingMessage({ ...parsed.data, webhookEventId: event.id });
		await webhookEventService.markProcessed(event.id, 'processed'); // was missing entirely
		return NextResponse.json(result);
	} catch (error) {
		// Maneja errores durante el procesamiento del webhook. Registra el error en la consola y marca el evento como procesado con error si se pudo obtener el ID del evento. Devuelve un estado de error en formato JSON.
		console.error('Error procesando webhook de Evolution API:', error instanceof Error ? error.message : 'Error desconocido');
		if (eventId) {
			await webhookEventService.markProcessed(eventId, 'error', error instanceof Error ? error.message : 'Error desconocido');
		}
		// Devuelve un estado de error en formato JSON si ocurre un error durante el procesamiento del webhook.
		return NextResponse.json({ status: 'error' });
	}
}





