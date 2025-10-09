import { randomUUID } from 'crypto';

export async function createPayment({ amountRub, email }) {
	const externalRef = `bitget_${randomUUID()}`;
	return {
		externalRef,
		redirectUrl: `https://bitget.example/pay/${externalRef}`,
		metadata: { provider: 'bitget', currency: 'RUB', email },
	};
}

export function verifyWebhook(_req) {
	return true;
}

export function mapWebhookToStatus(body) {
	const status = body?.status || 'succeeded';
	return status;
}