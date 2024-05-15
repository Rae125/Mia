document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('mp3Btn').addEventListener('click', () => {
        loadQualityOptions('mp3');
    });

    document.getElementById('mp4Btn').addEventListener('click', () => {
        loadQualityOptions('mp4');
    });

    document.getElementById('downloadBtn').addEventListener('click', async () => {
        const url = document.getElementById('url').value;
        const format = document.querySelector('.selected').id.replace('Btn', '');
        const quality = document.getElementById('quality').value;
        const loader = document.getElementById('loader');
        const results = document.getElementById('results');

        loader.classList.remove('hidden');

        const response = await fetch(`/convert?url=${encodeURIComponent(url)}&format=${format}&quality=${quality}`);
        loader.classList.add('hidden');

        if (response.ok) {
            const data = await response.json();

            data.downloads.forEach(download => {
                const resultItem = document.createElement('div');
                resultItem.classList.add('result-item');

                const thumbnail = document.createElement('img');
                thumbnail.src = download.thumbnail;
                resultItem.appendChild(thumbnail);

                const info = document.createElement('div');
                info.classList.add('info');

                const title = document.createElement('h3');
                title.textContent = download.title;
                info.appendChild(title);

                const qualityText = format === 'mp3' ? `${quality}` : `${quality}`;
                const durationText = `${Math.floor(download.duration / 60)}m ${download.duration % 60}s`;

                const qualityInfo = document.createElement('p');
                qualityInfo.textContent = `Format: ${download.format.toUpperCase()} | Quality: ${qualityText} | Duration: ${durationText}`;
                info.appendChild(qualityInfo);

                const downloadLink = document.createElement('a');
                downloadLink.href = `/download?url=${encodeURIComponent(download.url)}&format=${download.format}&quality=${download.quality}&title=${download.title}`;
                downloadLink.textContent = 'Download File';
                info.appendChild(downloadLink);

                resultItem.appendChild(info);
                results.appendChild(resultItem);
            });
        } else {
            alert('Error downloading file');
        }
    });

    document.getElementById('themeToggle').addEventListener('change', (event) => {
        document.body.classList.toggle('light-mode', !event.target.checked);
        document.body.classList.toggle('dark-mode', event.target.checked);
    });
});

function loadQualityOptions(format) {
    const quality = document.getElementById('quality');
    quality.innerHTML = '';

    if (format === 'mp3') {
        quality.innerHTML = `
            <option value="320kbps">320kbps</option>
            <option value="192kbps">192kbps</option>
            <option value="128kbps">128kbps</option>
            <option value="64kbps">64kbps</option>
        `;
    } else if (format === 'mp4') {
        quality.innerHTML = `
            <option value="1080p">1080p</option>
            <option value="720p">720p</option>
            <option value="480p">480p</option>
            <option value="360p">360p</option>
        `;
    }

    document.getElementById('quality-container').classList.remove('hidden');
    document.getElementById('downloadBtn').classList.remove('hidden');
    document.getElementById('mp3Btn').classList.remove('selected');
    document.getElementById('mp4Btn').classList.remove('selected');
    document.getElementById(`${format}Btn`).classList.add('selected');
}
