'use client';

import { useEffect, useState } from 'react';
import { getFreeModels } from '@/lib/api-client/models-client';
import type { OpenRouterModel } from '@/lib/types/openrouter';

type AsyncState<T> =
	| { status: 'loading' }
	| { status: 'error'; error: string }
	| { status: 'success'; data: T };


//Hook personalizado para manejar la carga de los modelos disponibles que trae Open Router de manera gratis. Esto incluye el estado de carga y los errores.
export function useModels() {
	// Estado inicial del hook, comenzando en 'loading' mientras se cargan los modelos.
	const [state, setState] = useState<AsyncState<OpenRouterModel[]>>({ status: 'loading' });

	// Efecto para cargar los modelos disponibles desde Open Router cuando el componente se monta, manejando el estado de carga y los errores.
	useEffect(() => {
		let active = true;
		// Llama a la función getFreeModels para obtener los modelos gratuitos disponibles y actualiza el estado del hook según el resultado de la llamada.
		getFreeModels()
			.then((data) => {
				if (active) setState({ status: 'success', data });
			})
			.catch((error) => {
				if (active) setState({ status: 'error', error: error instanceof Error ? error.message : 'No se pudieron cargar los modelos disponibles.' });
			});

		return () => {
			active = false;
		};
	}, []);

	return state;
}