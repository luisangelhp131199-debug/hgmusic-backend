const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/xtream-data', async (req, res) => {
  const { server, username, password, type } = req.query; // type: live, vod, series
  if (!server || !username || !password) {
    return res.status(400).json({ error: 'Faltan datos de acceso' });
  }

  let cleanServer = server.trim().replace(/\/+$/, '');
  const contentType = type || 'live';

  try {
    let actionStreams = 'get_live_streams';
    let actionCats = 'get_live_categories';
    let streamExt = 'm3u8';
    let streamFolder = 'live';

    if (contentType === 'vod') {
      actionStreams = 'get_vod_streams';
      actionCats = 'get_vod_categories';
      streamFolder = 'movie';
    } else if (contentType === 'series') {
      actionStreams = 'get_series';
      actionCats = 'get_series_categories';
      streamFolder = 'series';
    }

    const [streamsRes, catsRes] = await Promise.all([
      fetch(`${cleanServer}/player_api.php?username=${username}&password=${password}&action=${actionStreams}`),
      fetch(`${cleanServer}/player_api.php?username=${username}&password=${password}&action=${actionCats}`)
    ]);

    const streamsData = await streamsRes.json();
    const catsData = await catsRes.json();

    const catMap = {};
    if (Array.isArray(catsData)) {
      catsData.forEach(cat => { catMap[cat.category_id] = cat.category_name; });
    }

    const items = streamsData.map(item => {
      const ext = item.container_extension || streamExt;
      const id = item.stream_id || item.series_id;
      return {
        id: id,
        name: item.name || 'Sin nombre',
        logo: item.stream_icon || item.cover || '',
        group: catMap[item.category_id] || 'General',
        url: `${cleanServer}/${streamFolder}/${username}/${password}/${id}.${ext}`
      };
    });

    res.json({ total: items.length, items });
  } catch (error) {
    res.status(500).json({ error: 'Error al conectar con Xtream Codes' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend IPTV activo en puerto ${PORT}`));
