const express = require('express');
const cors = require('cors');
const ytdl = require('yt-dlp-exec');

const app = express();
app.use(cors());
app.use(express.json());

// Ruta para probar que el servidor responde
app.get('/', (req, res) => {
  res.send('Servidor activo');
});

// Ruta de búsqueda de música
app.post('/search', async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Falta la búsqueda' });
  }

  try {
    const output = await ytdl(`ytsearch1:${query}`, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
      format: 'bestaudio/best'
    });

    if (output && output.url) {
      res.json({
        title: output.title,
        url: output.url
      });
    } else {
      res.status(404).json({ error: 'No se encontró audio' });
    }
  } catch (err) {
    console.error('Error en búsqueda:', err);
    res.status(500).json({ error: 'Error procesando la solicitud' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
