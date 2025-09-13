// public/app.js
const videoListEl = document.getElementById('videoList');
const playerContainer = document.getElementById('playerContainer');
const videoPlayer = document.getElementById('videoPlayer');

const video = document.getElementById('videoPlayer');
const loader = document.getElementById('videoLoader');
const playPauseBtn = document.getElementById('playPause');
const playPrevBtn = document.getElementById('playPrev');
const playNextBtn = document.getElementById('playNext');
const seekBar = document.getElementById('seek');
const seekBackwardBtn = document.getElementById('seekBackward');
const seekForwardBtn = document.getElementById('seekForward');
const playPauseAnim = document.getElementById('playPauseAnim');
const audioTrackButton = document.getElementById('audioTrackButton');
const audioTrackMenu = document.getElementById('audioTrackMenu');

// Update play/pause icon
function updatePlayPauseIcon() {
  if (!playPauseBtn) return;
  playPauseBtn.innerHTML = video.paused
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
}

function showPlayPauseAnim(isPlay) {
  if (!playPauseAnim) return;
  playPauseAnim.innerHTML = isPlay
    ? `<svg viewBox="0 0 90 90" fill="white"><circle cx="45" cy="45" r="44" fill="#000a"/><polygon points="36,28 36,62 66,45" fill="white"/></svg>`
    : `<svg viewBox="0 0 90 90" fill="white"><circle cx="45" cy="45" r="44" fill="#000a"/><rect x="32" y="28" width="8" height="34" fill="white"/><rect x="50" y="28" width="8" height="34" fill="white"/></svg>`;
  playPauseAnim.classList.remove('show');
  // Force reflow to restart animation
  void playPauseAnim.offsetWidth;
  playPauseAnim.classList.add('show');
  setTimeout(() => {
    playPauseAnim.classList.remove('show');
    playPauseAnim.style.display = 'none';
  }, 700);
  playPauseAnim.style.display = 'block';
}

// Play/Pause toggle
function togglePlayPause() {
  if (video.paused) {
    video.play();
    showPlayPauseAnim(true);
  } else {
    video.pause();
    showPlayPauseAnim(false);
  }
  updatePlayPauseIcon();
}

// Seek helpers using seek bar
function seekForward() {
  if (!seekBar) return;
  let newValue = Number(seekBar.value) + 10;
  if (seekBar.max) {
    newValue = Math.min(Number(seekBar.max), newValue);
  }
  seekBar.value = newValue;
  seekBar.dispatchEvent(new Event('input'));
  seekBar.dispatchEvent(new Event('change'));
}
function seekBackward() {
  if (!seekBar) return;
  let newValue = Number(seekBar.value) - 10;
  newValue = Math.max(Number(seekBar.min), newValue);
  seekBar.value = newValue;
  seekBar.dispatchEvent(new Event('input'));
  seekBar.dispatchEvent(new Event('change'));
}

// Loader events
loader.style.display = 'none';
if (video && loader) {
  video.addEventListener('waiting', () => {
    loader.style.display = 'flex';
  });
  video.addEventListener('playing', () => {
    loader.style.display = 'none';
  });
  video.addEventListener('canplay', () => {
    loader.style.display = 'none';
  });
  video.addEventListener('seeking', () => {
    loader.style.display = 'flex';
  });
  video.addEventListener('seeked', () => {
    loader.style.display = 'none';
  });
}

// Play/Pause on video click
if (video) {
  video.addEventListener('click', function(e) {
    // Prevent play/pause toggle if a control was clicked
    // (controls are inside playerContainer, so check if the click target is inside .controls)
    const controls = document.querySelector('.controls');
    if (controls && controls.contains(e.target)) {
      return;
    }
    togglePlayPause();
    // showPlayPauseAnim handled in togglePlayPause
  });
  video.addEventListener('play', updatePlayPauseIcon);
  video.addEventListener('pause', updatePlayPauseIcon);
}

// Play/Pause on spacebar, seek on arrow keys
document.addEventListener('keydown', (e) => {
    // console.log("📢[:86]: e.code: ", e.code);
  // Ignore if focused on input/textarea
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.code === 'Space') {
    e.preventDefault();
    togglePlayPause();
  } else if (e.code === 'NonConvert') {
    e.preventDefault();
    seekForward();
  } else if (e.code === 'Convert') {
    e.preventDefault();
    seekBackward();
  }


//   else if (e.code === 'ArrowRight') {
//     e.preventDefault();
//     seekForward();
//   } else if (e.code === 'ArrowLeft') {


});

// Seek on button click
// if (playPrevBtn) playPrevBtn.addEventListener('click', playPrevVideo);
// if (playNextBtn) playNextBtn.addEventListener('click', playNextVideo);
if (playPauseBtn) {
  playPauseBtn.onclick = togglePlayPause;
}

// Seek on new seek buttons click
if (seekBackwardBtn) seekBackwardBtn.addEventListener('click', seekBackward);
if (seekForwardBtn) seekForwardBtn.addEventListener('click', seekForward);

// Map playPrevBtn to playPrevVideo
if (playPrevBtn) playPrevBtn.addEventListener('click', function() {
  playPrevVideo(currentVideoId);
});
if (playNextBtn) playNextBtn.addEventListener('click', function() {
  playNextVideo(currentVideoId);
});

var manualDuration = 0; // seconds

const playPause = document.getElementById('playPause');
const seek = document.getElementById('seek');
const volume = document.getElementById('volume');
const currentTimeEl = document.getElementById('current');
const durationEl = document.getElementById('duration');
var startTime = 0;

let currentVideoId = null;
let currentVideoDuration = null;
let progressUpdateTimeout = null;
let currentAudioTracks = [];
let currentAudioTrackIndex = 0;

const params = new URLSearchParams(window.location.search);

const series = params.get('series');
if(series) {
    document.querySelector('.page-title').innerText = series;
}

fetch(`/api/videos/${series}`, {
    method: 'GET',
    headers: {
        'x-db-name': series
    }
})
    .then(response => response.json())
    .then(videos => {
        console.log("📢[:91]: videos: ", videos);
        const gallery = document.getElementById('videoGallery');
        const moreVideosCount = document.getElementById('moreVideosCount');
        
        videos.forEach((video, index) => {
            const card = renderVideoCard(video);
            // Make focusable for TV browsers
            card.setAttribute('tabindex', '0');
            card.setAttribute('data-index', index);
            gallery.appendChild(card);
        });
        
        // Update count
        if (moreVideosCount) {
            moreVideosCount.textContent = `${videos.length} Video${videos.length !== 1 ? 's' : ''}`;
        }
        
        // Auto-select and click the video card if specified in URL
        const videoParam = params.get('video');
        if (videoParam) {
            console.log("📢 Auto-selecting video from URL:", videoParam);
            // Decode the video parameter
            const decodedVideoParam = decodeURIComponent(videoParam);
            console.log("📢 Decoded video parameter:", decodedVideoParam);
            
            // Find the matching video and its card
            setTimeout(() => {
                const cards = gallery.querySelectorAll('.netflix-card');
                let targetCard = null;
                let targetVideo = null;
                let matchIndex = -1;
                
                // Helper function to check if video matches
                const checkMatch = (video, param, originalParam) => {
                    const videoId = video.id || '';
                    const videoTitle = video.title || '';
                    const videoFilename = video.filename || '';
                    
                    console.log(`🔍 Checking video: ${videoId.substring(0, 50)}...`);
                    console.log(`🔍 Against parameter: ${param.substring(0, 50)}...`);
                    
                    // Exact matches (highest priority) - must be identical
                    if (videoId === param || videoId === originalParam ||
                        videoTitle === param || videoTitle === originalParam ||
                        videoFilename === param || videoFilename === originalParam) {
                        console.log(`✅ EXACT match found!`);
                        return { type: 'exact', priority: 1 };
                    }
                    
                    // High-quality partial matches - significant overlap (80%+ similarity)
                    const calculateSimilarity = (str1, str2) => {
                        if (!str1 || !str2) return 0;
                        const longer = str1.length > str2.length ? str1 : str2;
                        const shorter = str1.length > str2.length ? str2 : str1;
                        if (longer.length === 0) return 1.0;
                        return (longer.length - levenshteinDistance(longer, shorter)) / longer.length;
                    };
                    
                    const levenshteinDistance = (str1, str2) => {
                        const matrix = [];
                        for (let i = 0; i <= str2.length; i++) {
                            matrix[i] = [i];
                        }
                        for (let j = 0; j <= str1.length; j++) {
                            matrix[0][j] = j;
                        }
                        for (let i = 1; i <= str2.length; i++) {
                            for (let j = 1; j <= str1.length; j++) {
                                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                                    matrix[i][j] = matrix[i - 1][j - 1];
                                } else {
                                    matrix[i][j] = Math.min(
                                        matrix[i - 1][j - 1] + 1,
                                        matrix[i][j - 1] + 1,
                                        matrix[i - 1][j] + 1
                                    );
                                }
                            }
                        }
                        return matrix[str2.length][str1.length];
                    };
                    
                    // Check high similarity (90%+ match)
                    const idSimilarity = calculateSimilarity(videoId, param);
                    const titleSimilarity = calculateSimilarity(videoTitle, param);
                    const filenameSimilarity = calculateSimilarity(videoFilename, param);
                    
                    console.log(`📊 Similarity scores: ID=${idSimilarity.toFixed(3)}, Title=${titleSimilarity.toFixed(3)}, Filename=${filenameSimilarity.toFixed(3)}`);
                    
                    if (idSimilarity >= 0.9 || titleSimilarity >= 0.9 || filenameSimilarity >= 0.9) {
                        console.log(`✅ HIGH SIMILARITY match found! (${Math.max(idSimilarity, titleSimilarity, filenameSimilarity).toFixed(3)})`);
                        return { type: 'high-similarity', priority: 2, similarity: Math.max(idSimilarity, titleSimilarity, filenameSimilarity) };
                    }
                    
                    // Medium similarity matches (70-89%)
                    if (idSimilarity >= 0.7 || titleSimilarity >= 0.7 || filenameSimilarity >= 0.7) {
                        console.log(`⚠️ MEDIUM SIMILARITY match found! (${Math.max(idSimilarity, titleSimilarity, filenameSimilarity).toFixed(3)})`);
                        return { type: 'medium-similarity', priority: 3, similarity: Math.max(idSimilarity, titleSimilarity, filenameSimilarity) };
                    }
                    
                    // Normalize and compare (lowest priority)
                    const normalize = (str) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    const normalizedParam = normalize(param);
                    if (normalize(videoId) === normalizedParam ||
                        normalize(videoTitle) === normalizedParam ||
                        normalize(videoFilename) === normalizedParam) {
                        console.log(`✅ NORMALIZED match found!`);
                        return { type: 'normalized', priority: 4 };
                    }
                    
                    console.log(`❌ No match found`);
                    return null;
                };
                
                // Find the best match (prioritize exact matches, then highest similarity)
                let bestMatch = null;
                let bestPriority = 999;
                let bestSimilarity = 0;
                
                for (let index = 0; index < videos.length; index++) {
                    const video = videos[index];
                    const match = checkMatch(video, decodedVideoParam, videoParam);
                    
                    if (match && cards[index]) {
                        // Determine if this is a better match
                        let isBetterMatch = false;
                        
                        if (match.priority < bestPriority) {
                            // Higher priority (lower number) is always better
                            isBetterMatch = true;
                        } else if (match.priority === bestPriority && match.similarity > bestSimilarity) {
                            // Same priority, but higher similarity
                            isBetterMatch = true;
                        }
                        
                        if (isBetterMatch) {
                            bestMatch = match;
                            bestPriority = match.priority;
                            bestSimilarity = match.similarity || 1.0;
                            targetCard = cards[index];
                            targetVideo = video;
                            matchIndex = index;
                            
                            console.log(`🎯 NEW BEST MATCH! Type: ${match.type}, Priority: ${match.priority}, Similarity: ${(match.similarity || 1.0).toFixed(3)}, Index: ${index}`);
                            console.log('📢 Matched video:', { id: video.id, title: video.title, filename: video.filename });
                            
                            // If we found an exact match, stop looking
                            if (match.priority === 1) {
                                console.log('🏆 EXACT match found, stopping search');
                                break;
                            }
                        } else {
                            console.log(`⏭️ Skipping lower quality match: Type: ${match.type}, Priority: ${match.priority}, Similarity: ${(match.similarity || 1.0).toFixed(3)}, Index: ${index}`);
                        }
                    }
                }
                
                if (targetCard && targetVideo) {
                    console.log("📢 Found target video and card:", targetVideo);
                    console.log("📢 Auto-clicking card for:", targetVideo.title || targetVideo.id);
                    
                    // Highlight the card briefly to show it's been selected
                    targetCard.style.transform = 'scale(1.05)';
                    targetCard.style.transition = 'transform 0.3s ease';
                    
                    // Trigger click on the card
                    setTimeout(() => {
                        targetCard.click();
                        // Reset card styling after click
                        setTimeout(() => {
                            targetCard.style.transform = '';
                            targetCard.style.transition = '';
                        }, 300);
                    }, 200);
                    
                } else {
                    console.warn("📢 Target video card not found:", decodedVideoParam);
                    console.log("📢 Available videos:", videos.map(v => ({ id: v.id, title: v.title, filename: v.filename })));
                    console.log("📢 Available cards:", cards.length);
                    
                    // Debug: Show detailed comparison
                    console.log("📢 Detailed video comparison:");
                    videos.forEach((video, index) => {
                        const videoId = video.id || video.title;
                        console.log(`Video ${index}:`, {
                            id: video.id,
                            title: video.title,
                            filename: video.filename,
                            matches_id: videoId === decodedVideoParam,
                            matches_title: video.title === decodedVideoParam,
                            matches_filename: video.filename === decodedVideoParam
                        });
                    });
                }
            }, 600); // Slightly longer delay to ensure cards are rendered
        }
    })
    .catch(err => console.error('Error loading videos:', err));

videoPlayer.addEventListener('timeupdate', () => {
    // Throttle the updates (e.g., update every 5 seconds)
    if (progressUpdateTimeout) return;

    progressUpdateTimeout = setTimeout(() => {
        const current_time = videoPlayer.currentTime;
        const updatedCurrTime = parseInt(startTime) + parseInt(current_time);
        console.log("📢[:163]: updatedCurrTime: ", updatedCurrTime);
        console.log("📢[:165]: currentVideoDuration: ", currentVideoDuration);
        const watchedPercentage = (updatedCurrTime / currentVideoDuration) * 100;
        if(currentVideoId){
            fetch('/api/watch-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-db-name': series },
                body: JSON.stringify({ video_id: currentVideoId, current_time: updatedCurrTime }),
            }).catch(err => console.error('Error saving progress:', err));
            const cardElement = document.getElementById(currentVideoId);
            if (cardElement) {
                const progressBar = cardElement.querySelector('.card-progress-bar');
                if (progressBar) {
                    progressBar.style.width = watchedPercentage + '%';
                }
            }
        }

        progressUpdateTimeout = null;
    }, 5000); // 5000ms = 5 seconds
});

video.addEventListener('ended', () => {
    const currentVID = currentVideoId;
    currentVideoId = false;
    if (confirm('Video finished playing!')) {
        playNextVideo(currentVID);
    } else {
        console.log("Player ended but user chose not to play next video.");
    }

    // You can also trigger other logic here
});

function playNextVideo(currentVideoId) {
    const currentVID = currentVideoId;
    currentVideoId = false;
  const currentVideoElement = document.getElementById(currentVID);
  if (currentVideoElement) {
    const nextElement = currentVideoElement.nextElementSibling;
    if (nextElement) {
      nextElement.click();
    }
  }
}

// Play previous video function
function playPrevVideo(currentVideoId) {
    const currentVID = currentVideoId;
    currentVideoId = false;
  const currentVideoElement = document.getElementById(currentVID);
  if (currentVideoElement) {
    const prevElement = currentVideoElement.previousElementSibling;
    if (prevElement) {
      prevElement.click();
    }
  }
}

//vide player retated


// Optional: manually set duration if it's not detected (e.g. streaming with no metadata)
let isManual = false;

video.addEventListener('loadedmetadata', () => {
    // if (!isFinite(video.duration) || video.duration === Infinity) {
    isManual = true;
    durationEl.textContent = formatTime(manualDuration);
    console.log("📢[:198]: manualDuration: ", manualDuration);
    seek.max = manualDuration;
});

playPause.addEventListener('click', () => {
    if (video.paused) {
        video.play();
        playPause.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6zm8-14v14h4V5h-4z"/>
                </svg>
                `;
    } else {
        video.pause();
        playPause.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
            </svg>`;
    }
});

video.addEventListener('timeupdate', (e) => {
    seek.value = parseInt(startTime) + parseInt(video.currentTime);
    currentTimeEl.textContent = formatTime(seek.value);
    // seek.value = video.currentTime;
});

seek.addEventListener('input', (e) => {
    // video.currentTime = seek.value;
    const url = new URL(video.src);
    url.searchParams.set('start', seek.value); // update or add start param
    video.src = url.toString();
    video.load();                            // reload video with new source
    video.play();

    startTime = seek.value;

    let currTime = formatTime(seek.value);
    currentTimeEl.textContent = currTime;

});

volume.addEventListener('input', () => {
    video.volume = volume.value;
});

//vide player retated

document.getElementById('fullscreenButton').addEventListener('click', () => {
    const playerContainer = document.getElementById('playerContainer');
    const controls = document.querySelector('.controls');
    const playertitle = document.getElementById('player-title');

    if (document.fullscreenElement) {
        document.exitFullscreen();
        controls.style.display = 'flex';
        playertitle.style.display = 'block';
        playerContainer.classList.remove('hide-cursor');
    } else {
        playerContainer.requestFullscreen();
        controls.style.display = 'none';
        playertitle.style.display = 'none';
        playerContainer.classList.remove('hide-cursor');

        // Add hover effect to show controls in fullscreen and manage cursor
        playerContainer.addEventListener('mousemove', () => {
            controls.style.display = 'flex';
            playertitle.style.display = 'block';
            playerContainer.classList.remove('hide-cursor');
            clearTimeout(playerContainer.hideControlsTimeout);
            playerContainer.hideControlsTimeout = setTimeout(() => {
                controls.style.display = 'none';
                playertitle.style.display = 'none';
                if (document.fullscreenElement) {
                  playerContainer.classList.add('hide-cursor');
                }
            }, 2000); // Hide controls and cursor after 2 seconds of inactivity
        });
    }
});

// Also, when exiting fullscreen by other means, remove hide-cursor
document.addEventListener('fullscreenchange', () => {
  const playerContainer = document.getElementById('playerContainer');
  if (!document.fullscreenElement && playerContainer) {
    playerContainer.classList.remove('hide-cursor');
  }
});

// Audio track management functions
let currentLoadingVideoId = null;

function clearAudioTracks() {
  if (!audioTrackButton || !audioTrackMenu) return;
  
  console.log('Clearing audio tracks');
  audioTrackMenu.innerHTML = '';
  audioTrackMenu.style.display = 'none';
  audioTrackButton.style.display = 'none';
  currentAudioTracks = [];
  currentAudioTrackIndex = 0;
  currentLoadingVideoId = null;
}

async function loadAudioTracks(videoId) {
  if (!audioTrackButton || !audioTrackMenu) return;
  
  // Prevent multiple simultaneous loads for the same video
  if (currentLoadingVideoId === videoId) {
    console.log('Audio tracks already loading for video:', videoId);
    return;
  }
  
  currentLoadingVideoId = videoId;
  console.log('Loading audio tracks for video:', videoId);
  
  try {
    const response = await fetch(`/api/audio-tracks/${series}/${videoId}`);
    const data = await response.json();
    
    if (data.error) {
      console.warn('No audio tracks found:', data.error);
      audioTrackButton.style.display = 'none';
      audioTrackMenu.style.display = 'none';
      // Clear existing options even on error
      audioTrackMenu.innerHTML = '';
      currentAudioTracks = [];
      return;
    }
    
    currentAudioTracks = data.tracks;
    
    console.log('Loaded audio tracks:', {
      videoId: videoId,
      totalTracks: currentAudioTracks.length,
      tracks: currentAudioTracks.map(track => ({
        index: track.index,
        streamIndex: track.streamIndex,
        language: track.language,
        quality: track.quality,
        codec: track.codec,
        bitrate: track.bitrate,
        isBrowserCompatible: track.isBrowserCompatible
      }))
    });
    
    // Clear existing options and reset state
    console.log('Clearing existing audio track options');
    audioTrackMenu.innerHTML = '';
    currentAudioTrackIndex = 0; // Reset to first track
    
    // Add audio track options - organize by language and quality
    const languageGroups = {};
    currentAudioTracks.forEach((track, index) => {
      if (!languageGroups[track.language]) {
        languageGroups[track.language] = [];
      }
      languageGroups[track.language].push({ ...track, originalIndex: index });
    });
    
    // Add tracks organized by language
    console.log("language ",languageGroups);
    Object.keys(languageGroups).forEach(language => {
      const tracks = languageGroups[language];
      tracks.forEach(track => {
        const menuItem = document.createElement('div');
        menuItem.className = 'audio-track-menu-item';
        menuItem.dataset.trackIndex = track.originalIndex;
        
        menuItem.innerHTML = `
          <div class="track-info">
            <div class="track-language">${track.language}</div>
            <div class="track-quality">${track.quality} - ${Math.round(track.bitrate/1000)}kbps</div>
          </div>
          <div class="track-checkmark">✓</div>
        `;
        
        audioTrackMenu.appendChild(menuItem);
        console.log(`Added audio track option: index=${track.originalIndex}, language=${track.language}, quality=${track.quality}, displayName=${track.language} (${track.quality} - ${Math.round(track.bitrate/1000)}kbps)`);
      });
    });
    
    // Get current audio track from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlAudioTrack = urlParams.get('audioTrack');
    console.log('URL parameters:', {
      fullURL: window.location.href,
      searchParams: window.location.search,
      audioTrackParam: urlAudioTrack,
      allParams: Object.fromEntries(urlParams.entries())
    });
    
    if (urlAudioTrack !== null) {
      const urlTrackIndex = parseInt(urlAudioTrack);
      console.log('Parsed audio track index from URL:', urlTrackIndex);
      if (urlTrackIndex >= 0 && urlTrackIndex < currentAudioTracks.length) {
        currentAudioTrackIndex = urlTrackIndex;
        console.log('Setting audio track from URL:', urlTrackIndex, 'to track:', currentAudioTracks[urlTrackIndex]);
      } else {
        console.warn('URL audio track index out of range:', urlTrackIndex, 'max:', currentAudioTracks.length - 1);
      }
    }
    
    // Set default selection and update UI
    updateAudioTrackButtonLabel();
    updateActiveMenuItem();
    
    // Update movie info panel with audio tracks
    if (typeof updateAudioTracksInfo === 'function') {
      updateAudioTracksInfo(currentAudioTracks);
    }
    
    if (currentAudioTracks.length > 1) {
      audioTrackButton.style.display = 'flex';
      console.log('Audio tracks found:', currentAudioTracks.length, 'Button should be visible');
    } else {
      audioTrackButton.style.display = 'none';
      console.log('Single audio track, hiding button');
    }
    
  } catch (err) {
    console.error('Error loading audio tracks:', err);
    audioTrackButton.style.display = 'none';
    audioTrackMenu.style.display = 'none';
    // Clear existing options on error
    audioTrackMenu.innerHTML = '';
    currentAudioTracks = [];
  } finally {
    // Clear loading flag
    currentLoadingVideoId = null;
  }
}

function updateAudioTrackButtonLabel() {
  if (!audioTrackButton || !currentAudioTracks[currentAudioTrackIndex]) return;
  
  const currentTrack = currentAudioTracks[currentAudioTrackIndex];
  const label = audioTrackButton.querySelector('.audio-track-label');
  if (label) {
    // Show first 3 letters of language
    label.textContent = currentTrack.language.substring(0, 3).toUpperCase();
  }
  
  // Update button title
  audioTrackButton.title = `Audio Track: ${currentTrack.language} (${currentTrack.quality} - ${Math.round(currentTrack.bitrate/1000)}kbps)`;
}

function updateActiveMenuItem() {
  if (!audioTrackMenu) return;
  
  // Remove active class from all items
  const menuItems = audioTrackMenu.querySelectorAll('.audio-track-menu-item');
  menuItems.forEach(item => {
    item.classList.remove('active');
    const checkmark = item.querySelector('.track-checkmark');
    if (checkmark) checkmark.style.display = 'none';
  });
  
  // Add active class to current track
  const activeItem = audioTrackMenu.querySelector(`[data-track-index="${currentAudioTrackIndex}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
    const checkmark = activeItem.querySelector('.track-checkmark');
    if (checkmark) checkmark.style.display = 'block';
  }
}

function switchAudioTrack(trackIndex) {
  if (!currentVideoId || !currentAudioTracks[trackIndex]) {
    console.warn('Cannot switch audio track:', { currentVideoId, trackIndex, tracksAvailable: currentAudioTracks.length });
    return;
  }
  
  console.log('Switching audio track:', {
    from: currentAudioTrackIndex,
    to: trackIndex,
    track: currentAudioTracks[trackIndex],
    trackDetails: {
      language: currentAudioTracks[trackIndex].language,
      quality: currentAudioTracks[trackIndex].quality,
      codec: currentAudioTracks[trackIndex].codec,
      bitrate: currentAudioTracks[trackIndex].bitrate,
      streamIndex: currentAudioTracks[trackIndex].streamIndex,
      isBrowserCompatible: currentAudioTracks[trackIndex].isBrowserCompatible
    }
  });
  
  currentAudioTrackIndex = trackIndex;
  const currentTime = videoPlayer.currentTime;
  const wasPlaying = !videoPlayer.paused;
  
  // Update UI
  updateAudioTrackButtonLabel();
  updateActiveMenuItem();
  
  // Hide menu after selection
  audioTrackMenu.style.display = 'none';
  
  // Update video source with new audio track
  const url = new URL(videoPlayer.src);
  url.searchParams.set('audioTrack', trackIndex);
  console.log('New video URL:', url.toString());
  videoPlayer.src = url.toString();
  
  // Restore playback state
  videoPlayer.addEventListener('loadeddata', function restorePlayback() {
    videoPlayer.currentTime = currentTime;
    if (wasPlaying) {
      videoPlayer.play();
    }
    videoPlayer.removeEventListener('loadeddata', restorePlayback);
  }, { once: true });
  
  videoPlayer.load();
}

// Audio track button event listeners
if (audioTrackButton) {
  // Toggle menu on button click
  audioTrackButton.addEventListener('click', (e) => {
    e.stopPropagation();
    if (audioTrackMenu.style.display === 'none' || !audioTrackMenu.style.display) {
      audioTrackMenu.style.display = 'block';
    } else {
      audioTrackMenu.style.display = 'none';
    }
  });

  // Keep controls visible when button is focused
  audioTrackButton.addEventListener('focus', () => {
    const controls = document.querySelector('.controls');
    if (controls) {
      controls.classList.add('show-audio-button');
    }
  });

  audioTrackButton.addEventListener('blur', () => {
    const controls = document.querySelector('.controls');
    if (controls) {
      controls.classList.remove('show-audio-button');
    }
  });

  audioTrackButton.addEventListener('mouseenter', () => {
    const controls = document.querySelector('.controls');
    if (controls) {
      controls.classList.add('show-audio-button');
    }
  });

  audioTrackButton.addEventListener('mouseleave', () => {
    const controls = document.querySelector('.controls');
    if (controls) {
      controls.classList.remove('show-audio-button');
    }
  });
}

// Audio track menu event listeners
if (audioTrackMenu) {
  // Handle menu item clicks
  audioTrackMenu.addEventListener('click', (e) => {
    const menuItem = e.target.closest('.audio-track-menu-item');
    if (menuItem) {
      const trackIndex = parseInt(menuItem.dataset.trackIndex);
      if (trackIndex !== currentAudioTrackIndex) {
        switchAudioTrack(trackIndex);
      }
    }
  });
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (audioTrackMenu && audioTrackButton) {
    if (!audioTrackButton.contains(e.target) && !audioTrackMenu.contains(e.target)) {
      audioTrackMenu.style.display = 'none';
    }
  }
});

// Function to ensure audio button stays visible
function ensureAudioButtonVisible() {
  if (audioTrackButton && currentAudioTracks.length > 1) {
    // Force visibility
    audioTrackButton.style.display = 'flex';
    audioTrackButton.style.opacity = '1';
    audioTrackButton.style.visibility = 'visible';
  }
}

// Periodically check and ensure button stays visible
setInterval(ensureAudioButtonVisible, 1000);

// Ensure button stays visible when video events occur
if (video) {
  video.addEventListener('play', ensureAudioButtonVisible);
  video.addEventListener('pause', ensureAudioButtonVisible);
  video.addEventListener('loadstart', ensureAudioButtonVisible);
  video.addEventListener('loadeddata', ensureAudioButtonVisible);
}

// Optionally, call once on load to sync icon
updatePlayPauseIcon();

// Keyboard navigation for video gallery (TV browsers)
document.addEventListener('keydown', function(e) {
    const focusedElement = document.activeElement;
    
    if (!focusedElement || !focusedElement.classList.contains('netflix-card')) {
        return;
    }
    
    const currentIndex = parseInt(focusedElement.getAttribute('data-index'));
    const container = document.getElementById('videoGallery');
    const allCards = container.querySelectorAll('.netflix-card');
    
    // Calculate grid dimensions
    const containerWidth = container.offsetWidth;
    const cardWidth = 220; // minimum card width
    const gap = 16;
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
