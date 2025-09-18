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

