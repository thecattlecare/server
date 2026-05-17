const WebSocket = require('ws');
const http = require('http');

const WS_URL = 'ws://127.0.0.1:5000/ws/milk-notifications';
console.log('Connecting to', WS_URL);
const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('WS connected');
});

ws.on('message', (data) => {
  try {
    const msg = data.toString();
    console.log('WS message:', msg);
  } catch (err) {
    console.error('WS message parse error', err);
  }
});

ws.on('error', (err) => {
  console.error('WS error', err);
});

// After a short delay, POST a dev notification
setTimeout(() => {
  const payload = {
    id: 'dev-test-node',
    affectedDate: new Date().toISOString().split('T')[0],
    currentAmount: 12.5,
    previousAmount: 8.0,
    difference: 4.5,
    direction: 'increase',
    message: 'Automated dev test',
    createdAt: new Date().toISOString()
  };

  const body = JSON.stringify(payload);
  const options = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/dev/notify',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const req = http.request(options, (res) => {
    let resp = '';
    res.on('data', (chunk) => resp += chunk);
    res.on('end', () => console.log('HTTP response', res.statusCode, resp));
  });

  req.on('error', (err) => console.error('HTTP request error', err));
  req.write(body);
  req.end();
}, 1500);
