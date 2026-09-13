import { NextResponse } from 'next/server';
import { instanceService } from '@/services/instance.service';

export const dynamic = 'force-dynamic';


// app/api/instance/route.ts
// DELETE: Elimina la instancia de WhatsApp y desvincula el dispositivo. Llama al servicio instanceService para eliminar la instancia y devuelve un estado de "reset" en formato JSON. Maneja errores y devuelve un mensaje de error si no se puede eliminar la instancia.
export async function DELETE() {
	try {
		const result = await instanceService.deleteInstance();
		return NextResponse.json({ status: 'reset', pending: result.pending });
	} catch (error) {
		console.error('Error eliminando instancia de WhatsApp:', error instanceof Error ? error.message : 'Error desconocido');
		return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo desvincular el dispositivo.' }, { status: 502 });
	}
}