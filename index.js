const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/api/search', (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Falta la búsqueda' });

    const cmd = `npx yt-dlp-exec "ytsearch1:${query}" --dump-json --no-playlist`;

    exec(cmd, { timeout: 20000 }, (error, stdout) => {
        if (error) return res.status(500).json({ error: 'Error al buscar en HGMusic Engine' });
        try {
            const data = JSON.parse(stdout);
            res.json({
                title: data.title,
                artist: data.uploader || data.channel,
                cover: data.thumbnail,
                audioUrl: data.url
            });
        } catch (e) {
            res.status(500).json({ error: 'Error de proceso' });
        }
    });
});

app.listen(PORT, () => console.log(`Servidor HGMusic listo en puerto ${PORT}`));
