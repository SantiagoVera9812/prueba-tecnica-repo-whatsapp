export function ConnectionLoading() {
	return (
		<div className="connection-status" role="status" aria-live="polite">
			<span className="connection-spinner" aria-hidden="true" />
			<span>Preparando la conexión con WhatsApp...</span>
		</div>
	);
}