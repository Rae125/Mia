const express = require('express');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

ffmpeg.setFfmpegPath(ffmpegPath);

app.use(express.static('public'));

const itagMap = {
    '1080p': '137',
    '720p': '136',
    '480p': '135',
    '360p': '134',
    '320kbps': '251',
    '192kbps': '250',
    '128kbps': '140',
    '64kbps': '249'
};

app.get('/convert', async (req, res) => {
    const { url, format, quality } = req.query;
    if (!ytdl.validateURL(url) && !ytpl.validateID(url)) {
        return res.status(400).json({ success: false, error: 'Invalid YouTube URL or Playlist ID' });
    }

    const isPlaylist = ytpl.validateID(url);
    const downloadLinks = [];

    if (isPlaylist) {
        const playlist = await ytpl(url);
        for (const item of playlist.items) {
            const videoUrl = item.shortUrl;
            const videoInfo = await ytdl.getInfo(videoUrl);
            const videoTitle = videoInfo.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');
            const thumbnail = videoInfo.videoDetails.thumbnails[0].url;
            const duration = videoInfo.videoDetails.lengthSeconds;
            downloadLinks.push({ title: videoTitle, url: videoUrl, thumbnail, format, quality, duration });
        }
        res.json({ success: true, downloads: downloadLinks });
    } else {
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');
        const thumbnail = info.videoDetails.thumbnails[0].url;
        const duration = info.videoDetails.lengthSeconds;

        res.json({ success: true, downloads: [{ title, url, thumbnail, format, quality, duration }] });
    }
});

app.get('/download', (req, res) => {
    const { url, format, quality, title } = req.query;
    const itag = itagMap[quality];

    if (!itag) {
        return res.status(400).json({ success: false, error: 'Invalid quality parameter' });
    }

    const outputPath = path.join(__dirname, 'downloads', `${title}.${format}`);
    const stream = ytdl(url, { quality: itag });

    ffmpeg(stream)
        .format(format)
        .on('start', commandLine => {
            console.log('Spawned Ffmpeg with command: ' + commandLine);
        })
        .on('error', (err, stdout, stderr) => {
            console.error('An error occurred: ' + err.message);
            console.error('ffmpeg stdout:', stdout);
            console.error('ffmpeg stderr:', stderr);
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: err.message });
            }
        })
        .on('end', () => {
            res.download(outputPath, `${title}.${format}`, (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    if (!res.headersSent) {
                        res.status(500).json({ success: false, error: err.message });
                    }
                }
                fs.unlink(outputPath, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                    }
                });
            });
        })
        .save(outputPath);
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
