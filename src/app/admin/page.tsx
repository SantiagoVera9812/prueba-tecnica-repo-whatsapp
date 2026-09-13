'use client';

import { BotConfigForm } from '@/components/bot-config/BotConfigForm';
import { BotConfigSkeleton } from '@/components/bot-config/BotConfigSkeleton';
import { useBotConfig } from '@/hooks/useBotConfig';
import { useModels } from '@/hooks/useModels';
import { ResetInstanceButton } from '@/components/instance/ResetInstanceButton';


//Pagina principal de la aplicacion, donde se configura el bot y se puede desvincular el dispositivo actual para vincular otro.
export default function AdminPage() {
	const { state, saving, save } = useBotConfig();
	const modelsState = useModels();

	if (state.status === 'loading') return <BotConfigSkeleton />;
	if (state.status === 'error') return <main className="admin-shell"><p>{state.error}</p></main>;

	return (
		<main className="admin-shell">
			<section className="admin-panel">
				<p className="eyebrow">WhatsApp AI / Control center</p>
				<h1>Configura tu chatbot</h1>
				<p className="intro">Estos valores se aplican al siguiente mensaje recibido por Evolution API.</p>

				<BotConfigForm
					config={state.data}
					saving={saving}
					onSave={save}
					models={modelsState.status === 'success' ? modelsState.data : []}
					modelsLoading={modelsState.status === 'loading'}
					modelsError={modelsState.status === 'error' ? modelsState.error : undefined}
				/>
				<ResetInstanceButton />
			</section>
		</main>
	);
}
