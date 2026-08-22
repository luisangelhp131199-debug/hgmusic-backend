const express = require('express');
const cors = require('cors');
const play = require('play-dl');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor activo');
});

app.post('/search', async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Falta la búsqueda' });
  }

  try {
    // Buscar el video en YouTube
    const searchResults = await play.search(query, { limit: 1 });
    
    if (!searchResults || searchResults.length === 0) {
      return res.status(404).json({ error: 'No se encontró el audio' });
    }

    const video = searchResults[0];

    // Obtener los enlaces directos de audio de YouTube
    const stream = await play.stream(video.url);

    res.json({
      title: video.title,
      url: stream.url
    });
  } catch (err) {
    console.error('Error en búsqueda:', err);
    res.status(500).json({ error: 'Error procesando la solicitud' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
