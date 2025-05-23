// public/app.js
const videoListEl = document.getElementById('videoList');
const playerContainer = document.getElementById('playerContainer');
const videoPlayer = document.getElementById('videoPlayer');

const video = document.getElementById('videoPlayer');
// const source = document.getElementById("videoPlayer");
var manualDuration = 10; // seconds

const playPause = document.getElementById('playPause');
const seek = document.getElementById('seek');
const volume = document.getElementById('volume');
const currentTimeEl = document.getElementById('current');
const durationEl = document.getElementById('duration');
var startTime = 0;

let currentVideoId = null;
let progressUpdateTimeout = null;

function renderFolderCard(folder) {
    const div = document.createElement('div');
    div.className = 'video';
    div.id = folder.name;

    // Create thumbnail container
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'video-thumbnail-container';

    const durationContainer = document.createElement('div');
    durationContainer.className = 'duration';
    durationContainer.textContent = `${folder.videoCount} Episodes`;

    // Create the video element
    const imageElement = document.createElement('img');
    imageElement.className = `thumbnail`;
    imageElement.src = `/api/thumbnail/folder/${folder.name}/${folder.name}`;

    // Create the watched time redline
    const watchedTime = document.createElement('div');
    watchedTime.id = 'watched-time';
    watchedTime.className = 'watched-time';
    watchedTime.style.width = '0%';

    // Append video and redline to thumbnail container
    thumbnailContainer.appendChild(imageElement);
    thumbnailContainer.appendChild(watchedTime);
    thumbnailContainer.appendChild(durationContainer);

    // Create the details section
    const details = document.createElement('div');
    details.className = 'details';

    const videoName = document.createElement('span');
    videoName.className = 'video-name';
    videoName.textContent = folder.name;

    const stats = document.createElement('div');
    stats.className = 'video-stats';

    const lastViewed = document.createElement('span');

    const currentEPISODE = `
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="white" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z"/>
    </svg>
    <b>EP ${folder.lastOpenedNumber}</b>`;

    const lastViewedDate = folder.lastOpened? `Last viewed ${convertDate(folder.lastOpened)} ${currentEPISODE}` : "Not viewed yet";

    lastViewed.innerHTML = lastViewedDate;

    // Assemble the stats
    stats.appendChild(lastViewed);
    details.appendChild(videoName);
    details.appendChild(stats);

    // Final assembly
    div.appendChild(thumbnailContainer);
    div.appendChild(details);

    // Event listeners
    div.addEventListener('click', () => window.location.href = `/play?series=${folder.name}`);

    return div;
}



fetch('/api/videos/home', {
    method: 'GET',
    headers: {
        'x-db-name': 'home'  // replace 'folder1' with your actual db name
    }
})
    .then(response => response.json())
    .then(videos => {
        console.log("📢[:91]: videos: ", videos);
        const gallery = document.getElementById('videoGallery');
        videos.forEach(video => {
            gallery.appendChild(renderVideoCard(video));
        });
    })
    .catch(err => console.error('Error loading videos:', err));

let isManual = false;

// for this file only
fetch('/api/get-all-folders', {
    method: 'GET',
    headers: {
        'x-db-name': 'home'  // replace 'folder1' with your actual db name
    }
})
    .then(response => response.json())
    .then(folders => {
        console.log("📢[:306]: folders: ", folders);
        const foldersElem = document.getElementById('folderGallery');
        folders.forEach(folder => {
            foldersElem.appendChild(renderFolderCard(folder));
        });

    })
    .catch(err => console.error('Error loading folders:', err));