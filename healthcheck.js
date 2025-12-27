// Simple healthcheck script to verify HTTP server
import http from 'http';

const port = process.env.PORT ? Number(process.env.PORT) : 10000;
const options = {
  hostname: '127.0.0.1',
  port,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => (data += chunk));
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json && json.status === 'healthy') {
        console.log('OK');
        process.exit(0);
      } else {
        console.error('Unhealthy response');
        process.exit(1);
      }
    } catch {
      console.error('Invalid health response');
      process.exit(1);
    }
  });
});

req.on('error', err => {
  console.error('Healthcheck error:', err.message);
  process.exit(1);
});

req.end();
