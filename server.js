const express = require('express');
const bodyParser = require('body-parser');
const scraper = require('website-scraper');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/downloads', express.static(path.join(__dirname, 'public/downloads')));

app.post('/clonar', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'URL é obrigatória.' });

  const domain = url.replace(/^https?:\/\//, '').split('/')[0];
  const folder = path.join(__dirname, 'public', 'downloads', domain);

  try {
    await scraper({
      urls: [url],
      directory: folder,
      recursive: true,
      maxDepth: 2,
    });

    const zipPath = `${folder}.zip`;
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      return res.json({ success: true, download: `/downloads/${domain}.zip` });
    });

    archive.on('error', err => {
      throw err;
    });

    archive.pipe(output);
    archive.directory(folder, false);
    archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao clonar o site.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
