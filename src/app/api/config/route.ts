import { NextResponse } from 'next/server';
import { botConfigService } from '@/services/bot-config.service';
import { parseBotConfigInput } from '@/lib/validation/bot-config';

export const dynamic = 'force-dynamic';

export async function GET() {
	return NextResponse.json(await botConfigService.getConfig());
}

export async function PUT(req: Request) {
	try {
		const input = parseBotConfigInput(await req.json());

		if (!input) {
			return NextResponse.json(
				{ error: 'Prompt, modelo y una temperatura entre 0 y 2 son obligatorios.' },
				{ status: 400 },
			);
		}

		return NextResponse.json(await botConfigService.saveConfig(input));
	} catch {
		return NextResponse.json({ error: 'No se pudo guardar la configuración.' }, { status: 400 });
	}
}
