const fetch = require('node-fetch'); // If not available, use https
const https = require('https');

https.get('https://gerenciamento-chiq-duo-mkt.vercel.app/api/dashboard/data', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Response:', data));
}).on('error', (err) => console.error(err));
