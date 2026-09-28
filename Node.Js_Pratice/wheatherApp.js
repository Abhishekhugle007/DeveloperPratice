const express = require('express');
const path = require('path');

const app = express();

app.get('/', (request, response) => {
	response.sendFile(path.join(__dirname, 'weather.html'));
});

app.get('/health', (request, response) => {
	response.json({ status: 'ok' });
});

if (require.main === module) {
	const port = Number(process.env.PORT) || 3000;
	app.listen(port, () => {
		console.log(`Weather app running at http://localhost:${port}`);
	});
}

module.exports = app;
