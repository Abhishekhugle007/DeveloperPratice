const https = require('https');
const axios = require('axios');
const url = 'https://jsonplaceholder.typicode.com/posts/1';

function getWithHttps() {
	return new Promise((resolve, reject) => {
		const request = https.get(url, (response) => {
			let body = '';
			response.setEncoding('utf8');
			response.on('data', (chunk) => body += chunk);
			response.on('end', () => {
				if (response.statusCode < 200 || response.statusCode >= 300) {
					return reject(new Error(`HTTPS request failed: ${response.statusCode}`));
				}

				try {
					resolve(JSON.parse(body));
				} catch (error) {
					reject(new Error(`Invalid JSON response: ${error.message}`));
				}
			});
		});

		request.on('error', reject);
	});
}

async function getWithFetch() {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Fetch request failed: ${response.status}`);
	}

	const data = await response.json();
	console.log('Node fetch:', data);
}

async function getWithAxios() {
	const response = await axios.get(url);
	console.log('Axios:', response.data);
}

async function main() {
	const httpsData = await getWithHttps();
	console.log('Node https:', httpsData);
	await getWithFetch();
	await getWithAxios();
}

main().catch((error) => {
	console.error('Request failed:', error.message);
	process.exitCode = 1;
});


