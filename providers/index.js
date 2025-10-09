import * as redotpay from './redotpay.js';
import * as wise from './wise.js';
import * as skrill from './skrill.js';
import * as bybit from './bybit.js';
import * as kraken from './kraken.js';
import * as neteller from './neteller.js';
import * as bitget from './bitget.js';
import * as payoneer from './payoneer.js';
import * as spenda from './spenda.js';
import * as paypal from './paypal.js';
import * as grey from './grey.js';
import * as hexacard from './hexacard.js';

export const providers = { 
	redotpay, 
	wise, 
	skrill, 
	bybit, 
	kraken, 
	neteller, 
	bitget, 
	payoneer, 
	spenda, 
	paypal, 
	grey, 
	hexacard 
};

export function getProvider(name) {
	const key = String(name || '').toLowerCase();
	const impl = providers[key];
	if (!impl) throw new Error(`Unsupported provider: ${name}`);
	return impl;
}

