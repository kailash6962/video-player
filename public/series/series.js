// Series page JavaScript

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
        console.error('Error loading user:', error);
        window.location.href = '/';
    }
}

// Load continue watching series
async function loadContinueWatching() {
    try {
        console.log('Loading continue watching series...');
        const response = await fetch('/api/users/continue-watching', {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        console.log('Continue watching response status:', response.status);

        if (response.ok) {
            const continueWatching = await response.json();
            console.log('Continue watching data:', continueWatching);
            // Filter only series (assuming series contain Season, Episode, or S0)
            const series = continueWatching.filter(video =>
                video.series.includes('Season') ||
                video.series.includes('Episode') ||
                video.series.includes('S0')
            );
            renderContinueWatching(series);
        } else if (response.status === 304) {
            console.log('Continue watching: 304 Not Modified - using cached data');
            renderContinueWatching([]);
        } else {
            console.error('Continue watching failed with status:', response.status);
        }
    } catch (error) {
        console.error('Error loading continue watching:', error);
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

// Slideshow variables
let currentSlide = 0;
let slideshowData = [];
let slideshowInterval;
const SLIDESHOW_INTERVAL = 5000; // 5 seconds per slide

// Audio track controls
let currentAudioTracks = [];
let currentAudioTrackIndex = 0;
let currentLoadingVideoId = null;

const videoPlayer = document.getElementById('videoPlayer');
const audioTrackButton = document.getElementById('audioTrackButton');
const audioTrackMenu = document.getElementById('audioTrackMenu');

// Load series and display them
document.addEventListener('DOMContentLoaded', async function () {
    console.log('🎬 Series page loaded');
    // Load current user info first
    loadCurrentUser();

    // Load continue watching series
    loadContinueWatching();
    await loadSeries();
    createHeroSlideshow();
});

async function loadSeries() {
    try {
        console.log('🎬 Loading series...');
        const response = await fetch('/api/get-all-folders', {
            headers: { 'x-db-name': 'home' }
        });

        if (!response.ok) {
            throw new Error(`Failed to load series: ${response.status}`);
        }

        const folders = await response.json();
        console.log('🎬 Raw folders data:', folders);

        // Filter series (folders with multiple episodes)
        const series = folders.filter(folder => folder.videoCount > 0);
        console.log('🎬 Filtered series:', series);

        displaySeries(series);
        updateSeriesCount(series.length);

    } catch (error) {
        console.error('Error loading series:', error);
        const container = document.getElementById('seriesContainer');
        container.innerHTML = '<div class="error-message">Failed to load series. Please try again.</div>';
        updateSeriesCount(0);
    }
}

function displaySeries(series) {
    const container = document.getElementById('seriesContainer');
    container.innerHTML = '';

    if (series.length === 0) {
        container.innerHTML = '<div class="no-content">No series found in your collection.</div>';
        return;
    }

    series.forEach(folder => {
        const card = renderFolderCard(folder);
        container.appendChild(card);
    });

    console.log(`🎬 Displayed ${series.length} series`);
}

function updateSeriesCount(count) {
    const countElement = document.getElementById('seriesCount');
    if (countElement) {
        countElement.textContent = `${count} series`;
    }
}

function renderFolderCard(folder) {
    const card = document.createElement('div');
    card.className = 'netflix-card series-card';
    card.id = folder.name;

    // Create thumbnail
    const thumbnail = document.createElement('img');
    thumbnail.className = 'card-thumbnail';
    thumbnail.src = `/api/thumbnail/folder/${encodeURIComponent(folder.name)}/${encodeURIComponent(folder.name)}`;
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
    cardTitle.textContent = cleanVideoTitle(folder.name);

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
        window.location.href = `/play?series=${encodeURIComponent(folder.name)}`;
    });

    // Keyboard support
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
        }
    });

    // Make focusable for TV navigation
    card.setAttribute('tabindex', '0');

    return card;
}

// Hero Slideshow functions (adapted for series only)
function createHeroSlideshow() {
    console.log('🎬 Creating series hero slideshow...');

    fetch('/api/get-all-folders', {
        headers: { 'x-db-name': 'home' }
    }).then(res => {
        console.log('🎬 Series API response status:', res.status);
        if (!res.ok) { throw new Error(`Series API failed with status ${res.status}`); }
        return res.json();
    }).then(folders => {
        console.log('🎬 Raw folders data for slideshow:', folders);

        // Filter series and sort by most recent file date
        const series = folders
            .filter(f => f.videoCount > 0)
            .map(f => ({
                ...f,
                type: 'series',
                actualDownloadDate: new Date(f.mostRecentFileDate || f.modifiedDate || f.createdDate || Date.now()),
                displayDate: new Date(f.mostRecentFileDate || f.modifiedDate || f.createdDate || Date.now())
            }))
            .sort((a, b) => b.actualDownloadDate - a.actualDownloadDate);

        console.log('🎬 Processed series with download dates:', series.map(item => ({
            title: item.name,
            type: item.type,
            downloadDate: item.actualDownloadDate.toISOString()
        })));

        slideshowData = series.slice(0, 5);
        console.log('🎬 Series slideshow data:', slideshowData);

        if (slideshowData.length > 0) {
            buildSlideshowHTML();
            initSlideshow();
        } else {
            // Hide slideshow if no series
            const slideshow = document.getElementById('hero-slideshow');
            if (slideshow) slideshow.style.display = 'none';
        }
    }).catch(err => {
        console.error('Error loading series slideshow data:', err);
        console.log('🎬 Attempting fallback: using existing page data...');

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
        }, 2000);
    });
}

function buildSlideshowHTML() {
    console.log('🎬 Building series slideshow HTML...');
    const slideshowContainer = document.querySelector('.slideshow-container');
    const indicatorsContainer = document.getElementById('slide-indicators');

    if (!slideshowContainer || !indicatorsContainer) {
        console.error('Slideshow containers not found');
        return;
    }

    // Clear existing content
    slideshowContainer.innerHTML = '';
    indicatorsContainer.innerHTML = '';

    slideshowData.forEach((item, index) => {
        // Create slide
        const slide = document.createElement('div');
        slide.className = `slide ${index === 0 ? 'active' : ''}`;

        slide.innerHTML = `
            <div class="slide-background" style="background-image: url('/api/thumbnail/folder/home/${encodeURIComponent(item.name)}?quality=slideshow')"></div>
            <div class="slide-gradient"></div>
            <div class="slide-content">
                <div class="slide-badge">
                    <span class="slide-type">SERIES</span>
                    <span class="slide-quality">${extractQuality(item.name)}</span>
                </div>
                <h1 class="slide-title">${cleanVideoTitle(item.name)}</h1>
                <p class="slide-description">Downloaded ${formatDownloadDate(item.actualDownloadDate)} • ${index === 0 ? 'Latest Series' : 'Recently Added'}</p>
                <div class="slide-metadata">
                    <span class="slide-year">${extractYear(item.name) || '2024'}</span>
                    <span class="slide-duration">${item.videoCount} Episodes</span>
                    <span class="slide-rating">TV-MA</span>
                </div>
                <div class="slide-languages">
                    ${extractLanguages(item.name).map(lang => `<span class="lang-badge">${lang}</span>`).join('')}
                </div>
                <div class="slide-actions">
                    <button class="slide-play-btn" onclick="playSlideContent('${item.name}', 'series')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M8 5v14l11-7z" fill="currentColor"/>
                        </svg>
                        <span>Play Now</span>
                    </button>
                    <button class="slide-info-btn" onclick="showSlideInfo('${item.name}', 'series')">
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

        slideshowContainer.appendChild(slide);

        // Create indicator dot
        const dot = document.createElement('div');
        dot.className = `slide-dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(index));
        indicatorsContainer.appendChild(dot);
    });

    console.log('🎬 Series slideshow HTML built successfully');
}

function initSlideshow() {
    // Set up navigation controls
    const prevBtn = document.getElementById('slide-prev');
    const nextBtn = document.getElementById('slide-next');

    if (prevBtn) prevBtn.addEventListener('click', () => changeSlide(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeSlide(1));

    // Start auto-advance
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

    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');

    currentSlide = (currentSlide + direction + slides.length) % slides.length;

    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slide-dot');

    if (slides.length === 0 || index < 0 || index >= slides.length) return;

    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');

    currentSlide = index;

    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function startSlideshow() {
    stopSlideshow();
    if (slideshowData.length > 1) {
        slideshowInterval = setInterval(() => {
            changeSlide(1);
        }, SLIDESHOW_INTERVAL);
    }
}

function stopSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }
}

function playSlideContent(name, type) {
    console.log('🎬 Playing series from slideshow:', name);
    window.location.href = `/play?series=${encodeURIComponent(name)}`;
}

function showSlideInfo(name, type) {
    console.log('🎬 Showing series info from slideshow:', name);
    window.location.href = `/play?series=${encodeURIComponent(name)}`;
}

// Helper functions for slideshow
function extractQuality(title) {
    if (!title) return 'HD';
    if (title.includes('4K') || title.includes('2160p')) return '4K';
    if (title.includes('1080p')) return 'HD';
    if (title.includes('720p')) return 'HD';
    return 'SD';
}

function extractYear(title) {
    if (!title) return null;
    const yearMatch = title.match(/\((\d{4})\)|(\d{4})/);
    return yearMatch ? yearMatch[1] || yearMatch[2] : null;
}

function extractLanguages(title) {
    if (!title) return ['English'];
    const langPatterns = {
        'Tam': 'Tamil',
        'Tel': 'Telugu',
        'Hin': 'Hindi',
        'Mal': 'Malayalam',
        'Kan': 'Kannada',
        'Eng': 'English',
        'Tamil': 'Tamil',
        'Telugu': 'Telugu',
        'Hindi': 'Hindi',
        'Malayalam': 'Malayalam',
        'Kannada': 'Kannada',
        'English': 'English'
    };

    const foundLangs = [];
    for (const [pattern, lang] of Object.entries(langPatterns)) {
        if (title.includes(pattern) && !foundLangs.includes(lang)) {
            foundLangs.push(lang);
        }
    }

    return foundLangs.length > 0 ? foundLangs.slice(0, 4) : ['English'];
}

function formatDownloadDate(date) {
    if (!date) return 'recently';

    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMinutes < 5) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks === 1) return '1 week ago';
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    if (diffMonths === 1) return '1 month ago';
    if (diffMonths < 12) return `${diffMonths} months ago`;

    return new Date(date).toLocaleDateString();
}

function createFallbackSlideshow(cards) {
    console.log('🎬 Creating fallback series slideshow...');

    slideshowData = Array.from(cards).slice(0, 5).map((card, index) => {
        const title = card.querySelector('.card-title')?.textContent || 'Unknown Series';
        const name = card.id || `series-${index}`;

        return {
            name: name,
            title: title,
            type: 'series',
            videoCount: Math.floor(Math.random() * 20) + 5, // Random episode count for fallback
            actualDownloadDate: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)), // Simulate recent dates
            displayDate: new Date(Date.now() - (index * 24 * 60 * 60 * 1000))
        };
    });

    if (slideshowData.length > 0) {
        buildSlideshowHTML();
        initSlideshow();
    }
}

// Utility functions
function convertDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
}

// Audio track functions (from common.js but localized)
function clearAudioTracks() {
    currentAudioTracks = [];
    currentAudioTrackIndex = 0;
    if (audioTrackMenu) {
        audioTrackMenu.innerHTML = '';
        audioTrackMenu.style.display = 'none';
    }
    if (audioTrackButton) {
        audioTrackButton.querySelector('.audio-track-label').textContent = 'Audio';
        audioTrackButton.title = 'Select Audio Track';
    }
}

// Keyboard navigation for TV browsers
document.addEventListener('keydown', function (e) {
    const focusedElement = document.activeElement;
    const cards = Array.from(document.querySelectorAll('.netflix-card'));
    const currentIndex = cards.indexOf(focusedElement);

    // Calculate cards per row dynamically
    if (cards.length > 0) {
        const containerWidth = cards[0].parentElement.clientWidth;
        const cardWidth = cards[0].offsetWidth;
        const gap = 20; // Approximate gap
        const cardsPerRow = Math.floor(containerWidth / (cardWidth + gap));

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                if (currentIndex > 0) {
                    cards[currentIndex - 1].focus();
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (currentIndex < cards.length - 1) {
                    cards[currentIndex + 1].focus();
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex >= cardsPerRow) {
                    cards[currentIndex - cardsPerRow].focus();
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex + cardsPerRow < cards.length) {
                    cards[currentIndex + cardsPerRow].focus();
                }
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (focusedElement && focusedElement.classList.contains('netflix-card')) {
                    focusedElement.click();
                }
                break;
        }
    }
});

// Auto-focus first card for TV browsers
window.addEventListener('load', function () {
    // Detect if this is likely a TV browser
    if (window.matchMedia('(pointer: coarse)').matches) {
        setTimeout(() => {
            const firstCard = document.querySelector('.netflix-card');
            if (firstCard) {
                firstCard.focus();
            }
        }, 1000);
    }

    // Initialize mobile menu
    initializeMobileMenu();
});

// Mobile Menu Functionality
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileSideMenu = document.getElementById('mobileSideMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const mobileUserAvatar = document.getElementById('mobileUserAvatar');
    const mobileUserName = document.getElementById('mobileUserName');

    // Sync mobile user info with desktop
    function syncMobileUserInfo() {
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        
        if (userAvatar && mobileUserAvatar) {
            mobileUserAvatar.textContent = userAvatar.textContent;
        }
        
        if (userName && mobileUserName) {
            mobileUserName.textContent = userName.textContent;
        }
    }

    // Open mobile menu
    function openMobileMenu() {
        mobileSideMenu.classList.add('show');
        mobileMenuBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
        syncMobileUserInfo();
    }

    // Close mobile menu
    function closeMobileMenu() {
        mobileSideMenu.classList.remove('show');
        mobileMenuBtn.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Event listeners
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openMobileMenu);
    }

    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMobileMenu);
    }

    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', closeMobileMenu);
    }

    // Close menu when clicking on nav links
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            setTimeout(closeMobileMenu, 100); // Small delay for smooth transition
        });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileSideMenu.classList.contains('show')) {
            closeMobileMenu();
        }
    });

    // Update active nav link based on current page
    function updateActiveNavLink() {
        const currentPath = window.location.pathname;
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        
        mobileNavLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            if (currentPath === href || (currentPath === '/' && href === '/home')) {
                link.classList.add('active');
            }
        });
    }

    updateActiveNavLink();
}
