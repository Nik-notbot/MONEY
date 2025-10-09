import { randomUUID } from 'crypto';

export async function createPayment({ amountRub, email }) {
	const externalRef = `paypal_${randomUUID()}`;
	return {
		externalRef,
		redirectUrl: `https://paypal.example/pay/${externalRef}`,
		metadata: { provider: 'paypal', currency: 'RUB', email },
	};
}

export function verifyWebhook(_req) {
	return true;
}

export function mapWebhookToStatus(body) {
	const status = body?.status || 'succeeded';
	return status;
}