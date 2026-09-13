type Props = { qr: string };

export function QrCodeDisplay({ qr }: Props) {
	return (
		<div className="qr-panel">
			<img src={qr} alt="Código QR para vincular WhatsApp" className="qr-image" />
			<p>En WhatsApp, abre Dispositivos vinculados y escanea este código.</p>
		</div>
	);
}