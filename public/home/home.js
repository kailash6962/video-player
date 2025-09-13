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
    const card = document.createElement('div');
    card.className = 'netflix-card series-card';
    card.id = folder.name;

    // Create thumbnail
    const thumbnail = document.createElement('img');
    thumbnail.className = 'card-thumbnail';
    thumbnail.src = `/api/thumbnail/folder/${folder.name}/${folder.name}`;
    thumbnail.alt = folder.name;

    // Episode count badge
    const episodeCount = document.createElement('div');
    episodeCount.className = 'episode-count';
    episodeCount.textContent = `${folder.videoCount} EP`;

    // Card content (always visible)
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';

    const cardTitle = document.createElement('h3');
    cardTitle.className = 'card-title';
    cardTitle.textContent = folder.name;

    const cardMeta = document.createElement('div');
    cardMeta.className = 'card-meta';

    // Episode row
    const episodeRow = document.createElement('div');
    episodeRow.className = 'card-meta-row';
    const currentEpisode = folder.lastOpenedNumber ? `EP ${folder.lastOpenedNumber}` : 'Not started';
    episodeRow.innerHTML = `
        <span class="card-duration">${folder.videoCount} Episodes</span>
        <span>•</span>
        <span class="card-last-viewed">${currentEpisode}</span>
    `;

    // Last viewed row
    const lastViewedRow = document.createElement('div');
    lastViewedRow.className = 'card-meta-row';
    const lastViewed = folder.lastOpened ? convertDate(folder.lastOpened) : 'Never';
    lastViewedRow.innerHTML = `<span>Last: ${lastViewed}</span>`;

    cardMeta.appendChild(episodeRow);
    cardMeta.appendChild(lastViewedRow);
    cardContent.appendChild(cardTitle);
    cardContent.appendChild(cardMeta);

    // Progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'card-progress';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'card-progress-bar';
    
    // Calculate watched percentage
    let watchedPercent = 0;
    if (folder.videoCount && folder.lastOpenedNumber) {
        watchedPercent = Math.max(0, ((folder.lastOpenedNumber - 1) / folder.videoCount) * 100);
    }
    progressBar.style.width = watchedPercent + '%';
    
    progressContainer.appendChild(progressBar);

    // Assemble card
    card.appendChild(thumbnail);
    card.appendChild(episodeCount);
    card.appendChild(cardContent);
    card.appendChild(progressContainer);

    // Event listeners
    card.addEventListener('click', () => {
        window.location.href = `/play?series=${folder.name}`;
    });
    
    // Keyboard support
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
        }
    });

    return card;
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
        const movieCount = document.getElementById('movieCount');
        
        videos.forEach((video, index) => {
            const card = renderVideoCard(video);
            // Make focusable for TV browsers
            card.setAttribute('tabindex', '0');
            card.setAttribute('data-index', index);
            gallery.appendChild(card);
        });
        
        // Update count
        movieCount.textContent = `${videos.length} Movie${videos.length !== 1 ? 's' : ''}`;
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
        const seriesCount = document.getElementById('seriesCount');
        
        folders.forEach((folder, index) => {
            const card = renderFolderCard(folder);
            // Make focusable for TV browsers
            card.setAttribute('tabindex', '0');
            card.setAttribute('data-index', index);
            foldersElem.appendChild(card);
        });
        
        // Update count
        seriesCount.textContent = `${folders.length} Series`;

    })
    .catch(err => console.error('Error loading folders:', err));

// Keyboard navigation for TV browsers
document.addEventListener('keydown', function(e) {
    const focusedElement = document.activeElement;
    
    if (!focusedElement || !focusedElement.classList.contains('netflix-card')) {
        return;
    }
    
    const currentIndex = parseInt(focusedElement.getAttribute('data-index'));
    const container = focusedElement.parentElement;
    const allCards = container.querySelectorAll('.netflix-card');
    
    // Calculate grid dimensions
    const containerWidth = container.offsetWidth;
    const cardWidth = 280; // minimum card width
    const gap = 20;
    const cardsPerRow = Math.floor(containerWidth / (cardWidth + gap));
    
    let targetIndex = currentIndex;
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            targetIndex = Math.max(0, currentIndex - 1);
            break;
        case 'ArrowRight':
            e.preventDefault();
            targetIndex = Math.min(allCards.length - 1, currentIndex + 1);
            break;
        case 'ArrowUp':
            e.preventDefault();
            targetIndex = Math.max(0, currentIndex - cardsPerRow);
            break;
        case 'ArrowDown':
            e.preventDefault();
            targetIndex = Math.min(allCards.length - 1, currentIndex + cardsPerRow);
            break;
        case 'Enter':
        case ' ':
            e.preventDefault();
            focusedElement.click();
            break;
        default:
            return;
    }
    
    if (targetIndex !== currentIndex && allCards[targetIndex]) {
        allCards[targetIndex].focus();
        // Smooth scroll to keep focused element in view
        allCards[targetIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
        });
    }
});

// Auto-focus first card for TV browsers
window.addEventListener('load', function() {
    // Check if we're likely on a TV browser (no fine pointer)
    const isTVBrowser = window.matchMedia('(pointer: coarse)').matches;
    
    if (isTVBrowser) {
        setTimeout(() => {
            const firstCard = document.querySelector('.netflix-card');
            if (firstCard) {
                firstCard.focus();
            }
        }, 1000);
    }
});