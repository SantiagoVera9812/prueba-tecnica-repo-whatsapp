import { NextResponse } from 'next/server';
import { chatService } from '@/services/chat.service';
import { parseEvolutionWebhook } from '@/lib/validation/webhook';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
	try {
		const parsed = parseEvolutionWebhook(await req.json());
		if (parsed.status !== 'message') return NextResponse.json({ status: parsed.status });

		return NextResponse.json(await chatService.handleIncomingMessage(parsed.data));
	} catch (error) {
		console.error('Error leyendo webhook de Evolution API:', error instanceof Error ? error.message : 'Error desconocido');
		return NextResponse.json({ status: 'invalid_payload' });
	}
}
