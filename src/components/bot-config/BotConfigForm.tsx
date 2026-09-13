'use client';

import { FormEvent, useState } from 'react';
import type { BotConfigInput } from '@/lib/types/bot-config';
import type { OpenRouterModel } from '@/lib/types/openrouter';
import { ModelSelectSkeleton } from '@/components/bot-config/ModelSelectSkeleton';

type Props = {
	config: BotConfigInput;
	saving: boolean;
	onSave: (config: BotConfigInput) => Promise<void>;
	models: OpenRouterModel[];
	modelsLoading: boolean;
	modelsError?: string;
};

// Componente de formulario para configurar el bot, incluyendo el prompt del sistema, el modelo de OpenRouter y la temperatura. Maneja la carga de modelos y los errores.
export function BotConfigForm({ config: initialConfig, saving, onSave, models, modelsLoading, modelsError }: Props) {
	const [config, setConfig] = useState(initialConfig);
	const [message, setMessage] = useState('');

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setMessage('');
		try {
			await onSave(config);
			setMessage('Configuración guardada.');
		} catch (error) {
			setMessage(error instanceof Error ? error.message : 'No se pudo guardar la configuración.');
		}
	}

	return (
		<form onSubmit={handleSubmit}>
			<label htmlFor="prompt">Prompt del sistema</label>
			<textarea id="prompt" rows={7} value={config.prompt} onChange={(event) => setConfig({ ...config, prompt: event.target.value })} required />
			<label htmlFor="model">Modelo de OpenRouter</label>
			{modelsLoading ? <ModelSelectSkeleton /> : (
				<select id="model" value={config.model} onChange={(event) => setConfig({ ...config, model: event.target.value })} required>
					{models.length === 0 && <option value="">No hay modelos gratuitos disponibles</option>}
					{models.length > 0 && !models.some((model) => model.id === config.model) && <option value={config.model}>{config.model}</option>}
					{models.map((model) => <option key={model.id} value={model.id}>{model.name} ({model.id})</option>)}
				</select>
			)}
			{modelsError && <p className="form-message" role="alert">{modelsError}</p>}

			<label htmlFor="temperature">Temperatura: {config.temperature}</label>
			<input id="temperature" type="range" min="0" max="2" step="0.1" value={config.temperature} onChange={(event) => setConfig({ ...config, temperature: Number(event.target.value) })} />

			<button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar configuración'}</button>
			{message && <p className="form-message" role="status">{message}</p>}
		</form>
	);
}
