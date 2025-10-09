import { randomUUID } from 'crypto';

export async function createPayment({ amountRub, email }) {
	const externalRef = `spenda_${randomUUID()}`;
	return {
		externalRef,
		redirectUrl: `https://spenda.example/pay/${externalRef}`,
		metadata: { provider: 'spenda', currency: 'RUB', email },
	};
}

export function verifyWebhook(_req) {
	return true;
}

export function mapWebhookToStatus(body) {
	const status = body?.status || 'succeeded';
	return status;
}