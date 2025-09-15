// public/app.js

// Slideshow variables
let currentSlide = 0;
let slideshowData = [];
let slideshowInterval;
const SLIDESHOW_INTERVAL = 5000; // 5 seconds per slide

// Load current user info
async function loadCurrentUser() {
    try {
        const response = await fetch('/api/users/current');
        if (response.ok) {
            const { user } = await response.json();
            updateUserDisplay(user);
        } else {
            // Redirect to user selection if no valid session
            window.location.href = '/';
        }
    } catch (error) {
        // Error loading user handled silently
        window.location.href = '/';
    }
}

function updateUserDisplay(user) {
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    
    if (userAvatar && userName) {
        userAvatar.textContent = user.avatar_emoji || '👤';
        userName.textContent = user.display_name || 'Guest';
        
        // Apply dynamic colors if available
        if (user.avatar_bg_color && user.avatar_text_color) {
            userAvatar.style.background = user.avatar_bg_color;
            userAvatar.style.color = user.avatar_text_color;
        }
    }
}

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
        // Videos loaded
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
    .catch(err => {
        // Error loading videos handled silently
    });

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
        // Folders loaded
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
    .catch(err => {
        // Error loading folders handled silently
    });

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
    // Creating hero slideshow
    
    // Fetch recent videos and folders
    Promise.all([
        fetch('/api/videos/home', {
            headers: { 'x-db-name': 'home' }
        }).then(res => {
            // Videos API response status
            if (!res.ok) {
                throw new Error(`Videos API failed with status ${res.status}`);
            }
            return res.json();
        }),
        fetch('/api/get-all-folders', {
            headers: { 'x-db-name': 'home' }
        }).then(res => {
            // Folders API response status
            if (!res.ok) {
                throw new Error(`Folders API failed with status ${res.status}`);
            }
            return res.json();
        })
    ]).then(([videos, folders]) => {
        // Raw videos and folders data processed
        
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
        
        // Processed content with download dates
        
        // Take top 5 most recent
        slideshowData = allContent.slice(0, 5);
        // Slideshow data processed
        
        if (slideshowData.length > 0) {
            buildSlideshowHTML();
            initSlideshow();
        }
    }).catch(err => {
        // Error loading slideshow data, attempting fallback
        
        // Fallback: Try to use existing cards that might already be loaded
        setTimeout(() => {
            const existingCards = document.querySelectorAll('.netflix-card');
            if (existingCards.length > 0) {
                // Found existing cards, creating fallback slideshow
                createFallbackSlideshow(existingCards);
            } else {
                // No existing data found, hiding slideshow
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
    // Creating fallback slideshow from existing cards
    
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
    
    // Fallback slideshow data processed
    
    if (slideshowData.length > 0) {
        buildSlideshowHTML();
        initSlideshow();
    }
}

// Load continue watching content
async function loadContinueWatching() {
    try {
        // Loading continue watching
        const response = await fetch('/api/users/continue-watching', {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        // Continue watching response status
        
        if (response.ok) {
            const continueWatching = await response.json();
            // Continue watching data processed
            renderContinueWatching(continueWatching);
        } else if (response.status === 304) {
            // Continue watching: 304 Not Modified - using cached data
            // Try to get cached data or show empty state
            renderContinueWatching([]);
        } else {
            // Continue watching failed with status
        }
    } catch (error) {
        // Error loading continue watching handled silently
    }
}

// Render continue watching section
function renderContinueWatching(videos) {
    const section = document.getElementById('continue-watching-section');
    const grid = document.getElementById('continue-watching-grid');
    
    if (!section || !grid) return;
    
    if (videos.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    // Show the section
    section.style.display = 'block';
    
    // Clear existing content
    grid.innerHTML = '';
    
    // Create video cards
    videos.forEach(video => {
        const card = createContinueWatchingCard(video);
        grid.appendChild(card);
    });
}

// Create continue watching card using the same design as regular video cards
function createContinueWatchingCard(video) {
    const card = document.createElement('div');
    card.className = 'netflix-card';
    card.id = video.video_id;
    card.setAttribute('tabindex', '0');

    // Create thumbnail
    const thumbnail = document.createElement('img');
    thumbnail.className = 'card-thumbnail';
    
    if (video.is_series) {
        // For series, use folder thumbnail
        thumbnail.src = `/api/thumbnail/folder/${video.series}/${video.series}`;
        thumbnail.alt = video.series;
    } else {
        // For movies, use file thumbnail
        thumbnail.src = `/api/thumbnail/file/${video.series}/${video.video_id}`;
        thumbnail.alt = video.video_id;
    }

    // Duration badge (show completion percentage or episode count for series)
    const durationBadge = document.createElement('div');
    durationBadge.className = 'episode-count';
    if (video.is_series) {
        durationBadge.textContent = `${video.watched_episodes}/${video.total_episodes}`;
    } else {
        durationBadge.textContent = `${video.completion_percentage}%`;
    }

    // Card content
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';

    const cardTitle = document.createElement('h3');
    cardTitle.className = 'card-title';
    if (video.is_series) {
        cardTitle.textContent = video.series;
    } else {
        cardTitle.textContent = video.video_id;
    }

    const cardMeta = document.createElement('div');
    cardMeta.className = 'card-meta';

    // Progress row
    const progressRow = document.createElement('div');
    progressRow.className = 'card-meta-row';
    if (video.is_series) {
        progressRow.innerHTML = `
            <span class="card-duration">Series</span>
            <span>•</span>
            <span class="card-last-viewed">${video.completion_percentage}% complete</span>
        `;
    } else {
        // For movies, show "Movie" instead of series name
        const seriesDisplay = video.series === 'home' ? 'Movie' : video.series;
        progressRow.innerHTML = `
            <span class="card-duration">${seriesDisplay}</span>
            <span>•</span>
            <span class="card-last-viewed">${video.completion_percentage}% watched</span>
        `;
    }

    // Last opened row
    const statusRow = document.createElement('div');
    statusRow.className = 'card-meta-row';
    const lastOpened = video.last_opened ? new Date(video.last_opened).toLocaleDateString() : 'Unknown';
    statusRow.innerHTML = `<span>Last: ${lastOpened}</span>`;

    cardMeta.appendChild(progressRow);
    cardMeta.appendChild(statusRow);
    cardContent.appendChild(cardTitle);
    cardContent.appendChild(cardMeta);

    // Progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'card-progress';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'card-progress-bar';
    progressBar.style.width = `${video.completion_percentage}%`;
    
    progressContainer.appendChild(progressBar);

    // Assemble card
    card.appendChild(thumbnail);
    card.appendChild(durationBadge);
    card.appendChild(cardContent);
    card.appendChild(progressContainer);

    // Event listeners
    card.addEventListener('click', () => {
        if (video.is_series) {
            // For series, go to the play page with the series
            window.location.href = `/play?series=${encodeURIComponent(video.series)}`;
        } else {
            // For movies, go directly to play
            window.location.href = `/play?series=${encodeURIComponent(video.series)}&id=${encodeURIComponent(video.video_id)}`;
        }
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

// Auto-focus first card for TV browsers
window.addEventListener('load', function() {
    // Load current user info first
    loadCurrentUser();
    
    // Load continue watching content
    loadContinueWatching();
    
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