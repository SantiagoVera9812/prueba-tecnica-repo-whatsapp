import { NextResponse } from 'next/server';
import { instanceService } from '@/services/instance.service';

export const dynamic = 'force-dynamic';
// app/api/instance/connect/route.ts
// POST: Inicia la conexión de la instancia de WhatsApp. Llama al servicio instanceService para iniciar la conexión y devuelve el estado de la conexión en formato JSON. Maneja errores y devuelve un mensaje de error si no se puede iniciar la conexión.
export async function POST() {
	try {
		return NextResponse.json(await instanceService.startConnection());
	} catch (error) {
		console.error('Error iniciando conexión de WhatsApp:', error instanceof Error ? error.message : 'Error desconocido');
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'No se pudo iniciar la conexión.' },
			{ status: 502 },
		);
	}
}