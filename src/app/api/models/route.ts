import { NextResponse } from 'next/server';
import { modelsService } from '@/services/models.service';

export const dynamic = 'force-dynamic';

// app/api/models/route.ts
// GET: Devuelve la lista de modelos gratuitos disponibles para el bot. Llama al servicio modelsService para obtener los modelos y devuelve la lista en formato JSON. Maneja errores y devuelve un mensaje de error si no se pueden cargar los modelos.
export async function GET() {
	try {
		return NextResponse.json(await modelsService.getFreeModels());
	} catch (error) {
		console.error('Error cargando modelos de OpenRouter:', error instanceof Error ? error.message : 'Error desconocido');
		return NextResponse.json({ error: 'No se pudieron cargar los modelos disponibles.' }, { status: 502 });
	}
}