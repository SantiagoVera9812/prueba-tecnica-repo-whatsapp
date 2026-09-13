import { db } from '@/lib/db';
// Repositorio para manejar las conversaciones en la base de datos. Proporciona métodos para obtener o crear conversaciones y obtener mensajes recientes de una conversación.
export class ConversationRepository {
	async getOrCreate(input: { contactId: string; botConfigId: string }) {
		const conversation = await db.conversation.findFirst({
			where: { contactId: input.contactId, botConfigId: input.botConfigId, status: 'open' },
			orderBy: { updatedAt: 'desc' },
		});

		return conversation ?? db.conversation.create({ data: input });
	}

	getRecentMessages(conversationId: string) {
		return db.message.findMany({
			where: { conversationId, status: { not: 'failed' } },
			orderBy: { createdAt: 'desc' },
			take: 20,
		});
	}
}