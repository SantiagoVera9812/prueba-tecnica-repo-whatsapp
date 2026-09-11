import { botConfigService } from '@/services/bot-config.service';
import { EvolutionClient } from '@/infrastructure/evolution/evolution.client';
import { OpenRouterClient, OpenRouterError } from '@/infrastructure/openrouter/openrouter.client';
import type { IncomingMessage } from '@/lib/validation/webhook';

const busyServiceMessage = 'El servicio está ocupado. Inténtalo de nuevo en unos minutos.';

export class ChatService {
	constructor(
		private readonly openRouter = new OpenRouterClient(),
		private readonly evolution = new EvolutionClient(),
	) {}

	async handleIncomingMessage(message: IncomingMessage) {
		try {
			const config = await botConfigService.getConfig();
			const reply = await this.openRouter.chatCompletion({
				model: config.model,
				temperature: config.temperature,
				messages: [
					{ role: 'system', content: config.prompt },
					{ role: 'user', content: message.text },
				],
			});

			await this.evolution.sendText({
				instance: message.instance,
				phoneNumber: message.phoneNumber,
				text: reply,
			});

			return { status: 'processed' as const };
		} catch (error) {
			console.error('Error procesando mensaje de WhatsApp:', error instanceof Error ? error.message : 'Error desconocido');

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
