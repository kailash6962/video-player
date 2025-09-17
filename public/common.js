function renderVideoCard(video) {
    const params = new URLSearchParams(window.location.search);
    const series = params.get('series');
    const getvideo = params.get('video');
    const nowPlaying = video.active || video.id == getvideo ? true : false;

    const card = document.createElement('div');
    card.className = 'netflix-card';
    card.id = video.id;
    card.setAttribute('tabindex', '0');

    // Create thumbnail
    const thumbnail = document.createElement('img');
    thumbnail.className = 'card-thumbnail';
    thumbnail.src = `/api/thumbnail/file/${series || 'home'}/${video.id}`;
    thumbnail.alt = cleanVideoTitle(video.title);

    // Duration badge
    const durationBadge = document.createElement('div');
    durationBadge.className = 'episode-count';
    durationBadge.textContent = formatTime(video.duration);

    // Card content (always visible)
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';

    const cardTitle = document.createElement('h3');
    cardTitle.className = 'card-title';
    cardTitle.textContent = cleanVideoTitle(video.title);

    const cardMeta = document.createElement('div');
    cardMeta.className = 'card-meta';

    // Duration row
    const durationRow = document.createElement('div');
    durationRow.className = 'card-meta-row';
    durationRow.innerHTML = `
        <span class="card-duration">${formatTime(video.duration)}</span>
        <span>•</span>
        <span class="card-last-viewed">Last: ${video.lastOpened ? convertDate(video.lastOpened) : 'Never'}</span>
    `;

    // Watch status row
    const statusRow = document.createElement('div');
    statusRow.className = 'card-meta-row';
    const watchStatus = (video.duration - 5) <= video.current_time ? 'Watched ✅' : '';
    statusRow.innerHTML = `<span>${watchStatus}</span>`;

    cardMeta.appendChild(durationRow);
    cardMeta.appendChild(statusRow);
    cardContent.appendChild(cardTitle);
    cardContent.appendChild(cardMeta);

    // Progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'card-progress';

    const progressBar = document.createElement('div');
    progressBar.className = 'card-progress-bar';

    // Calculate watched percentage
    const currentTime = video.current_time || 0;
    const watchedPercentage = (currentTime / video.duration) * 100;
    progressBar.style.width = watchedPercentage + '%';

    progressContainer.appendChild(progressBar);

    // "Watching Now" overlay
    if (nowPlaying) {
        const watchingOverlay = document.createElement('div');
        watchingOverlay.className = 'watching-overlay';
        watchingOverlay.textContent = 'Watching Now';
        card.appendChild(watchingOverlay);
    }

    // Assemble card
    card.appendChild(thumbnail);
    card.appendChild(durationBadge);
    card.appendChild(cardContent);
    card.appendChild(progressContainer);

    // Event listeners
    if (series) {
        card.addEventListener('click', () => playVideo(video));
    } else {
        card.addEventListener('click', () => window.location.href = `/play?series=home&video=${video.id}`);
    }

    // Keyboard support
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
        }
    });

    if (getvideo && getvideo == video.id) playVideo(video, false)
    if (!getvideo && video.active && series) playVideo(video, false)

    return card;
}
function convertDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}
function formatTime(seconds) {
    if (!seconds || seconds < 0) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    // Format seconds with leading zero
    const formattedSecs = secs.toString().padStart(2, '0');
    const formattedMins = minutes.toString().padStart(2, '0');

    if (hours > 0) {
        const formattedHours = hours.toString().padStart(2, '0');
        return `${formattedHours}:${formattedMins}:${formattedSecs}`;
    } else {
        return `${minutes}:${formattedSecs}`;
    }
}
function playVideo(videodata, play = true) {
    loader.style.display = 'flex';
    // Video data loaded

    // Update video titles - check if elements exist
    const videoTitle = document.getElementById('video-title');
    const playerTitle = document.getElementById('player-title');

    if (videoTitle) {
        videoTitle.innerText = cleanVideoTitle(videodata.title);
    }
    if (playerTitle) {
        playerTitle.innerText = cleanVideoTitle(videodata.title);
    }

    currentVideoId = videodata.id;
    currentVideoDuration = videodata.duration;
    startTime = 0;
    // Show the player container
    playerContainer.style.display = 'block';
    // Set the video source. Note: We are using our API to stream the video.
    videoPlayer.src = `/api/video/${series}/${videodata.id}`;

    manualDuration = videodata.duration;

    // Load audio tracks for the current video
    if (typeof clearAudioTracks === 'function') {
        clearAudioTracks();
    }
    if (typeof clearSubtitleTracks === 'function') {
        clearSubtitleTracks();
    }
    if (typeof loadAudioTracks === 'function') {
        loadAudioTracks(videodata.id);
    }
    if (typeof loadSubtitleTracks === 'function') {
        loadSubtitleTracks(videodata.id);
    }

    // Update movie info panel with current video data
    if (typeof updateMovieInfoPanel === 'function') {
        updateMovieInfoPanel(videodata);
    }

    //overlay watching now
    // Remove existing overlay (if any)
    const oldOverlay = document.querySelector('.thumbnailoverlay-text');
    if (oldOverlay) oldOverlay.remove();

    // Select the container safely
    const thumbnailContainer = document.querySelector(`#${CSS.escape(videodata.id)} .video-thumbnail-container`);

    // Add new overlay
    if (thumbnailContainer) {
        const overlayTextContainer = document.createElement('div');
        overlayTextContainer.className = 'thumbnailoverlay-text';
        overlayTextContainer.textContent = "Watching Now";
        thumbnailContainer.appendChild(overlayTextContainer);
    } else {
        // Thumbnail container not found
    }
    //overlay watching now

    // Fetch the saved watch progress for this video
    fetch(`/api/watch-progress/${videodata.id}`, {
        method: 'GET',
        headers: {
            'x-db-name': series
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.current_time && data.current_time > 0) {
                // Convert current_time to seconds if it's in HH:MM:SS format
                let startTimeSeconds = 0;
                if (typeof data.current_time === 'string' && data.current_time.includes(':')) {
                    // HH:MM:SS format - convert to seconds
                    const timeParts = data.current_time.split(':');
                    startTimeSeconds = (parseInt(timeParts[0]) * 3600) +
                        (parseInt(timeParts[1]) * 60) +
                        parseFloat(timeParts[2]);
                } else {
                    // Already in seconds
                    startTimeSeconds = parseFloat(data.current_time) || 0;
                }

                startTime = startTimeSeconds;
                const url = new URL(video.src);
                url.searchParams.set('start', startTimeSeconds); // update or add start param
                video.src = url.toString();
            } else {
                const url = new URL(video.src);
                url.searchParams.set('start', 0); // update or add start param
                video.src = url.toString();
            }
            video.load();                            // reload video with new source
            if (play)
                video.play();
        })
        .catch(err => {
            // Error fetching watch progress handled silently
            if (play)
                videoPlayer.play();
        });
}

function cleanVideoTitle(title) {
    // Original title

    // Remove domain-like prefix ending with ' - ' (more specific pattern)
    let cleanTitle = title.replace(/^(www\.[\w.-]+)\s*-\s*/i, '');
    // After domain removal

    // Remove everything after the first bracket or parenthesis (technical details)
    // But preserve the main movie title
    cleanTitle = cleanTitle.replace(/\s*[\[\(].*$/i, '');
    // After bracket removal

    // Remove standalone year at the end (but not if it's part of the title)
    cleanTitle = cleanTitle.replace(/\s*\(\d{4}\)\s*$/i, '');
    // After year removal

    // Remove file extensions
    cleanTitle = cleanTitle.replace(/\.[^/.]+$/, '');
    // After extension removal

    // Clean up extra spaces and trailing dashes
    cleanTitle = cleanTitle.replace(/\s*-\s*$/, '').trim();
    // Final cleaned title

    return cleanTitle || title; // Fallback to original if cleaning results in empty string
}

// Header scroll effect
function initHeaderScrollEffect() {
    const header = document.querySelector('.netflix-header');
    if (!header) return;

    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScrollY = currentScrollY;
    });
}

// Initialize header effects when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderScrollEffect);
} else {
    initHeaderScrollEffect();
}

// Extract movie metadata from filename
function extractMovieMetadata(filename) {
    const metadata = {
        title: cleanVideoTitle(filename),
        year: null,
        quality: null,
        languages: [],
        format: null,
        size: null
    };

    // Extract year
    const yearMatch = filename.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
        metadata.year = yearMatch[0];
    }

    // Extract quality
    const qualityMatch = filename.match(/(4K|2160p|1080p|720p|480p)/i);
    if (qualityMatch) {
        metadata.quality = qualityMatch[0].toUpperCase();
    }

    // Extract languages
    const langMatches = filename.match(/\[(.*?)\]|\((.*?)\)/g);
    if (langMatches) {
        langMatches.forEach(match => {
            const content = match.replace(/[\[\]()]/g, '');
            if (content.match(/(Hindi|Tamil|Telugu|Malayalam|Kannada|English|Eng|Hin|Tam|Tel|Mal|Kan)/i)) {
                const langs = content.split(/[+&,]/).map(lang => lang.trim());
                langs.forEach(lang => {
                    const normalizedLang = normalizeLangName(lang);
                    if (normalizedLang && !metadata.languages.includes(normalizedLang)) {
                        metadata.languages.push(normalizedLang);
                    }
                });
            }
        });
    }

    // Extract format
    const formatMatch = filename.match(/(BluRay|WEB-DL|HDRip|CAMRip|DVDRip|BRRip|HEVC|x264|x265)/i);
    if (formatMatch) {
        metadata.format = formatMatch[0];
    }

    return metadata;
}

function normalizeLangName(lang) {
    const langMap = {
        'hin': 'Hindi',
        'hindi': 'Hindi',
        'tam': 'Tamil',
        'tamil': 'Tamil',
        'tel': 'Telugu',
        'telugu': 'Telugu',
        'mal': 'Malayalam',
        'malayalam': 'Malayalam',
        'kan': 'Kannada',
        'kannada': 'Kannada',
        'eng': 'English',
        'english': 'English'
    };

    return langMap[lang.toLowerCase()] || null;
}

// Format file size
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '-';

    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Format video resolution
function formatResolution(width, height) {
    if (!width || !height) return '-';
    return `${width}x${height}`;
}

// Update Netflix hero banner and movie info panel
function updateMovieInfoPanel(videoData, audioTracks = [], videoMetadata = {}) {
    if (!videoData) return;

    const metadata = extractMovieMetadata(videoData.title);

    // Update hero banner
    updateHeroBanner(videoData, metadata);

    // Update detailed info sections
    updateMovieDetails(videoData, metadata, videoMetadata);

    // Update audio tracks
    updateAudioTracksInfo(audioTracks);

    // Update viewing history
    updateViewingHistory(videoData);
}

function updateHeroBanner(videoData, metadata) {
    // Set background image from thumbnail
    const params = new URLSearchParams(window.location.search);
    const series = params.get('series') || 'home';
    const heroBackground = document.getElementById('hero-background-image');
    if (heroBackground) {
        heroBackground.style.backgroundImage = `url(/api/thumbnail/file/${series}/${videoData.id})`;
    }

    // Update main content
    updateElement('video-title', metadata.title);

    // Update content type based on series
    const isMovie = series === 'home';
    updateElement('content-type', isMovie ? 'FILM' : 'SERIES');

    // Update main metadata
    updateElement('content-category', isMovie ? 'Movie' : 'Show');
    updateElement('movie-genre', getGenreFromMetadata(metadata));
    updateElement('movie-year', metadata.year || '2025');
    updateElement('movie-duration', formatTime(videoData.duration));
    updateElement('movie-rating', 'TV-MA');

    // Update file quality info
    const qualityInfo = generateFileQualityInfo(videoData, metadata);
    updateElement('file-quality-info', qualityInfo);

    // Update language badges
    updateHeroLanguageBadges(metadata.languages);

    // Update detailed information
    updateMainCardDetails(videoData);

    // Setup hero action buttons
    setupHeroActions(videoData);
}

function updateMainCardDetails(videoData) {
    // Update video details
    updateElement('video-resolution', '1920x1080'); // This would come from actual metadata
    updateElement('video-codec', 'H.264'); // This would come from actual metadata

    // Count audio tracks (this would be dynamic)
    updateElement('audio-track-count', '4 languages');

    // Update viewing history
    const lastViewedText = videoData.lastOpened ? convertDate(videoData.lastOpened) : 'Never';
    updateElement('last-viewed-info', lastViewedText);

    // Calculate and update watch progress
    const progress = videoData.current_time && videoData.duration
        ? Math.round((videoData.current_time / videoData.duration) * 100)
        : 0;
    updateElement('watch-progress-info', `${progress}%`);
}

function generateFileQualityInfo(videoData, metadata) {
    // Extract audio info from filename or generate based on common patterns
    const filename = videoData.title;

    // Try to extract quality info from filename
    let qualityInfo = '';

    // Look for audio formats
    if (filename.match(/DD\+?5\.1/i)) {
        qualityInfo += 'DD+5.1';
    } else if (filename.match(/DTS/i)) {
        qualityInfo += 'DTS';
    } else if (filename.match(/AAC/i)) {
        qualityInfo += 'AAC';
    } else {
        qualityInfo += 'DD+5.1';
    }

    // Look for bitrate
    const bitrateMatch = filename.match(/(\d+)k?bps/i);
    if (bitrateMatch) {
        qualityInfo += ` - ${bitrateMatch[1]}Kbps`;
    } else {
        qualityInfo += ' - 640Kbps';
    }

    // Add secondary audio format
    if (filename.match(/AAC/i) && !qualityInfo.includes('AAC')) {
        qualityInfo += ' & AAC';
    }

    // Add file size
    if (videoData.fileSize) {
        const sizeInGB = (videoData.fileSize / (1024 * 1024 * 1024)).toFixed(1);
        qualityInfo += ` - ${sizeInGB}GB`;
    } else {
        qualityInfo += ' - 20.8GB';
    }

    // Add subtitle info
    if (filename.match(/ESub|Sub/i)) {
        qualityInfo += ' - ESub';
    }

    return qualityInfo;
}

function updateHeroLanguageBadges(languages) {
    const container = document.getElementById('hero-languages-container');
    if (!container) return;

    container.innerHTML = '';

    // If no languages detected from filename, use common ones
    const languagesToShow = languages.length > 0 ? languages : ['Tamil', 'Telugu', 'Malayalam', 'Kannada'];

    languagesToShow.forEach(lang => {
        const badge = document.createElement('span');
        badge.className = 'hero-lang-badge';
        badge.textContent = lang;
        container.appendChild(badge);
    });
}

function updateMovieDetails(videoData, metadata, videoMetadata) {
    // Update modal content
    updateModalContent(videoData, metadata, videoMetadata);
}

function updateModalContent(videoData, metadata, videoMetadata) {
    // Update modal title
    updateElement('modal-video-title', metadata.title);

    // Update description
    const description = generateMovieDescription(metadata);
    updateElement('modal-movie-description', description, true);

    // Update technical details
    updateElement('modal-video-resolution', formatResolution(videoMetadata.width, videoMetadata.height));
    updateElement('modal-video-codec', videoMetadata.videoCodec || 'H.264');
    updateElement('modal-movie-size', formatFileSize(videoData.fileSize));
    updateElement('modal-movie-duration', formatTime(videoData.duration));
    updateElement('modal-video-bitrate', videoMetadata.videoBitrate || '-');
    updateElement('modal-video-fps', videoMetadata.frameRate || '-');

    // Update viewing history in modal
    updateElement('modal-main-video-lastviewed', videoData.lastOpened ? convertDate(videoData.lastOpened) : 'Never');

    const progress = videoData.current_time && videoData.duration
        ? Math.round((videoData.current_time / videoData.duration) * 100)
        : 0;
    updateElement('modal-watch-progress', `${progress}%`);
    updateElement('modal-times-watched', '1'); // This could be tracked separately
}

function updateViewingHistory(videoData) {
    // The main-video-lastviewed element is now handled in the hero banner
    // and modal separately, so we don't need to update it here

    // Calculate watch progress
    const progress = videoData.current_time && videoData.duration
        ? Math.round((videoData.current_time / videoData.duration) * 100)
        : 0;
    updateElement('watch-progress', `${progress}%`);
}

function getGenreFromMetadata(metadata) {
    // Extract genre from filename or default to common genres
    const commonGenres = ['Action', 'Drama', 'Thriller', 'Comedy', 'Adventure', 'Sci-Fi'];
    return commonGenres[Math.floor(Math.random() * commonGenres.length)];
}

function setupHeroActions(videoData) {
    const playButton = document.getElementById('hero-play-btn');
    const infoButton = document.getElementById('hero-info-btn');

    if (playButton) {
        // Remove existing listeners to prevent duplicates
        playButton.replaceWith(playButton.cloneNode(true));
        const newPlayButton = document.getElementById('hero-play-btn');
        newPlayButton.addEventListener('click', () => {
            // Trigger video play
            const videoPlayer = document.getElementById('videoPlayer');
            if (videoPlayer) {
                videoPlayer.play();
            }
        });
    }

    if (infoButton) {
        // Remove existing listeners to prevent duplicates
        infoButton.replaceWith(infoButton.cloneNode(true));
        const newInfoButton = document.getElementById('hero-info-btn');
        newInfoButton.addEventListener('click', () => {
            // Show movie info modal
            showMovieInfoModal();
        });
    }

    // Setup modal event listeners (only once)
    if (!window.modalListenersSetup) {
        setupModalEventListeners();
        window.modalListenersSetup = true;
    }
}

function showMovieInfoModal() {
    const modal = document.getElementById('movie-info-modal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function hideMovieInfoModal() {
    const modal = document.getElementById('movie-info-modal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
}

function setupModalEventListeners() {
    const modal = document.getElementById('movie-info-modal');
    const modalClose = document.getElementById('modal-close');
    const modalOverlay = document.getElementById('modal-overlay');

    // Close modal on X button click
    if (modalClose) {
        modalClose.addEventListener('click', hideMovieInfoModal);
    }

    // Close modal on overlay click
    if (modalOverlay) {
        modalOverlay.addEventListener('click', hideMovieInfoModal);
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
            hideMovieInfoModal();
        }
    });
}

function updateElement(id, value, isHTML = false) {
    const element = document.getElementById(id);
    if (element) {
        if (isHTML) {
            element.innerHTML = value;
        } else {
            element.textContent = value;
        }
    } else {
        // Element with id not found
    }
}

function updateAudioTracksInfo(audioTracks) {
    // Update modal audio tracks
    updateModalAudioTracks(audioTracks);

    // Update main card audio track count
    const trackCount = audioTracks.length;
    const trackText = trackCount === 1 ? '1 language' : `${trackCount} languages`;
    updateElement('audio-track-count', trackText);
}

function updateModalAudioTracks(audioTracks) {
    const container = document.getElementById('modal-audio-tracks-info');
    if (!container || !audioTracks.length) return;

    container.innerHTML = '';

    audioTracks.forEach(track => {
        const trackElement = document.createElement('div');
        trackElement.className = 'modal-audio-track';

        // Create quality description
        let qualityDesc = '';
        let detailsDesc = '';

        if (track.codec && track.channels) {
            const codecText = track.codec.toUpperCase();
            const channelType = track.channels === 6 ? '5.1' :
                track.channels === 8 ? '7.1' :
                    track.channels > 2 ? `${track.channels}.0` : '2.0';
            qualityDesc = `${codecText} ${channelType}`;

            // Add bitrate info
            const bitrateText = track.bitrate ? `${Math.round(track.bitrate / 1000)}kbps` : '';
            const qualityLevel = track.bitrate && track.bitrate > 400000 ? 'High' : 'Low';
            qualityDesc = qualityLevel + (bitrateText ? ` - ${bitrateText}` : '');

            // Create details
            const sampleText = track.sampleRate ? `${Math.round(track.sampleRate / 1000)}kHz` : '';
            detailsDesc = `${codecText} ${track.channels} channels${sampleText ? ' ' + sampleText : ''}`;
        } else {
            qualityDesc = track.quality || 'Standard';
            detailsDesc = 'Audio track details unavailable';
        }

        trackElement.innerHTML = `
            <div class="modal-audio-header">
                <span class="modal-audio-language">${track.language || 'Unknown'}</span>
                <span class="modal-audio-quality">${qualityDesc}</span>
            </div>
            <div class="modal-audio-details">${detailsDesc}</div>
        `;

        container.appendChild(trackElement);
    });
}

function generateMovieDescription(metadata) {
    const title = metadata.title;
    const year = metadata.year || '2024';
    const languages = metadata.languages.length > 0 ? metadata.languages.join(', ') : 'Multiple';

    return `<p><strong>${title}</strong> (${year}) is an action-packed adventure drama featuring stunning visuals and compelling storytelling. Available in ${languages} with high-quality audio and video.</p>
    <p>This movie delivers an immersive cinematic experience with excellent production values and engaging performances. Watch in your preferred language with crystal-clear audio quality.</p>`;
}