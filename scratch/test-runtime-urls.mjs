import http from 'http';

function checkUrl(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      resolve({ path, statusCode: res.statusCode, contentType: res.headers['content-type'] });
    }).on('error', (err) => {
      resolve({ path, error: err.message });
    });
  });
}

async function run() {
  const testPaths = [
    '/',
    '/focus',
    '/login',
    '/manifest.json',
    '/sw.js',
    '/pages/Dashboard/Dashboard.html',
    '/pages/Focus/Focus.html',
    '/pages/Focus/Focus.css',
    '/js/firebase.js',
    '/js/dev-server.js',
    '/api/config'
  ];

  console.log('=== TESTING RUNTIME HTTP REQUESTS ON LOCAL DEV SERVER ===');
  for (const p of testPaths) {
    const res = await checkUrl(p);
    console.log(`${res.path.padEnd(35)} -> Status: ${res.statusCode || 'ERR'} | Type: ${res.contentType || res.error}`);
  }
}

run();
