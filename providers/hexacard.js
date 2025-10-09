import { randomUUID } from 'crypto';

export async function createPayment({ amountRub, email }) {
	const externalRef = `hexacard_${randomUUID()}`;
	return {
		externalRef,
		redirectUrl: `https://hexacard.example/pay/${externalRef}`,
		metadata: { provider: 'hexacard', currency: 'RUB', email },
	};
}

export function verifyWebhook(_req) {
	return true;
}

export function mapWebhookToStatus(body) {
	const status = body?.status || 'succeeded';
	return status;
}