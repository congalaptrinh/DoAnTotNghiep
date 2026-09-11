const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' }, message: 'Server is healthy' });
});

module.exports = app;
