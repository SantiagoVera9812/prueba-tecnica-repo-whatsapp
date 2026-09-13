'use client';

import { useDeleteInstance } from '@/hooks/useDeleteInstance';

// Componente de botón para desvincular el dispositivo actual y permitir vincular otro, incluyendo la confirmación del usuario y el manejo de errores.
export function ResetInstanceButton() {
	const { deleting, error, remove } = useDeleteInstance();

	async function handleClick() {
		if (!window.confirm('Se desvinculará el dispositivo actual. Después podrás vincular otro número. ¿Continuar?')) return;
		try {
			await remove();
			window.location.assign('/'); 
		} catch {
			// Capturar el error delegado al hook
		}
	}

	return (
		<div className="instance-reset">
			<button type="button" className="instance-reset-button" onClick={handleClick} disabled={deleting}>
				{deleting ? 'Desvinculando...' : 'Vincular otro dispositivo'}
			</button>
			{error && <p className="form-message" role="alert">{error}</p>}
		</div>
	);
}