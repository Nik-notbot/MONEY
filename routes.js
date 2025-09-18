import { getOrCreateUserByEmail, createPayment, updatePaymentStatus, listUserPayments } from './db.js';
import { getProvider } from './providers/index.js';

import express from 'express';

const router = express.Router();

router.post('/api/payments', async (req, res) => {
	try {
		const { email, amountRub, provider } = req.body || {};
		if (!email || !amountRub || !provider) {
			return res.status(400).json({ error: 'email, amountRub, provider are required' });
		}
		if (!Number.isInteger(amountRub) || amountRub <= 0) {
			return res.status(400).json({ error: 'amountRub must be positive integer' });
		}
		const user = getOrCreateUserByEmail(email);
		const prov = getProvider(provider);
		const created = createPayment({ userId: user.id, provider, amountRub, status: 'pending' });
		const intent = await prov.createPayment({ amountRub, email });
		updatePaymentStatus(created.id, 'requires_action', intent.externalRef);
		return res.json({ paymentId: created.id, redirectUrl: intent.redirectUrl });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
});

router.get('/api/payments', (req, res) => {
	const { email } = req.query;
	if (!email) return res.status(400).json({ error: 'email is required' });
	const user = getOrCreateUserByEmail(String(email));
	const payments = listUserPayments(user.id);
	res.json({ payments });
});

router.post('/webhooks/:provider', (req, res) => {
	try {
		const { provider } = req.params;
		const prov = getProvider(provider);
		if (!prov.verifyWebhook(req)) return res.status(401).send('invalid');
		const { paymentId, externalRef, status } = req.body || {};
		const mapped = status || prov.mapWebhookToStatus(req.body);
		if (!paymentId) return res.status(400).json({ error: 'paymentId required' });
		const updated = updatePaymentStatus(paymentId, mapped, externalRef);
		return res.json({ ok: true, payment: updated });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
});

export default router;

