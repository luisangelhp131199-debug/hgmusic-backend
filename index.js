const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint para parsear listas M3U
app.get('/parse-m3u', async (req, res) => {
  const m3uUrl = req.query.url;

  if (!m3uUrl) {
    return res.status(400).json({ error: 'Falta la URL de la lista M3U' });
  }

  try {
    const response = await fetch(m3uUrl);
    const data = await response.text();

    const lines = data.split('\n');
    const channels = [];
    let currentChannel = {};

    lines.forEach(line => {
      line = line.trim();

      if (line.startsWith('#EXTINF:')) {
        // Extraer logo
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const logo = logoMatch ? logoMatch[1] : '';

        // Extraer categoría/grupo
        const groupMatch = line.match(/group-title="([^"]+)"/);
        const group = groupMatch ? groupMatch[1] : 'General';

        // Extraer nombre del canal
        const nameParts = line.split(',');
        const name = nameParts[nameParts.length - 1].trim();

        currentChannel = { name, logo, group };
      } else if (line.startsWith('http://') || line.startsWith('https://')) {
        currentChannel.url = line;
        if (currentChannel.name) {
          channels.push(currentChannel);
        }
        currentChannel = {};
      }
    });

    res.json({ total: channels.length, channels });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la lista M3U' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor IPTV corriendo en puerto ${PORT}`));
