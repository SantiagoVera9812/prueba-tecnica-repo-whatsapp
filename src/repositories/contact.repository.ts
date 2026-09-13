import { db } from '@/lib/db';
// Repositorio para manejar los contactos en la base de datos. Proporciona métodos para obtener o crear contactos.
export class ContactRepository {
	getOrCreate(input: { phoneNumber: string; pushName?: string }) {
		return db.contact.upsert({
			where: { phoneNumber: input.phoneNumber },
			update: { lastSeenAt: new Date(), ...(input.pushName ? { pushName: input.pushName } : {}) },
			create: { phoneNumber: input.phoneNumber, pushName: input.pushName },
		});
	}
}