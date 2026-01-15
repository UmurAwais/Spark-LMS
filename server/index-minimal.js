const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ Minimal Server is RUNNING!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Force 0.0.0.0 binding
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Minimal Server listening on port ${PORT}`);
    console.log(`🌐 Address: http://0.0.0.0:${PORT}`);
});
