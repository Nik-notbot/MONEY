import { randomUUID } from 'crypto';

export async function createPayment({ amountRub, email }) {
	const externalRef = `rdp_${randomUUID()}`;
	return {
		externalRef,
		redirectUrl: `https://pay.redotpay.example/checkout/${externalRef}`,
		metadata: { provider: 'redotpay', currency: 'RUB', email },
	};
}

export function verifyWebhook(_req) {
	return true;
}

export function mapWebhookToStatus(body) {
	const status = body?.status || 'succeeded';
	return status;
}

