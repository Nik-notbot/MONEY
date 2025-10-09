import { randomUUID } from 'crypto';

export async function createPayment({ amountRub, email }) {
	const externalRef = `kraken_${randomUUID()}`;
	return {
		externalRef,
		redirectUrl: `https://kraken.example/pay/${externalRef}`,
		metadata: { provider: 'kraken', currency: 'RUB', email },
	};
}

export function verifyWebhook(_req) {
	return true;
}

export function mapWebhookToStatus(body) {
	const status = body?.status || 'succeeded';
	return status;
}