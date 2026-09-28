const express = require('express');
const path = require('path');

const app = express();
const rateCache = new Map();
const cacheDuration = 60 * 60 * 1000;

app.get('/', (request, response) => {
	response.sendFile(path.join(__dirname, 'currency.html'));
});

app.get('/currency.css', (request, response) => {
	response.sendFile(path.join(__dirname, 'currency.css'));
});

app.get('/currency-client.js', (request, response) => {
	response.sendFile(path.join(__dirname, 'currency-client.js'));
});

app.get('/api/rates/:base', async (request, response) => {
	const base = request.params.base.toUpperCase();

	if (!/^[A-Z]{3}$/.test(base)) {
		return response.status(400).json({ error: 'Enter a valid three-letter currency code.' });
	}

	const cached = rateCache.get(base);
	if (cached && cached.expiresAt > Date.now()) {
		return response.json(cached.data);
	}

	try {
		const ratesResponse = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}`);
		const data = await ratesResponse.json();

		if (!ratesResponse.ok || !data.rates) {
			return response.status(502).json({ error: 'Live exchange rates are unavailable for that currency.' });
		}

		rateCache.set(base, { data, expiresAt: Date.now() + cacheDuration });
		response.set('Cache-Control', 'public, max-age=1800').json(data);
	} catch (error) {
		console.error('Exchange rate request failed:', error.message);
		response.status(502).json({ error: 'Could not reach the exchange rate service. Check your connection and try again.' });
	}
});

app.get('/health', (request, response) => {
	response.json({ status: 'ok' });
});

if (require.main === module) {
	const port = Number(process.env.PORT) || 3001;
	app.listen(port, () => {
		console.log(`Currency converter running at http://localhost:${port}`);
	});
}

module.exports = app;
