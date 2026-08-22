const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Endpoint para procesar listas M3U por URL
app.get('/parse-m3u', async (req, res) => {
  const m3uUrl = req.query.url;
  if (!m3uUrl) return res.status(400).json({ error: 'Falta la URL de la lista M3U' });

  try {
    const response = await fetch(m3uUrl);
    const data = await response.text();
    const channels = parseM3UContent(data);
    res.json({ total: channels.length, channels });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la lista M3U' });
  }
});

// 2. Endpoint para Xtream Codes (API Login y Canales en Vivo)
app.get('/xtream-channels', async (req, res) => {
  const { server, username, password } = req.query;
  if (!server || !username || !password) {
    return res.status(400).json({ error: 'Faltan datos de acceso Xtream Codes' });
  }

  // Asegurar formato limpio de la URL del servidor
  let cleanServer = server.trim();
  if (cleanServer.endsWith('/')) cleanServer = cleanServer.slice(0, -1);

  const apiLoginUrl = `${cleanServer}/player_api.php?username=${username}&password=${password}`;

  try {
    const loginRes = await fetch(apiLoginUrl);
    const loginData = await loginRes.json();

    if (!loginData.user_info || loginData.user_info.auth !== 1) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Obtener canales en vivo
    const liveStreamsUrl = `${cleanServer}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;
    const streamsRes = await fetch(liveStreamsUrl);
    const streamsData = await streamsRes.json();

    // Obtener categorías en vivo para mapear nombres
    const catsUrl = `${cleanServer}/player_api.php?username=${username}&password=${password}&action=get_live_categories`;
    const catsRes = await fetch(catsUrl);
    const catsData = await catsRes.json();

    const catMap = {};
    if (Array.isArray(catsData)) {
      catsData.forEach(cat => { catMap[cat.category_id] = cat.category_name; });
    }

    const channels = streamsData.map(stream => ({
      name: stream.name || 'Sin nombre',
      logo: stream.stream_icon || '',
      group: catMap[stream.category_id] || 'General',
      url: `${cleanServer}/live/${username}/${password}/${stream.stream_id}.m3u8`
    }));

    res.json({ total: channels.length, channels });
  } catch (error) {
    res.status(500).json({ error: 'Error al conectar con el servidor Xtream' });
  }
});

// Función auxiliar para leer texto M3U
function parseM3UContent(data) {
  const lines = data.split('\n');
  const channels = [];
  let currentChannel = {};

  lines.forEach(line => {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const logo = logoMatch ? logoMatch[1] : '';

      const groupMatch = line.match(/group-title="([^"]+)"/);
      const group = groupMatch ? groupMatch[1] : 'General';

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
  return channels;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor IPTV Pro corriendo en puerto ${PORT}`));
