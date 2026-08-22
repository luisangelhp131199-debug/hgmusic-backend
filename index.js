const express = require('express');
const cors = require('cors');

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
    // Usamos la API de Piped para buscar en YouTube sin bloqueos de IP
    const searchRes = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=music_songs`);
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
      return res.status(404).json({ error: 'No se encontró el audio' });
    }

    const videoId = searchData.items[0].url.split('v=')[1];
    
    // Obtenemos los enlaces de audio directos
    const videoRes = await fetch(`https://pipedapi.kavin.rocks/streams/${videoId}`);
    const videoData = await videoRes.json();

    // Filtramos solo la mejor pista de audio MP4/AAC
    const audioStreams = videoData.audioStreams;
    if (!audioStreams || audioStreams.length === 0) {
      return res.status(404).json({ error: 'No se encontró enlace de audio' });
    }

    res.json({
      title: videoData.title,
      url: audioStreams[0].url
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
