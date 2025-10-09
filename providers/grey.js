import { randomUUID } from 'crypto';

export async function createPayment({ amountRub, email }) {
	const externalRef = `grey_${randomUUID()}`;
	return {
		externalRef,
		redirectUrl: `https://grey.example/pay/${externalRef}`,
		metadata: { provider: 'grey', currency: 'RUB', email },
	};
}

export function verifyWebhook(_req) {
	return true;
}

export function mapWebhookToStatus(body) {
	const status = body?.status || 'succeeded';
	return status;
}