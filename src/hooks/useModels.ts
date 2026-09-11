'use client';

import { useEffect, useState } from 'react';
import { getFreeModels } from '@/lib/api-client/models-client';
import type { OpenRouterModel } from '@/lib/types/openrouter';

type AsyncState<T> =
	| { status: 'loading' }
	| { status: 'error'; error: string }
	| { status: 'success'; data: T };

export function useModels() {
	const [state, setState] = useState<AsyncState<OpenRouterModel[]>>({ status: 'loading' });

	useEffect(() => {
		let active = true;

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