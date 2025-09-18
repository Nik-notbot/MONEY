import * as redotpay from './redotpay.js';
import * as wise from './wise.js';
import * as skrill from './skrill.js';

export const providers = { redotpay, wise, skrill };

export function getProvider(name) {
	const key = String(name || '').toLowerCase();
	const impl = providers[key];
	if (!impl) throw new Error(`Unsupported provider: ${name}`);
	return impl;
}

