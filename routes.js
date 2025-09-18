import { getOrCreateUserByEmail, createPayment, updatePaymentStatus, listUserPayments, listProducts, seedDemoProductsOnce, createOrderWithItems, setOrderPayment, getOrderById } from './db.js';
import { getProvider } from './providers/index.js';

import express from 'express';

const router = express.Router();

// Seed demo products on first request after boot
router.use((_req, _res, next) => { try { seedDemoProductsOnce(); } catch {} finally { next(); } });

router.get('/api/products', (_req, res) => {
	return res.json({ products: listProducts() });
});

router.post('/api/orders', (req, res) => {
	try {
		const { email, items } = req.body || {};
		if (!email || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ error: 'email and items[] required' });
		}
		const user = getOrCreateUserByEmail(email);
		const order = createOrderWithItems({ userId: user.id, items });
		return res.json({ order });
	} catch (err) {
		return res.status(400).json({ error: err.message });
	}
});

router.post('/api/orders/:orderId/checkout', async (req, res) => {
	try {
		const { orderId } = req.params;
		const { provider, email } = req.body || {};
		if (!provider || !email) return res.status(400).json({ error: 'provider and email required' });
		const order = getOrderById(orderId);
		if (!order) return res.status(404).json({ error: 'order not found' });
		const prov = getProvider(provider);
		const payment = createPayment({ userId: order.user_id, provider, amountRub: order.total_rub, status: 'pending' });
		const intent = await prov.createPayment({ amountRub: order.total_rub, email });
		setOrderPayment(orderId, payment.id);
		updatePaymentStatus(payment.id, 'requires_action', intent.externalRef);
		return res.json({ redirectUrl: intent.redirectUrl, paymentId: payment.id });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
});
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

