export type IncomingMessage = {
	instance: string;
	phoneNumber: string;
	text: string;
};

export type WebhookParseResult =
	| { status: 'ignored_event' }
	| { status: 'ignored_self_message' }
	| { status: 'no_text_content' }
	| { status: 'message'; data: IncomingMessage };

export function parseEvolutionWebhook(value: unknown): WebhookParseResult {
	if (!value || typeof value !== 'object') return { status: 'ignored_event' };

	const body = value as Record<string, unknown>;
	if (body.event !== 'messages.upsert' || !body.data || typeof body.data !== 'object') {
		return { status: 'ignored_event' };
	}

	const data = body.data as Record<string, unknown>;
	const key = data.key && typeof data.key === 'object' ? data.key as Record<string, unknown> : null;
	if (key?.fromMe || typeof key?.remoteJid !== 'string') {
		return { status: 'ignored_self_message' };
	}

	const message = data.message && typeof data.message === 'object' ? data.message as Record<string, unknown> : null;
	const text = typeof message?.conversation === 'string'
		? message.conversation
		: typeof message?.extendedTextMessage === 'object' && message.extendedTextMessage !== null
			? ((message.extendedTextMessage as Record<string, unknown>).text as string | undefined)
			: undefined;

	if (!text) return { status: 'no_text_content' };

	const instance = typeof body.instance === 'string' ? body.instance : '';
	if (!instance) return { status: 'ignored_event' };

	return {
		status: 'message',
		data: {
			instance,
			phoneNumber: key.remoteJid.split('@')[0],
			text,
		},
	};
}
