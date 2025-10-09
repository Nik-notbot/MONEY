import { randomUUID } from 'crypto';

export async function createPayment({ amountRub, email }) {
	const externalRef = `neteller_${randomUUID()}`;
	return {
		externalRef,
		redirectUrl: `https://neteller.example/pay/${externalRef}`,
		metadata: { provider: 'neteller', currency: 'RUB', email },
	};
}

export function verifyWebhook(_req) {
	return true;
}

export function mapWebhookToStatus(body) {
	const status = body?.status || 'succeeded';
	return status;
}