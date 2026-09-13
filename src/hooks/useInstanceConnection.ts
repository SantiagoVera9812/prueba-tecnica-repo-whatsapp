// hooks/useInstanceConnection.ts
'use client';

import { useEffect, useState } from 'react';
import { startInstanceConnection } from '@/lib/api-client/instance-client';
import type { InstanceConnection } from '@/lib/types/instance';

type AsyncState<T> =
	| { status: 'loading' }
	| { status: 'error'; error: string }
	| { status: 'success'; data: T };

// Hook personalizado para manejar la conexión de la instancia de WhatsApp, incluyendo el estado de la conexión y los errores. Maneja la conexión a través de un EventSource para recibir actualizaciones en tiempo real sobre el estado de la conexión y el código QR.
export function useInstanceConnection() {
	// Estado inicial del hook, comenzando en 'loading' mientras se establece la conexión.
	const [state, setState] = useState<AsyncState<InstanceConnection>>({ status: 'loading' });

	// Efecto para establecer la conexión a la instancia de WhatsApp y manejar los eventos recibidos a través de un EventSource.
	useEffect(() => {
		let active = true;
		let requestedConnect = false; 
		// Función para actualizar el estado de la conexión con los datos recibidos, preservando el código QR anterior si no se proporciona uno nuevo.
		function setConnection(data: InstanceConnection) {
			setState((current) => {
				const previousQr = current.status === 'success' ? current.data.qr : null;
				return { status: 'success', data: { ...data, qr: data.qr ?? previousQr } };
			});
		}
		// Función para iniciar la conexión de la instancia si aún no se ha solicitado y si el estado actual lo permite.
		async function maybeStartConnection(data: InstanceConnection) {
			if (requestedConnect || data.state === 'open' || data.qr || data.state === 'disconnecting') return;
			requestedConnect = true;
			try {
				const started = await startInstanceConnection();
				if (active) setConnection(started);
			} catch (error) {
				if (active) setState({ status: 'error', error: error instanceof Error ? error.message : 'No se pudo iniciar la conexión.' });
			}
		}

		// Establece un EventSource para recibir eventos de la instancia de WhatsApp desde el servidor, manejando los mensajes y errores recibidos.
		const source = new EventSource('/api/instance/events');

		// Maneja los mensajes recibidos del EventSource, actualizando el estado de la conexión y posiblemente iniciando la conexión si es necesario.
		source.onmessage = (event) => {
			if (!active) return;
			try {
				const data = JSON.parse(event.data) as InstanceConnection;
				setConnection(data);
				void maybeStartConnection(data);
			} catch {
				
			}
		};
		// Maneja los errores del EventSource, restableciendo el estado a 'loading' si ocurre un error y el hook sigue activo.
		source.onerror = () => {
			
			if (active) setState((current) => (current.status === 'success' ? current : { status: 'loading' }));
		};

		// Limpia el EventSource y marca el hook como inactivo cuando el componente se desmonta, para evitar actualizaciones de estado en componentes desmontados.
		return () => {
			active = false;
			source.close();
		};
	}, []);
	// Retorna el estado de la conexión de la instancia, incluyendo el estado de carga, éxito o error, y los datos de la conexión si están disponibles.
	return state;
}