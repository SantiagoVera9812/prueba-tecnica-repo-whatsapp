export function ModelSelectSkeleton() {
	return (
		<div className="model-select-loading" role="status" aria-live="polite" aria-label="Cargando modelos disponibles">
			<span className="model-loading-spinner" aria-hidden="true" />
			<span>Cargando modelos disponibles...</span>
		</div>
	);
}