// services/instance.service.ts
import { EvolutionClient } from '@/infrastructure/evolution/evolution.client';
import { WhatsAppInstanceRepository } from '@/repositories/whatsapp-instance.repository';

import type { InstanceConnection } from '@/lib/types/instance';
import { instanceEvents } from './instance-conection-events';
//Función para extraer el estado de conexión de la instancia desde los datos recibidos. Devuelve el estado como una cadena o null si no se puede extraer.
function extractConnectionState(data: unknown): string | null {
	if (!data || typeof data !== 'object') return null;
	const state = (data as Record<string, unknown>).state;
	return typeof state === 'string' ? state : null;
}
//Función para extraer el código QR en base64 desde los datos recibidos. Devuelve el código QR como una cadena o null si no se puede extraer.
function extractQrBase64(data: unknown): string | null {
	if (!data || typeof data !== 'object') return null;
	const record = data as Record<string, unknown>;
	if (typeof record.base64 === 'string') return record.base64;
	const nested = record.qrcode;
	if (nested && typeof nested === 'object' && typeof (nested as Record<string, unknown>).base64 === 'string') {
		return (nested as Record<string, unknown>).base64 as string;
	}
	return null;
}
// Clase para manejar la conexión de la instancia de WhatsApp, incluyendo la obtención del estado de la conexión, el inicio de la conexión, la eliminación de la instancia y la aplicación de actualizaciones de estado y código QR. Utiliza un EventEmitter para publicar actualizaciones de estado y permite suscribirse a estos eventos.
export class InstanceService {
	private static readonly DISCONNECT_TIMEOUT_MS = 20_000000000;
	
	private operationChain: Promise<unknown> = Promise.resolve();

	constructor(
		private readonly evolution = new EvolutionClient(),
		private readonly repository = new WhatsAppInstanceRepository(),
	) {}
	// Función para ejecutar una operación de manera exclusiva, asegurando que no se ejecuten operaciones concurrentes. Devuelve una promesa que se resuelve con el resultado de la operación.
	private runExclusive<T>(operation: () => Promise<T>): Promise<T> {
		const result = this.operationChain.then(operation, operation);
		this.operationChain = result.catch(() => {});
		return result;
	}
	// Función privada para persistir el estado de la conexión en el repositorio y publicar una actualización de estado a través del EventEmitter. Devuelve la conexión actualizada.
	private async persistAndBroadcast(
		input: Parameters<WhatsAppInstanceRepository['upsert']>[0],
	): Promise<InstanceConnection> {
		const updated = await this.repository.upsert(input);
		const connection: InstanceConnection = {
			state: (updated.status as InstanceConnection['state']) ?? 'close',
			qr: updated.status === 'open' ? null : updated.qrCode ?? null,
		};
		instanceEvents.publish(connection);
		return connection;
	}
	// Función para obtener el estado actual de la conexión de la instancia de WhatsApp. Si la instancia está en estado "disconnecting" y ha pasado un tiempo desde la última actualización, se considera que la conexión está cerrada. Devuelve el estado de la conexión y el código QR si está disponible.
	async getStatus(): Promise<InstanceConnection> {
		const config = this.evolution.getInstanceConfig();
		const stored = await this.repository.findByName(config.instanceName);

		if (stored?.status === 'disconnecting') {
			const elapsedMs = Date.now() - stored.updatedAt.getTime();
			if (elapsedMs > InstanceService.DISCONNECT_TIMEOUT_MS) {
				
				return this.persistAndBroadcast({ ...config, status: 'close', qrCode: null, connectedAt: null });
			}
		}

		const state = (stored?.status as InstanceConnection['state']) ?? 'close';
		return { state, qr: state === 'open' ? null : stored?.qrCode ?? null };
	}
	// Función para suscribirse a actualizaciones del estado de la conexión de la instancia de WhatsApp. Toma un listener que se llama con cada actualización de conexión y devuelve una función para cancelar la suscripción.
	subscribeToUpdates(listener: (connection: InstanceConnection) => void): () => void {
		return instanceEvents.subscribe(listener);
	}
	// Función para iniciar la conexión de la instancia de WhatsApp. Asegura que solo se ejecute una operación de inicio a la vez y devuelve la conexión actualizada.
	async startConnection() {
		return this.runExclusive(() => this.startConnectionOnce());
	}
	// Función privada para iniciar la conexión de la instancia de WhatsApp una sola vez. Obtiene la configuración de la instancia, busca el estado almacenado y obtiene la conexión actual desde el cliente de Evolution. Luego persiste y publica el estado actualizado de la conexión.
	private async startConnectionOnce() {
		const config = this.evolution.getInstanceConfig();
		const stored = await this.repository.findByName(config.instanceName);
		const connection = await this.evolution.getConnection(stored?.qrCode ?? null);
		return this.persistAndBroadcast({
			...config,
			status: connection.state,
			qrCode: connection.state === 'open' ? null : connection.qr,
			connectedAt: connection.state === 'open' ? new Date() : null,
		});
	}
	// Función para eliminar la instancia de WhatsApp. Asegura que solo se ejecute una operación de eliminación a la vez y devuelve un objeto indicando si la eliminación está pendiente. Actualiza el estado de la conexión a "disconnecting" o "close" según corresponda y publica la actualización.
	async deleteInstance(): Promise<{ pending: boolean }> {
		return this.runExclusive(async () => {
			const config = this.evolution.getInstanceConfig();
			let alreadyClosed = false;

			try {
				const result = await this.evolution.deleteInstance();
				alreadyClosed = result.alreadyClosed;
			} catch (error) {
				console.warn('[InstanceService] Evolution no confirmó la solicitud de logout:', error instanceof Error ? error.message : error);
			}

			await this.persistAndBroadcast({
				...config,
				status: alreadyClosed ? 'close' : 'disconnecting',
				qrCode: null,
				connectedAt: null,
			});

			return { pending: !alreadyClosed };
		});
	}
	// Función para aplicar una actualización de estado de conexión recibida desde el webhook de Evolution. Si el nombre de la instancia coincide con la configuración actual, extrae el estado de conexión y persiste y publica la actualización correspondiente.
	async applyConnectionUpdate(instanceName: string, data: unknown) {
		const config = this.evolution.getInstanceConfig();
		if (instanceName !== config.instanceName) return;

		const state = extractConnectionState(data);
		if (!state) return;

		const isOpen = state === 'open';
		const isClosed = state === 'close' || state === 'refused';

		await this.persistAndBroadcast({
			...config,
			status: isClosed ? 'close' : state,
			qrCode: isOpen ? null : undefined,
			connectedAt: isOpen ? new Date() : null,
		});
	}

	// Función para aplicar una actualización de código QR recibida desde el webhook de Evolution. Si el nombre de la instancia coincide con la configuración actual, extrae el código QR en base64 y persiste y publica la actualización correspondiente.
	async applyQrCodeUpdate(instanceName: string, data: unknown) {
		const config = this.evolution.getInstanceConfig();
		if (instanceName !== config.instanceName) return;

		const base64 = extractQrBase64(data);
		if (!base64) return;

		await this.persistAndBroadcast({ ...config, status: 'connecting', qrCode: base64 });
	}
}

export const instanceService = new InstanceService();