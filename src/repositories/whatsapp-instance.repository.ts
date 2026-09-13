import { db } from '@/lib/db';

// Repositorio para manejar la información de la instancia de WhatsApp en la base de datos. Proporciona métodos para buscar y actualizar la información de la instancia.
export class WhatsAppInstanceRepository {
	findByName(instanceName: string) {
		return db.whatsAppInstance.findUnique({ where: { instanceName } });
	}

	upsert(input: {
		instanceName: string;
		evolutionApiUrl: string;
		evolutionApiKey: string;
		status?: string;
		qrCode?: string | null;
		webhookUrl?: string;
		connectedAt?: Date | null;
	}) {
		return db.whatsAppInstance.upsert({
			where: { instanceName: input.instanceName },
			update: {
				evolutionApiUrl: input.evolutionApiUrl,
				evolutionApiKey: input.evolutionApiKey,
				...(input.status ? { status: input.status } : {}),
				...(input.qrCode !== undefined ? { qrCode: input.qrCode } : {}),
				...(input.webhookUrl ? { webhookUrl: input.webhookUrl } : {}),
				...(input.connectedAt !== undefined ? { connectedAt: input.connectedAt } : {}),
			},
			create: {
				instanceName: input.instanceName,
				evolutionApiUrl: input.evolutionApiUrl,
				evolutionApiKey: input.evolutionApiKey,
				status: input.status ?? 'disconnected',
				qrCode: input.qrCode,
				webhookUrl: input.webhookUrl,
				connectedAt: input.connectedAt,
			},
		});
	}
}