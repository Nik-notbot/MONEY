import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

const db = new Database('heymoney.db');

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	email TEXT UNIQUE NOT NULL,
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	provider TEXT NOT NULL,
	amount_rub INTEGER NOT NULL,
	status TEXT NOT NULL,
	external_ref TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS products (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT,
	price_rub INTEGER NOT NULL,
	image TEXT,
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	status TEXT NOT NULL,
	total_rub INTEGER NOT NULL,
	payment_id TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
	id TEXT PRIMARY KEY,
	order_id TEXT NOT NULL,
	product_id TEXT NOT NULL,
	quantity INTEGER NOT NULL,
	unit_price_rub INTEGER NOT NULL,
	created_at TEXT NOT NULL,
	FOREIGN KEY(order_id) REFERENCES orders(id),
	FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS meta (
	key TEXT PRIMARY KEY,
	value TEXT
);
`);

export function getOrCreateUserByEmail(email) {
	const find = db.prepare('SELECT * FROM users WHERE email = ?');
	let user = find.get(email);
	if (!user) {
		const id = randomUUID();
		const now = new Date().toISOString();
		db.prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)').run(id, email, now);
		user = { id, email, created_at: now };
	}
	return user;
}

export function createPayment({ userId, provider, amountRub, status, externalRef }) {
	const id = randomUUID();
	const now = new Date().toISOString();
	db.prepare(`INSERT INTO payments (id, user_id, provider, amount_rub, status, external_ref, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
		.run(id, userId, provider, amountRub, status, externalRef ?? null, now, now);
	return getPaymentById(id);
}

export function updatePaymentStatus(id, status, externalRef) {
	const now = new Date().toISOString();
	db.prepare('UPDATE payments SET status = ?, external_ref = COALESCE(?, external_ref), updated_at = ? WHERE id = ?')
		.run(status, externalRef ?? null, now, id);
	return getPaymentById(id);
}

export function getPaymentById(id) {
	return db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
}

export function listUserPayments(userId) {
	return db.prepare('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

export default db;

// Products
export function listProducts() {
	return db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
}

export function seedDemoProductsOnce() {
	const seeded = db.prepare('SELECT value FROM meta WHERE key = ?').get('seed_products_v1');
	if (seeded?.value === '1') return;
	const now = new Date().toISOString();
	const insert = db.prepare('INSERT INTO products (id, name, description, price_rub, image, created_at) VALUES (?, ?, ?, ?, ?, ?)');
	const items = [
		{ name: 'Виртуальная карта EUR', description: 'Пополнение иностранного счёта, валюта EUR', price_rub: 5000, image: 'https://picsum.photos/seed/eur/400/240' },
		{ name: 'Виртуальная карта USD', description: 'Пополнение иностранного счёта, валюта USD', price_rub: 5500, image: 'https://picsum.photos/seed/usd/400/240' },
		{ name: 'Перевод SEPA', description: 'Международный перевод в EUR', price_rub: 3000, image: 'https://picsum.photos/seed/sepa/400/240' },
		{ name: 'Перевод SWIFT', description: 'SWIFT перевод в USD/EUR/GBP', price_rub: 7000, image: 'https://picsum.photos/seed/swift/400/240' }
	];
	for (const p of items) {
		insert.run(randomUUID(), p.name, p.description, p.price_rub, p.image, now);
	}
	db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run('seed_products_v1', '1');
}

// Orders
export function createOrderWithItems({ userId, items }) {
	// items: [{ productId, quantity }]
	const now = new Date().toISOString();
	const orderId = randomUUID();
	const getProd = db.prepare('SELECT * FROM products WHERE id = ?');
	let total = 0;
	for (const it of items) {
		const prod = getProd.get(it.productId);
		if (!prod) throw new Error('Product not found: ' + it.productId);
		const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
		total += prod.price_rub * qty;
	}
	const insertOrder = db.prepare('INSERT INTO orders (id, user_id, status, total_rub, payment_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
	insertOrder.run(orderId, userId, 'created', total, null, now, now);
	const insertItem = db.prepare('INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_rub, created_at) VALUES (?, ?, ?, ?, ?, ?)');
	for (const it of items) {
		const prod = getProd.get(it.productId);
		const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
		insertItem.run(randomUUID(), orderId, prod.id, qty, prod.price_rub, now);
	}
	return getOrderById(orderId);
}

export function getOrderById(id) {
	const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
	if (!order) return null;
	const items = db.prepare(`SELECT oi.*, p.name, p.image FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE order_id = ?`).all(id);
	return { ...order, items };
}

export function setOrderPayment(orderId, paymentId) {
	const now = new Date().toISOString();
	db.prepare('UPDATE orders SET payment_id = ?, updated_at = ? WHERE id = ?').run(paymentId, now, orderId);
	return getOrderById(orderId);
}

export function listOrdersByUser(userId) {
	const rows = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
	return rows.map(o => ({ ...o, items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id) }));
}

