export default async (req, context) => {
	try {
		if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
		const { email, telegram, service, bep20, amountUsd } = await req.json();
		if (!email || !service || !amountUsd) {
			return new Response(JSON.stringify({ error: 'email, service, amountUsd required' }), { status: 400, headers: { 'content-type': 'application/json' } });
		}
		const rates = { redotpay: 100, wise: 101, skrill: 102 };
		const amountRubInt = Math.max(0, Math.round(Number(amountUsd) * (rates[service] || 100)));
		const amountRub = Number((amountRubInt).toFixed(2));
		const wataToken = process.env.WATA_API_TOKEN;
		const siteUrl = process.env.SITE_URL || 'https://example.com';
		const supabaseUrl = process.env.SUPABASE_URL;
		const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
		if (!wataToken || !supabaseUrl || !supabaseKey) {
			return new Response(JSON.stringify({ error: 'Server misconfigured', missing: {
				WATA_API_TOKEN: !wataToken,
				SUPABASE_URL: !supabaseUrl,
				SUPABASE_SERVICE_ROLE: !supabaseKey
			}}), { status: 500, headers: { 'content-type': 'application/json' } });
		}
		const orderId = `hm_${Date.now()}_${Math.floor(Math.random()*1e6)}`;
		// Create payment link
		const expire = new Date(Date.now() + 24*60*60*1000).toISOString();
		const res = await fetch('https://api.wata.pro/api/h2h/links', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'Authorization': `Bearer ${wataToken}`
			},
			body: JSON.stringify({
				type: 'ManyTime',
				amount: amountRub,
				currency: 'RUB',
				description: `Пополнение ${service} на ${amountUsd} USD`,
				orderId,
				successRedirectUrl: `${siteUrl}/success.html?orderId=${orderId}`,
				failRedirectUrl: `${siteUrl}/fail.html?orderId=${orderId}`,
				expirationDateTime: expire
			})
		});
		if (!res.ok) {
			const text = await res.text();
			return new Response(JSON.stringify({ error: 'wata_error', status: res.status, details: text }), { status: 502, headers: { 'content-type': 'application/json' } });
		}
		const data = await res.json();

		// Save to Supabase
		try {
		await fetch(`${supabaseUrl}/rest/v1/orders`, {
			method: 'POST',
			headers: {
				'apikey': supabaseKey,
				'Authorization': `Bearer ${supabaseKey}`,
				'Content-Type': 'application/json',
				'Prefer': 'return=representation'
			},
			body: JSON.stringify({
				order_id: orderId,
				email,
				telegram,
				service,
				bep20,
				amount_usd: amountUsd,
				amount_rub: amountRub,
				wata_link_id: data.id,
				wata_url: data.url,
				status: data.status || 'Opened'
			})
		});
		} catch (e) { console.error('supabase_error', e); }

		// Telegram notify
		try {
			const bot = process.env.TELEGRAM_BOT_TOKEN;
			const chat = process.env.TELEGRAM_CHAT_ID;
			if (bot && chat) {
				const text = `Новый заказ\norderId: ${orderId}\nemail: ${email}\n@${telegram||'-'}\nservice: ${service}\nUSD: ${amountUsd}\nRUB: ${amountRub}`;
				await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ chat_id: chat, text })
				});
			}
		} catch (e) { console.error('telegram_error', e); }

		return new Response(JSON.stringify({ url: data.url, orderId }), { headers: { 'content-type': 'application/json' } });
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'content-type': 'application/json' } });
	}
};

