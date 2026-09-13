import { db } from '@/lib/db';
// Repositorio para manejar los mensajes en la base de datos. Proporciona métodos para crear y actualizar el estado de los mensajes.
export class MessageRepository {
	create(input: {
		conversationId: string;
		role: string;
		content: string;
		modelUsed?: string;
		status?: string;
	}) {
		return db.message.create({ data: input });
	}

	updateStatus(id: string, status: string) {
		return db.message.update({ where: { id }, data: { status } });
	}
}