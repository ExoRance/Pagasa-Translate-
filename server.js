const express = require('express');
const path = require('path');
const pagasaParser = require('./services/pagasaParser');
const translator = require('./services/translator');

const app = express();
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Latest bulletin (translated)
app.get('/api/bulletin/latest', async (req, res) => {
  const lang = req.query.lang || req.query.language || 'Tagalog';
  try {
    const parsed = await pagasaParser.getLatestBulletinRaw();
    const result = translator.translate(parsed, lang);
    res.json(result);
  } catch (err) {
    console.error(err.stack || err);
    res.status(500).json({ status: 'error', message: 'Server error', error: err.message });
  }
});

// Backwards-compatible alias
app.get('/api/bulletin', async (req, res) => {
  const lang = req.query.lang || req.query.language || 'Tagalog';
  try {
    const parsed = await pagasaParser.getLatestBulletinRaw();
    const result = translator.translate(parsed, lang);
    res.json(result);
  } catch (err) {
    console.error(err.stack || err);
    res.status(500).json({ status: 'error', message: 'Server error', error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PAGASA Translate running on http://localhost:${PORT}`));
