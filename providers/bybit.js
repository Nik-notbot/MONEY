import { randomUUID } from 'crypto';

export async function createPayment({ amountRub, email }) {
	const externalRef = `bybit_${randomUUID()}`;
	return {
		externalRef,
		redirectUrl: `https://bybit.example/pay/${externalRef}`,
		metadata: { provider: 'bybit', currency: 'RUB', email },
	};
}

export function verifyWebhook(_req) {
	return true;
}

export function mapWebhookToStatus(body) {
	const status = body?.status || 'succeeded';
	return status;
}