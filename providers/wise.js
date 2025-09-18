import { randomUUID } from 'crypto';

export async function createPayment({ amountRub, email }) {
	const externalRef = `wise_${randomUUID()}`;
	return {
		externalRef,
		redirectUrl: `https://transferwise.example/transfer/${externalRef}`,
		metadata: { provider: 'wise', currency: 'RUB', email },
	};
}

export function verifyWebhook(_req) {
	return true;
}

export function mapWebhookToStatus(body) {
	const status = body?.status || 'succeeded';
	return status;
}

