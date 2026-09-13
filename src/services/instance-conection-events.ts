// services/instance-connection-events.ts
import { EventEmitter } from 'node:events';
import type { InstanceConnection } from '@/lib/types/instance';

// Clase para manejar eventos de conexión de la instancia de WhatsApp. Permite publicar actualizaciones de estado de conexión y suscribirse a estos eventos.
class InstanceConnectionEvents extends EventEmitter {
	// Publica un evento de actualización de conexión con el estado de conexión proporcionado.
    publish(connection: InstanceConnection) {
		this.emit('update', connection);
	}
    // Permite suscribirse a eventos de actualización de conexión. Devuelve una función para cancelar la suscripción.
	subscribe(listener: (connection: InstanceConnection) => void): () => void {
		this.on('update', listener);
		return () => this.off('update', listener);
	}
}

export const instanceEvents = new InstanceConnectionEvents();