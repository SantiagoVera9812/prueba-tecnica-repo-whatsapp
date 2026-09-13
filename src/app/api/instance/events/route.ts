// app/api/instance/events/route.ts
import { instanceService } from '@/services/instance.service';
import type { InstanceConnection } from '@/lib/types/instance';

export const dynamic = 'force-dynamic';

const DISCONNECT_RECHECK_MS = 20_000000000; 
// app/api/instance/events/route.ts
// GET: Devuelve un flujo de eventos del estado de la conexión de la instancia de WhatsApp. Envía actualizaciones en tiempo real sobre el estado de la conexión y el código QR (si está disponible) a los clientes suscritos. Maneja la reconexión automática si la instancia entra en estado "disconnecting" y envía latidos para mantener la conexión abierta.
export async function GET(request: Request) {
	const encoder = new TextEncoder();
    // Crea un flujo de datos que envía actualizaciones en tiempo real sobre el estado de la conexión de la instancia de WhatsApp.
	const stream = new ReadableStream({
		// Función asincrónica para iniciar el flujo de eventos. Envía el estado inicial de la conexión y se suscribe a las actualizaciones del estado de la instancia. Maneja la reconexión automática y los latidos para mantener la conexión abierta.
        async start(controller) {
			let closed = false;
			let selfHealTimer: ReturnType<typeof setTimeout> | undefined;
			let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
            // Función para enviar el estado de la conexión al cliente suscrito. Codifica el estado como JSON y lo envía a través del flujo de eventos.
			function send(connection: InstanceConnection) {
				if (closed) return;
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(connection)}\n\n`));
			}
            // Función para programar una verificación de auto-reparación si la instancia entra en estado "disconnecting". Si después de un tiempo la instancia sigue en ese estado, se obtiene el estado más reciente y se envía al cliente.
			function scheduleSelfHealCheck(connection: InstanceConnection) {
				if (selfHealTimer) clearTimeout(selfHealTimer);
				if (connection.state !== 'disconnecting') return;

				selfHealTimer = setTimeout(async () => {
					const fresh = await instanceService.getStatus();
					send(fresh);
					scheduleSelfHealCheck(fresh);
				}, DISCONNECT_RECHECK_MS);
			}
            // Obtiene el estado inicial de la conexión de la instancia y lo envía al cliente. Luego se suscribe a las actualizaciones del estado de la instancia y envía cada actualización al cliente. También programa verificaciones de auto-reparación si es necesario.
			const initial = await instanceService.getStatus();
			send(initial);
			scheduleSelfHealCheck(initial);
            // Se suscribe a las actualizaciones del estado de la instancia y envía cada actualización al cliente. También programa verificaciones de auto-reparación si es necesario.
			const unsubscribe = instanceService.subscribeToUpdates((connection) => {
				send(connection);
				scheduleSelfHealCheck(connection);
			});
            // Envía latidos cada 15 segundos para mantener la conexión abierta y evitar que se cierre por inactividad.
			heartbeatTimer = setInterval(() => {
				if (!closed) controller.enqueue(encoder.encode(': ping\n\n'));
			}, 15_000);
            // Maneja la cancelación de la solicitud por parte del cliente. Si el cliente cierra la conexión, se limpia el temporizador de auto-reparación y el temporizador de latidos, se cancela la suscripción a las actualizaciones y se cierra el flujo de eventos.
			request.signal.addEventListener('abort', () => {
				closed = true;
				if (selfHealTimer) clearTimeout(selfHealTimer);
				if (heartbeatTimer) clearInterval(heartbeatTimer);
				unsubscribe();
				controller.close();
			});
		},
	});
    // Devuelve la respuesta con el flujo de eventos, estableciendo los encabezados adecuados para indicar que es un flujo de eventos y que no debe almacenarse en caché.
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
		},
	});
}