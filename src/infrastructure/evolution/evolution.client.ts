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

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(`Evolution API respondió con HTTP ${response.status}: ${errorBody.slice(0, 500)}`);
		}
	}

	async createInstance() {
		try {
			await this.request('/instance/create', {
				method: 'POST',
				body: JSON.stringify({
					instanceName: this.instanceName,
					integration: 'WHATSAPP-BAILEYS',
					qrcode: true,
					webhook: { url: this.webhookUrl, enabled: true, events: ['MESSAGES_UPSERT', 'QRCODE_UPDATED', 'CONNECTION_UPDATE'] },
				}),
			});
		} catch (error) {
			if (!this.isInstanceAlreadyExistsError(error)) throw error;
		}
	}

	async deleteInstance(): Promise<{ alreadyClosed: boolean }> {
	try {
		await this.request(`/instance/logout/${encodeURIComponent(this.instanceName)}`, { method: 'DELETE' });
		return { alreadyClosed: false }; 
	} catch (error) {
		if (this.isLogoutUnnecessaryError(error)) return { alreadyClosed: true }; 
		throw error; 
	}
}

	private isLogoutUnnecessaryError(error: unknown): boolean {
		const status = (error as Error & { status?: number }).status;
		const message = error instanceof Error ? error.message.toLowerCase() : '';
		const mentionsMissing = message.includes('does not exist') || message.includes('no existe');
		const mentionsNotConnected = message.includes('is not connected') || message.includes('no está conectada');
		return status === 404 || (status === 400 && (mentionsMissing || mentionsNotConnected));
	}


	private isInstanceAlreadyExistsError(error: unknown): boolean {
		const status = (error as Error & { status?: number }).status;
		const message = error instanceof Error ? error.message.toLowerCase() : '';
		const mentionsAlreadyExists = message.includes('already in use') || message.includes('ya está en uso') || message.includes('already exists');
		return (status === 400 || status === 403 || status === 409) && mentionsAlreadyExists;
	}

	async connectInstance() {
		return this.request(`/instance/connect/${encodeURIComponent(this.instanceName)}`);
	}

	async getConnectionState() {
		return this.request(`/instance/connectionState/${encodeURIComponent(this.instanceName)}`);
	}

	private get instanceName() {
		return process.env.EVOLUTION_INSTANCE_NAME ?? 'whatsapp-bot';
	}

	private get webhookUrl() {
		return process.env.APP_PUBLIC_WEBHOOK_URL ?? 'http://app:3000/api/webhook/evolution';
	}

	getInstanceConfig() {
		if (!this.apiKey || !this.baseUrl) throw new Error('La configuración de Evolution API está incompleta.');
		return {
			instanceName: this.instanceName,
			evolutionApiUrl: this.baseUrl,
			evolutionApiKey: this.apiKey,
			webhookUrl: this.webhookUrl,
		};
	}

	private async request(path: string, init?: RequestInit) {
		if (!this.apiKey || !this.baseUrl) throw new Error('La configuración de Evolution API está incompleta.');

		const response = await fetch(`${this.baseUrl}${path}`, {
			...init,
			signal: AbortSignal.timeout(15_000),
			headers: { 'Content-Type': 'application/json', apikey: this.apiKey, ...init?.headers },
		});
		const data = await response.json().catch(() => null);

		if (!response.ok) {
			const message = data && typeof data === 'object' && 'message' in data
				? String(data.message)
				: data
					? JSON.stringify(data)
					: `HTTP ${response.status}`;
			const error = new Error(`Evolution API respondió con ${message}.`) as Error & { status?: number };
			error.status = response.status;
			throw error;
		}

		return data as Record<string, unknown>;
	}

	async getConnection(existingQr: string | null = null) {
	await this.createInstance();
	const existingState = await this.getConnectionState();
	const existingConnectionState = this.extractState(existingState);
	if (existingConnectionState === 'open') return { state: existingConnectionState, qr: null };
	if (existingQr && existingConnectionState && existingConnectionState !== 'open') {
		return { state: existingConnectionState, qr: existingQr };
	}

	const data = await this.connectInstance();
	const connection = await this.getConnectionState();
	const state = this.extractState(connection);
	const qr = this.extractQrFromConnectResponse(data);

	if (!state) {
		
		throw new Error(`Evolution API no devolvió un estado de conexión reconocible tras conectar: ${JSON.stringify(connection)}`);
	}

	if (!qr && state !== 'open') {
		console.warn('[EvolutionClient] /instance/connect no trajo un campo de QR reconocible:', JSON.stringify(data));
	}

	return { state, qr };
}

private extractState(response: Record<string, unknown>): string | null {
	const instance = response.instance;
	if (instance && typeof instance === 'object' && typeof (instance as Record<string, unknown>).state === 'string') {
		return (instance as Record<string, unknown>).state as string;
	}
	return typeof response.state === 'string' ? response.state : null;
}

private extractQrFromConnectResponse(response: Record<string, unknown>): string | null {
	if (typeof response.base64 === 'string') return response.base64;
	const qrcode = response.qrcode;
	if (qrcode && typeof qrcode === 'object') {
		const base64 = (qrcode as Record<string, unknown>).base64;
		if (typeof base64 === 'string') return base64;
	}
	return null;
}
}
