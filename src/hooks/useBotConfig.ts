'use client';

import { useEffect, useState } from 'react';
import { getBotConfig, saveBotConfig, type BotConfig } from '@/lib/api-client/config-client';
import type { BotConfigInput } from '@/lib/types/bot-config';

type AsyncState<T> =
	| { status: 'loading' }
	| { status: 'error'; error: string }
	| { status: 'success'; data: T };


//Hook personalizado para manejar la configuración del bot, incluyendo la carga y el guardado de la configuración.
export function useBotConfig() {
	const [state, setState] = useState<AsyncState<BotConfig>>({ status: 'loading' });
	const [saving, setSaving] = useState(false);

	// Función para refrescar la configuración del bot desde el servidor.
	async function refresh() {
		setState({ status: 'loading' });
		try {
			setState({ status: 'success', data: await getBotConfig() });
		} catch (error) {
			setState({ status: 'error', error: error instanceof Error ? error.message : 'No se pudo cargar la configuración.' });
		}
	}

	// Efecto para cargar la configuración del bot al montar el hook.
	useEffect(() => {
		let active = true;

		getBotConfig()
			.then((data) => {
				if (active) setState({ status: 'success', data });
			})
			.catch((error) => {
				if (active) setState({ status: 'error', error: error instanceof Error ? error.message : 'No se pudo cargar la configuración.' });
			});

		return () => {
			active = false;
		};
	}, []);

	// Función para guardar la configuración del bot en el servidor.
	async function save(config: BotConfigInput) {
		setSaving(true);
		try {
			setState({ status: 'success', data: await saveBotConfig(config) });
		} finally {
			setSaving(false);
		}
	}

	return { state, saving, refresh, save };
}
