export class EvolutionClient {
	constructor(
		private readonly apiKey = process.env.EVOLUTION_API_KEY,
		private readonly baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, ''),
	) {}

	async sendText(input: { instance: string; phoneNumber: string; text: string }) {
		if (!this.apiKey || !this.baseUrl) throw new Error('La configuración de Evolution API está incompleta.');

		const response = await fetch(`${this.baseUrl}/message/sendText/${encodeURIComponent(input.instance)}`, {
			method: 'POST',
			signal: AbortSignal.timeout(30_000),
			headers: { 'Content-Type': 'application/json', apikey: this.apiKey },
			body: JSON.stringify({ number: input.phoneNumber, text: input.text, delay: 1000 }),
		});

		if (!response.ok) throw new Error(`Evolution API respondió con HTTP ${response.status}.`);
	}
}
