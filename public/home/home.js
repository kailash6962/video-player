// public/app.js

// Slideshow variables
let currentSlide = 0;
let slideshowData = [];
let slideshowInterval;
const SLIDESHOW_INTERVAL = 5000; // 5 seconds per slide

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

// Slideshow functionality
function createHeroSlideshow() {
    console.log('🎬 Creating hero slideshow...');
    
    // Fetch recent videos and folders
    Promise.all([
        fetch('/api/videos/home', {
            headers: { 'x-db-name': 'home' }
        }).then(res => {
            console.log('🎬 Videos API response status:', res.status);
            if (!res.ok) {
                throw new Error(`Videos API failed with status ${res.status}`);
            }
            return res.json();
        }),
        fetch('/api/get-all-folders', {
            headers: { 'x-db-name': 'home' }
        }).then(res => {
            console.log('🎬 Folders API response status:', res.status);
            if (!res.ok) {
                throw new Error(`Folders API failed with status ${res.status}`);
            }
            return res.json();
        })
    ]).then(([videos, folders]) => {
        console.log('🎬 Raw videos data:', videos);
        console.log('🎬 Raw folders data:', folders);
        
        // Combine and sort by actual file modification date (most recent downloads first)
        const allContent = [
            ...videos.map(v => ({ 
                ...v, 
                type: 'movie', 
                actualDownloadDate: new Date(v.modifiedDate || v.createdDate || Date.now()),
                displayDate: new Date(v.modifiedDate || v.createdDate || Date.now())
            })),
            ...folders.map(f => ({ 
                ...f, 
                type: 'series', 
                actualDownloadDate: new Date(f.mostRecentFileDate || f.modifiedDate || f.createdDate || Date.now()),
                displayDate: new Date(f.mostRecentFileDate || f.modifiedDate || f.createdDate || Date.now())
            }))
        ].sort((a, b) => b.actualDownloadDate - a.actualDownloadDate);
        
        console.log('🎬 Processed content with download dates:', allContent.map(item => ({
            title: item.title || item.name,
            type: item.type,
            downloadDate: item.actualDownloadDate.toISOString()
        })));
        
        // Take top 5 most recent
        slideshowData = allContent.slice(0, 5);
        console.log('🎬 Slideshow data:', slideshowData);
        
        if (slideshowData.length > 0) {
            buildSlideshowHTML();
            initSlideshow();
        }
    }).catch(err => {
        console.error('Error loading slideshow data:', err);
        console.log('🎬 Attempting fallback: using existing page data...');
        
        // Fallback: Try to use existing cards that might already be loaded
        setTimeout(() => {
            const existingCards = document.querySelectorAll('.netflix-card');
            if (existingCards.length > 0) {
                console.log('🎬 Found existing cards, creating fallback slideshow...');
                createFallbackSlideshow(existingCards);
            } else {
                console.log('🎬 No existing data found, hiding slideshow');
                const slideshow = document.getElementById('hero-slideshow');
                if (slideshow) slideshow.style.display = 'none';
            }
        }, 2000); // Wait 2 seconds for page to load
    });
}

function buildSlideshowHTML() {
    const container = document.querySelector('.slideshow-container');
    const indicators = document.getElementById('slide-indicators');
    
    if (!container || !indicators) return;
    
    // Clear existing content
    container.innerHTML = '';
    indicators.innerHTML = '';
    
    slideshowData.forEach((item, index) => {
        // Create slide
        const slide = document.createElement('div');
        slide.className = `slide ${index === 0 ? 'active' : ''}`;
        slide.innerHTML = `
            <div class="slide-background" style="background-image: url('/api/thumbnail/${item.type === 'series' ? 'folder' : 'file'}/home/${encodeURIComponent(item.id || item.name)}?quality=slideshow')"></div>
            <div class="slide-gradient"></div>
            <div class="slide-content">
                <div class="slide-badge">
                    <span class="slide-type">${item.type === 'series' ? 'SERIES' : 'MOVIE'}</span>
                    <span class="slide-quality">${extractQuality(item.title || item.name)}</span>
                </div>
                <h1 class="slide-title">${cleanVideoTitle(item.title || item.name)}</h1>
                <p class="slide-description">Downloaded ${formatDownloadDate(item.actualDownloadDate)} • ${index === 0 ? 'Latest Download' : 'Recently Added'}</p>
                <div class="slide-metadata">
                    <span class="slide-year">${extractYear(item.title || item.name) || '2024'}</span>
                    <span class="slide-duration">${item.duration ? formatTime(item.duration) : (item.type === 'series' ? 'Multiple Episodes' : '2h 30m')}</span>
                    <span class="slide-rating">TV-MA</span>
                </div>
                <div class="slide-languages">
                    ${extractLanguages(item.title || item.name).map(lang => `<span class="lang-badge">${lang}</span>`).join('')}
                </div>
                <div class="slide-actions">
                    <button class="slide-play-btn" onclick="playSlideContent('${item.id || item.name}', '${item.type}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M8 5v14l11-7z" fill="currentColor"/>
                        </svg>
                        <span>Play Now</span>
                    </button>
                    <button class="slide-info-btn" onclick="showSlideInfo('${item.id || item.name}', '${item.type}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 16v-4" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 8h.01" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <span>More Info</span>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(slide);
        
        // Create indicator dot
        const dot = document.createElement('div');
        dot.className = `slide-dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToSlide(index);
        indicators.appendChild(dot);
    });
}

function initSlideshow() {
    // Setup navigation
    const prevBtn = document.getElementById('slide-prev');
    const nextBtn = document.getElementById('slide-next');
    
    if (prevBtn) prevBtn.onclick = () => changeSlide(-1);
    if (nextBtn) nextBtn.onclick = () => changeSlide(1);
    
    // Start auto-slideshow
    startSlideshow();
    
    // Pause on hover
    const slideshow = document.getElementById('hero-slideshow');
    if (slideshow) {
        slideshow.addEventListener('mouseenter', stopSlideshow);
        slideshow.addEventListener('mouseleave', startSlideshow);
    }
}

function changeSlide(direction) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slide-dot');
    
    if (slides.length === 0) return;
    
    // Remove active class from current slide and dot
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    // Calculate new slide index
    currentSlide = (currentSlide + direction + slides.length) % slides.length;
    
    // Add active class to new slide and dot
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slide-dot');
    
    if (slides.length === 0 || index < 0 || index >= slides.length) return;
    
    // Remove active class from current slide and dot
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    // Set new slide index
    currentSlide = index;
    
    // Add active class to new slide and dot
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function startSlideshow() {
    stopSlideshow(); // Clear any existing interval
    if (slideshowData.length > 1) {
        slideshowInterval = setInterval(() => changeSlide(1), SLIDESHOW_INTERVAL);
    }
}

function stopSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }
}

function playSlideContent(id, type) {
    if (type === 'series') {
        window.location.href = `/play/?series=${encodeURIComponent(id)}`;
    } else {
        window.location.href = `/play/?series=home&video=${encodeURIComponent(id)}`;
    }
}

function showSlideInfo(id, type) {
    // For now, just navigate to the content
    playSlideContent(id, type);
}

function extractQuality(filename) {
    const qualityMatch = filename.match(/(4K|2160p|1080p|720p|480p)/i);
    return qualityMatch ? qualityMatch[0] : 'HD';
}

function extractYear(filename) {
    const yearMatch = filename.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? yearMatch[0] : null;
}

function extractLanguages(filename) {
    const languages = [];
    if (filename.includes('Tam')) languages.push('Tamil');
    if (filename.includes('Tel')) languages.push('Telugu');
    if (filename.includes('Hin')) languages.push('Hindi');
    if (filename.includes('Mal')) languages.push('Malayalam');
    if (filename.includes('Kan')) languages.push('Kannada');
    if (filename.includes('Eng')) languages.push('English');
    
    return languages.length > 0 ? languages : ['Tamil'];
}

function formatDate(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Added today';
    if (diffDays <= 7) return `Added ${diffDays} days ago`;
    if (diffDays <= 30) return `Added ${Math.ceil(diffDays / 7)} weeks ago`;
    return `Added ${Math.ceil(diffDays / 30)} months ago`;
}

function formatDownloadDate(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) !== 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} month${Math.ceil(diffDays / 30) !== 1 ? 's' : ''} ago`;
    
    // For very old files, show the actual date
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function createFallbackSlideshow(cards) {
    console.log('🎬 Creating fallback slideshow from existing cards...');
    
    // Convert existing cards to slideshow data
    slideshowData = Array.from(cards).slice(0, 5).map((card, index) => {
        const title = card.querySelector('.card-title')?.textContent || 'Unknown';
        const isSeriesCard = card.classList.contains('series-card');
        const cardId = card.id || `fallback-${index}`;
        
        return {
            id: cardId,
            title: title,
            name: title,
            type: isSeriesCard ? 'series' : 'movie',
            actualDownloadDate: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)), // Simulate recent dates
            displayDate: new Date(Date.now() - (index * 24 * 60 * 60 * 1000))
        };
    });
    
    console.log('🎬 Fallback slideshow data:', slideshowData);
    
    if (slideshowData.length > 0) {
        buildSlideshowHTML();
        initSlideshow();
    }
}

// Auto-focus first card for TV browsers
window.addEventListener('load', function() {
    // Initialize slideshow
    createHeroSlideshow();
    
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