import { botConfigService } from '@/services/bot-config.service';
import { EvolutionClient } from '@/infrastructure/evolution/evolution.client';
import { OpenRouterClient, OpenRouterError } from '@/infrastructure/openrouter/openrouter.client';
import type { IncomingMessage } from '@/lib/validation/webhook';
import { ContactRepository } from '@/repositories/contact.repository';
import { ConversationRepository } from '@/repositories/conversation.repository';
import { MessageRepository } from '@/repositories/message.repository';
import { WebhookEventService } from '@/services/webhook-event.service';

const busyServiceMessage = 'El servicio está ocupado. Inténtalo de nuevo en unos minutos.';
// Servicio para manejar la lógica de chat, incluyendo la recepción de mensajes entrantes, la generación de respuestas utilizando OpenRouter y la gestión de conversaciones y mensajes en la base de datos. También maneja errores y envía mensajes de fallback si el servicio está ocupado.
export class ChatService {
	constructor(
		private readonly openRouter = new OpenRouterClient(),
		private readonly evolution = new EvolutionClient(),
		private readonly contacts = new ContactRepository(),
		private readonly conversations = new ConversationRepository(),
		private readonly messages = new MessageRepository(),
		private readonly webhookEvents = new WebhookEventService(),
	) {}
	// Maneja un mensaje entrante de WhatsApp. Obtiene la configuración del bot, crea o recupera el contacto y la conversación correspondiente, guarda el mensaje del usuario, genera una respuesta utilizando OpenRouter y envía la respuesta al usuario. Actualiza el estado del mensaje del asistente y marca el evento de webhook como procesado. Maneja errores y envía un mensaje de fallback si el servicio está ocupado.
	async handleIncomingMessage(message: IncomingMessage & { webhookEventId?: string }) {
		let assistantMessageId: string | undefined;
		try {
			// Obtiene la configuración del bot, crea o recupera el contacto y la conversación correspondiente, guarda el mensaje del usuario, genera una respuesta utilizando OpenRouter y envía la respuesta al usuario
			const config = await botConfigService.getConfig();
			const contact = await this.contacts.getOrCreate({ phoneNumber: message.phoneNumber, pushName: message.pushName });
			const conversation = await this.conversations.getOrCreate({ contactId: contact.id, botConfigId: config.id });
			const history = await this.conversations.getRecentMessages(conversation.id);
			await this.messages.create({ conversationId: conversation.id, role: 'user', content: message.text });
			// Genera una respuesta utilizando OpenRouter y envía la respuesta al usuario.
			const reply = await this.openRouter.chatCompletion({
				model: config.model,
				temperature: config.temperature,
				maxTokens: config.maxTokens,
				messages: [
					{ role: 'system', content: config.prompt },
					...history.reverse().map((item) => ({ role: item.role as 'user' | 'assistant', content: item.content })),
					{ role: 'user', content: message.text },
				],
			});
			// Guarda el mensaje del asistente, envía la respuesta al usuario y marca el evento de webhook como procesado.
			const assistantMessage = await this.messages.create({ conversationId: conversation.id, role: 'assistant', content: reply, modelUsed: config.model, status: 'pending' });
			assistantMessageId = assistantMessage.id;
			await this.evolution.sendText({
				instance: message.instance,
				phoneNumber: message.phoneNumber,
				text: reply,
			});
			await this.messages.updateStatus(assistantMessage.id, 'sent');
			if (message.webhookEventId) await this.webhookEvents.markProcessed(message.webhookEventId, 'processed');

			return { status: 'processed' as const };
		} catch (error) {
			// Maneja errores durante el procesamiento del mensaje. Actualiza el estado del mensaje del asistente a "failed", marca el evento de webhook como procesado con error y registra el error en la consola. Si el error es un OpenRouterError con estado 429, envía un mensaje de fallback al usuario indicando que el servicio está ocupado.
			if (assistantMessageId) await this.messages.updateStatus(assistantMessageId, 'failed').catch(() => undefined);
			if (message.webhookEventId) await this.webhookEvents.markProcessed(message.webhookEventId, 'error', error instanceof Error ? error.message : 'Error desconocido').catch(() => undefined);
			console.error('Error procesando mensaje de WhatsApp:', error instanceof Error ? error.message : 'Error desconocido');
			// Si el error es un OpenRouterError con estado 429, envía un mensaje de fallback al usuario indicando que el servicio está ocupado.
			if (error instanceof OpenRouterError && error.status === 429) {
				try {
					await this.evolution.sendText({
						instance: message.instance,
						phoneNumber: message.phoneNumber,
						text: busyServiceMessage,
					});
				} catch (fallbackError) {
					console.error('No se pudo enviar el mensaje de fallback:', fallbackError instanceof Error ? fallbackError.message : 'Error desconocido');
				}
			}

			return { status: 'processed_with_error' as const };
		}
	}
}

export const chatService = new ChatService();
