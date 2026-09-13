// hooks/useDeleteInstance.ts
'use client';

import { useState } from 'react';
import { deleteInstance } from '@/lib/api-client/instance-management-client';


// Hook personalizado para manejar la eliminación de la instancia de WhatsApp, incluyendo el estado de eliminación y los errores.
export function useDeleteInstance() {
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Función para eliminar la instancia de WhatsApp, manejando el estado de eliminación y los errores.
	async function remove() {
		setDeleting(true);
		setError(null);
		try {
			// Llama a la función deleteInstance para eliminar la instancia y espera su resultado. Esta función es asíncrona y puede lanzar errores, que se capturan en el bloque catch.
			return await deleteInstance(); 
		} catch (error) {
			const message = error instanceof Error ? error.message : 'No se pudo desvincular el dispositivo.';
			setError(message);
			throw error;
		} finally {
			// Independientemente de si la eliminación fue exitosa o fallida, se asegura de que el estado de eliminación se restablezca a false para indicar que la operación ha finalizado.
			setDeleting(false);
		}
	}
	// Retorna el estado de eliminación, cualquier error ocurrido y la función remove para ser utilizada en componentes que necesiten eliminar la instancia.
	return { deleting, error, remove };
}