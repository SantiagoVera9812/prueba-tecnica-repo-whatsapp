// Tipos relacionados con la conexión de la instancia de WhatsApp, incluyendo el estado de conexión y la estructura de datos para representar la conexión.
export type WhatsAppConnectionState = 'open' | 'connecting' | 'close' | 'unknown' | 'disconnecting' | 'reconnecting' | 'timeout' | 'error';
// Tipo que representa la conexión de la instancia de WhatsApp, incluyendo el estado de conexión y el código QR si está disponible.
export type InstanceConnection = {
	state: WhatsAppConnectionState;
	qr: string | null;
};
