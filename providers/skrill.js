import { randomUUID } from 'crypto';

export async function createPayment({ amountRub, email }) {
	const externalRef = `skrill_${randomUUID()}`;
	return {
		externalRef,
		redirectUrl: `https://skrill.example/pay/${externalRef}`,
		metadata: { provider: 'skrill', currency: 'RUB', email },
	};
}

export function verifyWebhook(_req) {
	return true;
}

export function mapWebhookToStatus(body) {
	const status = body?.status || 'succeeded';
	return status;
}

