'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectionLoading } from '@/components/instance/ConnectionLoading';
import { QrCodeDisplay } from '@/components/instance/QrCodeDisplay';
import { useInstanceConnection } from '@/hooks/useInstanceConnection';

// Componente de página para manejar la conexión de la instancia de WhatsApp, incluyendo la visualización del estado de la conexión, el código QR y los errores. Asi como redirige a la pagina de admin cuando la conexion es exitosa.
export function ConnectionPage() {
	const router = useRouter();
	const state = useInstanceConnection();

	// Redirige a la página de administración si la conexión de la instancia está abierta.
	useEffect(() => {
		if (state.status === 'success' && state.data.state === 'open') router.replace('/admin');
	}, [router, state]);

	// Renderiza diferentes estados de la conexión de la instancia, incluyendo carga, error, visualización del código QR y estado de espera.
	if (state.status === 'loading') return <main className="admin-shell"><section className="admin-panel"><ConnectionLoading /></section></main>;
	if (state.status === 'error') return <main className="admin-shell"><section className="admin-panel"><p className="form-message" role="alert">{state.error}</p></section></main>;
	if (state.data.qr) return <main className="admin-shell"><section className="admin-panel"><p className="eyebrow">WhatsApp AI / Conexión</p><h1>Vincula tu WhatsApp</h1><p className="intro">Escanea el código para activar tu bot.</p><QrCodeDisplay qr={state.data.qr} /></section></main>;
	return <main className="admin-shell"><section className="admin-panel"><p className="eyebrow">WhatsApp AI / Conexión</p><h1>Servidor conectado</h1><p className="intro">Evolution API respondió correctamente, pero todavía no ha entregado un QR.</p><div className="connection-status" role="status" aria-live="polite"><span className="connection-spinner" aria-hidden="true" /><span>Esperando la actualización de WhatsApp. Estado: {state.data.state}.</span></div></section></main>;
}