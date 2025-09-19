// Movies page JavaScript

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

// Load continue watching movies
async function loadContinueWatching() {
    try {
        console.log('Loading continue watching movies...');
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
            // Filter only movies (assuming movies are single files, not series)
            const movies = continueWatching.filter(video =>
                !video.series.includes('Season') &&
                !video.series.includes('Episode') &&
                !video.series.includes('S0')
            );
            renderContinueWatching(movies);
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
    thumbnail.src = `/api/thumbnail/file/${video.series}/${video.video_id}`;
    thumbnail.alt = video.video_id;

    // Duration badge (show completion percentage)
    const durationBadge = document.createElement('div');
    durationBadge.className = 'episode-count';
    durationBadge.textContent = `${video.completion_percentage}%`;

    // Card content
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';

    const cardTitle = document.createElement('h3');
    cardTitle.className = 'card-title';
    cardTitle.textContent = video.video_id;

    const cardMeta = document.createElement('div');
    cardMeta.className = 'card-meta';

    // Series and progress row
    const progressRow = document.createElement('div');
    progressRow.className = 'card-meta-row';
    progressRow.innerHTML = `
        <span class="card-duration">${video.series}</span>
        <span>•</span>
        <span class="card-last-viewed">${video.completion_percentage}% watched</span>
    `;

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
        window.location.href = `/play?series=${encodeURIComponent(video.series)}&id=${encodeURIComponent(video.video_id)}`;
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

// Load movies and display them
document.addEventListener('DOMContentLoaded', async function () {
    console.log('🎬 Movies page loaded');
    // Load current user info first
    loadCurrentUser();

    // Load continue watching movies
    loadContinueWatching();
    await loadMovies();
    createHeroSlideshow();
});

async function loadMovies() {
    try {
        console.log('🎬 Loading movies...');
        const response = await fetch('/api/videos/home', {
            headers: { 'x-db-name': 'home' }
        });

        if (!response.ok) {
            throw new Error(`Failed to load movies: ${response.status}`);
        }

        const videos = await response.json();
        console.log('🎬 Raw videos data:', videos);

        // Filter only movies (individual video files, not folders)
        const movies = videos.filter(video => video.id && !video.isFolder);
        console.log('🎬 Filtered movies:', movies);

        displayMovies(movies);
        updateMovieCount(movies.length);

    } catch (error) {
        console.error('Error loading movies:', error);
        const container = document.getElementById('movieContainer');
        container.innerHTML = '<div class="error-message">Failed to load movies. Please try again.</div>';
        updateMovieCount(0);
    }
}

function displayMovies(movies) {
    const container = document.getElementById('movieContainer');
    container.innerHTML = '';

    if (movies.length === 0) {
        container.innerHTML = '<div class="no-content">No movies found in your collection.</div>';
        return;
    }

    movies.forEach(movie => {
        const card = renderVideoCard(movie, 'home');
        container.appendChild(card);
    });

    console.log(`🎬 Displayed ${movies.length} movies`);
}

function updateMovieCount(count) {
    const countElement = document.getElementById('movieCount');
    if (countElement) {
        countElement.textContent = `${count} movies`;
    }
}

// Hero Slideshow functions (adapted for movies only)
function createHeroSlideshow() {
    console.log('🎬 Creating movies hero slideshow...');

    fetch('/api/videos/home', {
        headers: { 'x-db-name': 'home' }
    }).then(res => {
        console.log('🎬 Movies API response status:', res.status);
        if (!res.ok) { throw new Error(`Movies API failed with status ${res.status}`); }
        return res.json();
    }).then(videos => {
        console.log('🎬 Raw videos data for slideshow:', videos);

        // Filter only movies and sort by download date
        const movies = videos
            .filter(v => v.id && !v.isFolder)
            .map(v => ({
                ...v,
                type: 'movie',
                actualDownloadDate: new Date(v.modifiedDate || v.createdDate || Date.now()),
                displayDate: new Date(v.modifiedDate || v.createdDate || Date.now())
            }))
            .sort((a, b) => b.actualDownloadDate - a.actualDownloadDate);

        console.log('🎬 Processed movies with download dates:', movies.map(item => ({
            title: item.title,
            type: item.type,
            downloadDate: item.actualDownloadDate.toISOString()
        })));

        slideshowData = movies.slice(0, 5);
        console.log('🎬 Movies slideshow data:', slideshowData);

        if (slideshowData.length > 0) {
            buildSlideshowHTML();
            initSlideshow();
        } else {
            // Hide slideshow if no movies
            const slideshow = document.getElementById('hero-slideshow');
            if (slideshow) slideshow.style.display = 'none';
        }
    }).catch(err => {
        console.error('Error loading movies slideshow data:', err);
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
    console.log('🎬 Building movies slideshow HTML...');
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
            <div class="slide-background" style="background-image: url('/api/thumbnail/file/home/${encodeURIComponent(item.id)}?quality=slideshow')"></div>
            <div class="slide-gradient"></div>
            <div class="slide-content">
                <div class="slide-badge">
                    <span class="slide-type">MOVIE</span>
                    <span class="slide-quality">${extractQuality(item.title)}</span>
                </div>
                <h1 class="slide-title">${cleanVideoTitle(item.title)}</h1>
                <p class="slide-description">Downloaded ${formatDownloadDate(item.actualDownloadDate)} • ${index === 0 ? 'Latest Movie' : 'Recently Added'}</p>
                <div class="slide-metadata">
                    <span class="slide-year">${extractYear(item.title) || '2024'}</span>
                    <span class="slide-duration">${item.duration ? formatTime(item.duration) : '2h 30m'}</span>
                    <span class="slide-rating">TV-MA</span>
                </div>
                <div class="slide-languages">
                    ${extractLanguages(item.title).map(lang => `<span class="lang-badge">${lang}</span>`).join('')}
                </div>
                <div class="slide-actions">
                    <button class="slide-play-btn" onclick="playSlideContent('${item.id}', 'movie')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M8 5v14l11-7z" fill="currentColor"/>
                        </svg>
                        <span>Play Now</span>
                    </button>
                    <button class="slide-info-btn" onclick="showSlideInfo('${item.id}', 'movie')">
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

    console.log('🎬 Movies slideshow HTML built successfully');
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

function playSlideContent(id, type) {
    console.log('🎬 Playing movie from slideshow:', id);
    window.location.href = `/play?series=home&video=${encodeURIComponent(id)}`;
}

function showSlideInfo(id, type) {
    console.log('🎬 Showing movie info from slideshow:', id);
    window.location.href = `/play?series=home&video=${encodeURIComponent(id)}`;
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
    console.log('🎬 Creating fallback movies slideshow...');

    slideshowData = Array.from(cards).slice(0, 5).map((card, index) => {
        const title = card.querySelector('.card-title')?.textContent || 'Unknown Movie';
        const id = card.id || `movie-${index}`;

        return {
            id: id,
            title: title,
            type: 'movie',
            actualDownloadDate: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)), // Simulate recent dates
            displayDate: new Date(Date.now() - (index * 24 * 60 * 60 * 1000))
        };
    });

    if (slideshowData.length > 0) {
        buildSlideshowHTML();
        initSlideshow();
    }
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
