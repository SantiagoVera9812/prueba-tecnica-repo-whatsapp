type ChatMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

type OpenRouterResponse = {
	choices?: Array<{ message?: { content?: string } }>;
};

type OpenRouterModelsResponse = {
	data?: Array<{
		id?: string;
		name?: string;
		pricing?: { prompt?: string; completion?: string };
	}>;
};

export class OpenRouterError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
		this.name = 'OpenRouterError';
	}
}

export class OpenRouterClient {
	constructor(
		private readonly apiKey = process.env.OPENROUTER_API_KEY,
		private readonly baseUrl = (process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1').replace(/\/$/, ''),
	) {}

	async chatCompletion(input: { model: string; temperature: number; messages: ChatMessage[] }) {
		if (!this.apiKey) throw new Error('OPENROUTER_API_KEY no está configurada.');

		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			signal: AbortSignal.timeout(30_000),
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
				'HTTP-Referer': process.env.APP_PUBLIC_URL ?? 'http://localhost:3000',
				'X-Title': 'WhatsApp Bot',
			},
			body: JSON.stringify(input),
		});

		if (!response.ok) {
			const errorBody = await response.json().catch(() => null) as {
				error?: { message?: string };
			} | null;
			const providerMessage = errorBody?.error?.message;
			throw new OpenRouterError(providerMessage
				? `OpenRouter respondió con HTTP ${response.status}: ${providerMessage}`
				: `OpenRouter respondió con HTTP ${response.status}.`, response.status);
		}

		const data = await response.json() as OpenRouterResponse;
		const content = data.choices?.[0]?.message?.content;
		if (typeof content !== 'string' || !content.trim()) throw new Error('OpenRouter no devolvió contenido.');
		return content;
	}

	async listFreeModels() {
		if (!this.apiKey) throw new Error('OPENROUTER_API_KEY no está configurada.');

		const response = await fetch(`${this.baseUrl}/models`, {
			signal: AbortSignal.timeout(15_000),
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				'HTTP-Referer': process.env.APP_PUBLIC_URL ?? 'http://localhost:3000',
				'X-Title': 'WhatsApp Bot',
			},
		});

		if (!response.ok) {
			throw new OpenRouterError(`OpenRouter respondió con HTTP ${response.status} al listar modelos.`, response.status);
		}

		const data = await response.json() as OpenRouterModelsResponse;
		return (data.data ?? [])
			.filter((model) => model.id?.endsWith(':free'))
			.filter((model): model is { id: string; name?: string } => typeof model.id === 'string')
			.map((model) => ({ id: model.id, name: model.name ?? model.id }))
			.sort((left, right) => left.name.localeCompare(right.name));
	}
}
