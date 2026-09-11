import { NextResponse } from 'next/server';
import { modelsService } from '@/services/models.service';

export const dynamic = 'force-dynamic';

export async function GET() {
	try {
		return NextResponse.json(await modelsService.getFreeModels());
	} catch (error) {
		console.error('Error cargando modelos de OpenRouter:', error instanceof Error ? error.message : 'Error desconocido');
		return NextResponse.json({ error: 'No se pudieron cargar los modelos disponibles.' }, { status: 502 });
	}
}