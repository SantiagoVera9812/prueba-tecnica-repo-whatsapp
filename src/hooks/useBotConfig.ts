'use client';

import { useEffect, useState } from 'react';
import { getBotConfig, saveBotConfig, type BotConfig } from '@/lib/api-client/config-client';
import type { BotConfigInput } from '@/lib/types/bot-config';

type AsyncState<T> =
	| { status: 'loading' }
	| { status: 'error'; error: string }
	| { status: 'success'; data: T };

export function useBotConfig() {
	const [state, setState] = useState<AsyncState<BotConfig>>({ status: 'loading' });
	const [saving, setSaving] = useState(false);

	async function refresh() {
		setState({ status: 'loading' });
		try {
			setState({ status: 'success', data: await getBotConfig() });
		} catch (error) {
			setState({ status: 'error', error: error instanceof Error ? error.message : 'No se pudo cargar la configuración.' });
		}
	}

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
