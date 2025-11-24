const http = require('http');
const express = require('express');

const app = express();
app.use(express.json());

// simple CORS for local development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const transactions = [];
const accounts = new Map();

function updateAccountBalance(accountId, amount) {
  const prev = accounts.get(accountId) || 0;
  const next = prev + amount;
  accounts.set(accountId, next);
  return next;
}

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// 405 for unsupported methods on /ping
app.all('/ping', (req, res, next) => {
  if (req.method !== 'GET') {
    return res.status(405).send('Specified HTTP method not allowed.');
  }
  next();
});

app.post('/transactions', (req, res) => {
  // enforce JSON content type per spec
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    return res.status(415).json({ error: 'Specified content type not allowed' });
  }

  const { account_id, amount } = req.body || {};
  if (typeof account_id !== 'string' || !Number.isInteger(amount)) {
    return res.status(400).json({ error: 'Mandatory body parameters missing or have incorrect type.' });
  }

  const transaction_id = (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.randomUUID)
    ? globalThis.crypto.randomUUID()
    : require('crypto').randomUUID();

  const created_at = new Date().toISOString();

  const transaction = { transaction_id, account_id, amount, created_at };
  transactions.unshift(transaction);

  const balance = updateAccountBalance(account_id, amount);

  res.status(201).json(transaction);
});

// return 405 for other methods on /transactions
app.all('/transactions', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).send('Specified HTTP method not allowed.');
  }
  next();
});

app.get('/transactions', (req, res) => {
  res.json(transactions);
});

app.get('/transactions/:transaction_id', (req, res) => {
  const t = transactions.find(x => x.transaction_id === req.params.transaction_id);
  if (!t) return res.status(404).json({ error: 'Transaction not found' });
  res.json(t);
});

// 405 for unsupported methods on /transactions/:transaction_id
app.all('/transactions/:transaction_id', (req, res, next) => {
  if (req.method !== 'GET') {
    return res.status(405).send('Specified HTTP method not allowed.');
  }
  next();
});

app.get('/accounts/:account_id', (req, res) => {
  const accountId = req.params.account_id;
  if (!accounts.has(accountId)) return res.status(404).json({ error: 'Account not found' });
  res.json({ account_id: accountId, balance: accounts.get(accountId) });
});

// 405 for unsupported methods on /accounts/:account_id
app.all('/accounts/:account_id', (req, res, next) => {
  if (req.method !== 'GET') {
    return res.status(405).send('Specified HTTP method not allowed.');
  }
  next();
});

const port = process.env.PORT || 8080;
const server = http.createServer(app);
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});
