// public/app.js

// Mobile detection and control management
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768;
}

function initializeMobileControls() {
  if (isMobileDevice()) {
    const controls = document.querySelector('.controls');
    if (controls) {
      // Ensure controls are visible on mobile
      controls.style.opacity = '1';

      // Add mobile-specific classes
      controls.classList.add('mobile-controls');

      // Make controls more touch-friendly
      const buttons = controls.querySelectorAll('button');
      buttons.forEach(button => {
        button.style.minWidth = '44px';
        button.style.minHeight = '44px';
        // Ensure all buttons are visible
        button.style.display = 'flex';
        button.style.visibility = 'visible';
      });

      // Specifically ensure fullscreen, subtitle, and audio buttons are visible
      const fullscreenBtn = document.getElementById('fullscreenButton');
      const subtitleBtn = document.getElementById('subtitleTrackButton');
      const audioBtn = document.getElementById('audioTrackButton');

      if (fullscreenBtn) {
        fullscreenBtn.style.display = 'flex';
        fullscreenBtn.style.visibility = 'visible';
      }
      if (subtitleBtn) {
        subtitleBtn.style.display = 'flex';
        subtitleBtn.style.visibility = 'visible';
      }
      if (audioBtn) {
        audioBtn.style.display = 'flex';
        audioBtn.style.visibility = 'visible';
      }
    }
  }
}

// Function to ensure all controls are visible (called after video loads)
function ensureControlsVisible() {
  const controls = document.querySelector('.controls');
  if (controls) {
    // Ensure all control buttons are visible
    const buttons = controls.querySelectorAll('button');
    buttons.forEach(button => {
      button.style.display = 'flex';
      button.style.visibility = 'visible';
    });

    // Specifically check and show fullscreen, subtitle, and audio buttons (both desktop and mobile)
    const fullscreenBtn = document.getElementById('fullscreenButton');
    const subtitleBtn = document.getElementById('subtitleTrackButton');
    const audioBtn = document.getElementById('audioTrackButton');
    const fullscreenBtnMobile = document.getElementById('fullscreenButton-mobile');
    const subtitleBtnMobile = document.getElementById('subtitleTrackButton-mobile');
    const audioBtnMobile = document.getElementById('audioTrackButton-mobile');

    [fullscreenBtn, fullscreenBtnMobile].forEach(btn => {
      if (btn) {
        btn.style.display = 'flex';
        btn.style.visibility = 'visible';
      }
    });
    [subtitleBtn, subtitleBtnMobile].forEach(btn => {
      if (btn) {
        btn.style.display = 'flex';
        btn.style.visibility = 'visible';
      }
    });
    [audioBtn, audioBtnMobile].forEach(btn => {
      if (btn) {
        btn.style.display = 'flex';
        btn.style.visibility = 'visible';
      }
    });
  }
}

// Function to sync mobile controls with desktop controls
function syncMobileControls() {
  // Sync play/pause buttons
  const playPauseDesktop = document.getElementById('playPause');
  const playPauseMobile = document.getElementById('playPause-mobile');

  if (playPauseDesktop && playPauseMobile) {
    playPauseMobile.addEventListener('click', () => playPauseDesktop.click());
  }

  // Sync other buttons (except subtitle and audio which need special handling)
  const buttonPairs = [
    ['playPrev', 'playPrev-mobile'],
    ['seekBackward', 'seekBackward-mobile'],
    ['seekForward', 'seekForward-mobile'],
    ['playNext', 'playNext-mobile'],
    ['muteButton', 'muteButton-mobile'],
    ['fullscreenButton', 'fullscreenButton-mobile']
  ];

  buttonPairs.forEach(([desktopId, mobileId]) => {
    const desktopBtn = document.getElementById(desktopId);
    const mobileBtn = document.getElementById(mobileId);

    if (desktopBtn && mobileBtn) {
      mobileBtn.addEventListener('click', () => desktopBtn.click());
    }
  });

  // Special handling for subtitle and audio buttons to show dropdowns
  const subtitleDesktop = document.getElementById('subtitleTrackButton');
  const subtitleMobile = document.getElementById('subtitleTrackButton-mobile');
  const audioDesktop = document.getElementById('audioTrackButton');
  const audioMobile = document.getElementById('audioTrackButton-mobile');
  const subtitleMenu = document.getElementById('subtitleTrackMenu');
  const audioMenu = document.getElementById('audioTrackMenu');
  const subtitleMenuMobile = document.getElementById('subtitleTrackMenu-mobile');
  const audioMenuMobile = document.getElementById('audioTrackMenu-mobile');

  // Function to sync mobile menu content with desktop menu
  function syncMobileMenuContent() {
    if (subtitleMenu && subtitleMenuMobile) {
      subtitleMenuMobile.innerHTML = subtitleMenu.innerHTML;
    }
    if (audioMenu && audioMenuMobile) {
      audioMenuMobile.innerHTML = audioMenu.innerHTML;
    }
  }

  // Initial sync
  syncMobileMenuContent();

  // Sync when desktop menus are updated
  const observer = new MutationObserver(syncMobileMenuContent);
  if (subtitleMenu) observer.observe(subtitleMenu, { childList: true, subtree: true });
  if (audioMenu) observer.observe(audioMenu, { childList: true, subtree: true });

  if (subtitleDesktop && subtitleMobile && subtitleMenuMobile) {
    console.log('Setting up mobile subtitle button listener');
    subtitleMobile.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Mobile subtitle button clicked, current display:', subtitleMenuMobile.style.display);
      console.log('Mobile subtitle menu element:', subtitleMenuMobile);
      // Toggle mobile subtitle menu directly
      if (subtitleMenuMobile.style.display === 'none' || !subtitleMenuMobile.style.display) {
        subtitleMenuMobile.style.display = 'block';
        subtitleMenuMobile.style.visibility = 'visible';
        subtitleMenuMobile.style.opacity = '1';
        console.log('Showing mobile subtitle menu');
        console.log('Menu computed style:', window.getComputedStyle(subtitleMenuMobile).display);
        // Hide other menus if open
        if (audioMenuMobile) audioMenuMobile.style.display = 'none';
        if (subtitleMenu) subtitleMenu.style.display = 'none';
        if (audioMenu) audioMenu.style.display = 'none';
      } else {
        subtitleMenuMobile.style.display = 'none';
        console.log('Hiding mobile subtitle menu');
      }
    });
  } else {
    console.log('Mobile subtitle elements not found:', {
      subtitleDesktop: !!subtitleDesktop,
      subtitleMobile: !!subtitleMobile,
      subtitleMenuMobile: !!subtitleMenuMobile
    });
  }

  if (audioDesktop && audioMobile && audioMenuMobile) {
    console.log('Setting up mobile audio button listener');
    audioMobile.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Mobile audio button clicked, current display:', audioMenuMobile.style.display);
      console.log('Mobile audio menu element:', audioMenuMobile);
      // Toggle mobile audio menu directly
      if (audioMenuMobile.style.display === 'none' || !audioMenuMobile.style.display) {
        audioMenuMobile.style.display = 'block';
        audioMenuMobile.style.visibility = 'visible';
        audioMenuMobile.style.opacity = '1';
        console.log('Showing mobile audio menu');
        console.log('Menu computed style:', window.getComputedStyle(audioMenuMobile).display);
        // Hide other menus if open
        if (subtitleMenuMobile) subtitleMenuMobile.style.display = 'none';
        if (subtitleMenu) subtitleMenu.style.display = 'none';
        if (audioMenu) audioMenu.style.display = 'none';
      } else {
        audioMenuMobile.style.display = 'none';
        console.log('Hiding mobile audio menu');
      }
    });
  } else {
    console.log('Mobile audio elements not found:', {
      audioDesktop: !!audioDesktop,
      audioMobile: !!audioMobile,
      audioMenuMobile: !!audioMenuMobile
    });
  }

  // Sync seek bars
  const seekDesktop = document.getElementById('seek');
  const seekMobile = document.getElementById('seek-mobile');

  if (seekDesktop && seekMobile) {
    seekMobile.addEventListener('input', (e) => {
      seekDesktop.value = e.target.value;
      seekDesktop.dispatchEvent(new Event('input'));
    });

    seekDesktop.addEventListener('input', (e) => {
      seekMobile.value = e.target.value;
    });
  }

  // Sync volume sliders
  const volumeDesktop = document.getElementById('volume');
  const volumeMobile = document.getElementById('volume-mobile');

  if (volumeDesktop && volumeMobile) {
    volumeMobile.addEventListener('input', (e) => {
      volumeDesktop.value = e.target.value;
      volumeDesktop.dispatchEvent(new Event('input'));
    });

    volumeDesktop.addEventListener('input', (e) => {
      volumeMobile.value = e.target.value;
    });
  }

  // Sync time displays
  const currentDesktop = document.getElementById('current');
  const currentMobile = document.getElementById('current-mobile');
  const durationDesktop = document.getElementById('duration');
  const durationMobile = document.getElementById('duration-mobile');

  // Create a function to sync time displays
  function syncTimeDisplays() {
    if (currentDesktop && currentMobile) {
      currentMobile.textContent = currentDesktop.textContent;
    }
    if (durationDesktop && durationMobile) {
      durationMobile.textContent = durationDesktop.textContent;
    }
  }

  // Sync time displays periodically
  setInterval(syncTimeDisplays, 100);

  // Add event listeners for mobile menu items
  function addMobileMenuEventListeners() {
    // Mobile subtitle menu item clicks
    if (subtitleMenuMobile) {
      subtitleMenuMobile.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.subtitle-track-menu-item');
        if (menuItem) {
          const trackIndex = parseInt(menuItem.dataset.trackIndex);
          console.log('Mobile subtitle track selected:', trackIndex);
          // Trigger the same function as desktop
          selectSubtitleTrack(trackIndex);
          // Close mobile menu
          subtitleMenuMobile.style.display = 'none';
        }
      });
    }

    // Mobile audio menu item clicks
    if (audioMenuMobile) {
      audioMenuMobile.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.audio-track-menu-item');
        if (menuItem) {
          const trackIndex = parseInt(menuItem.dataset.trackIndex);
          console.log('Mobile audio track selected:', trackIndex);
          // Trigger the same function as desktop
          switchAudioTrack(trackIndex);
          // Close mobile menu
          audioMenuMobile.style.display = 'none';
        }
      });
    }
  }

  // Add event listeners after a short delay to ensure menus are populated
  setTimeout(addMobileMenuEventListeners, 1000);

  // Add mobile speaker button functionality with volume slider
  const muteButtonMobile = document.getElementById('muteButton-mobile');

  if (muteButtonMobile && volumeMobile) {
    muteButtonMobile.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Toggle volume slider visibility
      if (volumeMobile.style.display === 'none' || !volumeMobile.style.display) {
        volumeMobile.style.display = 'block';
        volumeMobile.style.width = '80px';
      } else {
        volumeMobile.style.display = 'none';
      }
    });

    // Sync volume slider with video volume
    volumeMobile.addEventListener('input', (e) => {
      const video = document.getElementById('videoPlayer');
      if (video) {
        video.volume = parseFloat(e.target.value);
        // Update mute button icon based on volume
        if (video.volume === 0) {
          muteButtonMobile.textContent = '🔇';
        } else if (video.volume < 0.5) {
          muteButtonMobile.textContent = '🔉';
        } else {
          muteButtonMobile.textContent = '🔊';
        }
      }
    });
  }

  // YouTube-style mobile controls - only center player icons
  const mobileCenterControls = document.querySelector('.mobile-center-controls');
  const playerContainer = document.getElementById('playerContainer');
  const videoPlayer = document.getElementById('videoPlayer');
  let controlsTimeout;
  let controlsVisible = false;

  function showMobileControls() {
    if (mobileCenterControls) {
      mobileCenterControls.classList.add('show');
      controlsVisible = true;

      // Auto-hide after 3 seconds
      clearTimeout(controlsTimeout);
      controlsTimeout = setTimeout(() => {
        hideMobileControls();
      }, 3000);
    }
  }

  function hideMobileControls() {
    if (mobileCenterControls) {
      mobileCenterControls.classList.remove('show');
      controlsVisible = false;
    }
  }

  function toggleMobileControls() {
    if (controlsVisible) {
      hideMobileControls();
    } else {
      showMobileControls();
    }
  }

  // YouTube-style tap to show/hide center controls only
  if (playerContainer && mobileCenterControls) {
    // Show controls on video tap
    playerContainer.addEventListener('click', (e) => {
      // Don't toggle controls if clicking on buttons
      if (e.target.closest('button') || e.target.closest('input')) {
        return;
      }
      toggleMobileControls();
    });

    // Show controls on video touch
    playerContainer.addEventListener('touchstart', (e) => {
      // Don't toggle controls if touching buttons
      if (e.target.closest('button') || e.target.closest('input')) {
        return;
      }
      toggleMobileControls();
    });

    // Show controls when video starts playing
    if (videoPlayer) {
      videoPlayer.addEventListener('play', () => {
        showMobileControls();
      });

      videoPlayer.addEventListener('pause', () => {
        showMobileControls();
      });
    }

    // Initial state - hidden
    mobileCenterControls.classList.remove('show');
  }
}

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

// Initialize user on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadCurrentUser();
    initializeMobileControls();
    syncMobileControls();
  });
} else {
  loadCurrentUser();
  initializeMobileControls();
  syncMobileControls();
}

const videoListEl = document.getElementById('videoList');
const playerContainer = document.getElementById('playerContainer');
const videoPlayer = document.getElementById('videoPlayer');
const mobilecontrolCenter = document.getElementById('mobilecontrolCenter');
const video = document.getElementById('videoPlayer');
const loader = document.getElementById('videoLoader');
const playPauseBtn = document.getElementById('playPause');
const playPauseBtnMobile = document.getElementById('playPause-mobile');
const playPrevBtn = document.getElementById('playPrev');
const playNextBtn = document.getElementById('playNext');
const seekBar = document.getElementById('seek');
const seekBackwardBtn = document.getElementById('seekBackward');
const seekForwardBtn = document.getElementById('seekForward');
const playPauseAnim = document.getElementById('playPauseAnim');
const audioTrackButton = document.getElementById('audioTrackButton');
const audioTrackMenu = document.getElementById('audioTrackMenu');
const subtitleTrackButton = document.getElementById('subtitleTrackButton');
const subtitleTrackMenu = document.getElementById('subtitleTrackMenu');

// Update play/pause icon
function updatePlayPauseIcon() {
  if (!playPauseBtn) return;
  playPauseBtn.innerHTML = video.paused
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

  if (!playPauseBtnMobile) return;
  playPauseBtnMobile.innerHTML = video.paused
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
    ensureControlsVisible();
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
  video.addEventListener('click', function (e) {
    // Prevent play/pause toggle if a control was clicked
    // (controls are inside playerContainer, so check if the click target is inside .controls)
    const controls = document.querySelector('.controls');
    if (controls && controls.contains(e.target)) {
      return;
    }
    togglePlayPause();
    // showPlayPauseAnim handled in togglePlayPause
  });


  mobilecontrolCenter.addEventListener('click', function (e) {
    // Prevent play/pause toggle if a control was clicked
    // (controls are inside playerContainer, so check if the click target is inside .controls)
    const controls = document.querySelector('button');
    if (controls && controls.contains(e.target)) {
      return;
    }
    togglePlayPause();
    // showPlayPauseAnim handled in togglePlayPause
  });

  // Mobile touch events for better control interaction
  let touchStartTime = 0;
  let touchStartY = 0;
  let touchStartX = 0;

  video.addEventListener('touchstart', function (e) {
    touchStartTime = Date.now();
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
  });

  video.addEventListener('touchend', function (e) {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaY = Math.abs(touchEndY - touchStartY);
    const deltaX = Math.abs(touchEndX - touchStartX);

    // Only trigger play/pause if it's a quick tap (not a swipe or long press)
    if (touchDuration < 300 && deltaY < 50 && deltaX < 50) {
      // Check if touch was on controls
      const controls = document.querySelector('.controls');
      if (controls && controls.contains(e.target)) {
        return;
      }
      togglePlayPause();
    }
  });
  video.addEventListener('play', updatePlayPauseIcon);
  video.addEventListener('pause', updatePlayPauseIcon);
}

// Play/Pause on spacebar, seek on arrow keys
document.addEventListener('keydown', (e) => {
  // Event code handled silently
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




});

// Seek on button click
if (playPauseBtn) {
  playPauseBtn.onclick = togglePlayPause;
}

// Seek on new seek buttons click
if (seekBackwardBtn) seekBackwardBtn.addEventListener('click', seekBackward);
if (seekForwardBtn) seekForwardBtn.addEventListener('click', seekForward);

if (playPrevBtn) playPrevBtn.addEventListener('click', function () {
  playPrevVideo(currentVideoId);
});
if (playNextBtn) playNextBtn.addEventListener('click', function () {
  playNextVideo(currentVideoId);
});

var manualDuration = 0; // seconds

const playPause = document.getElementById('playPause');
const seek = document.getElementById('seek');
const mobileseek = document.getElementById('seek-mobile');
const volume = document.getElementById('volume');
const currentTimeEl = document.getElementById('current');
const durationEl = document.getElementById('duration');
var startTime = 0;

let currentVideoId = null;
let currentVideoDuration = null;
let progressUpdateTimeout = null;
let currentAudioTracks = [];
let currentAudioTrackIndex = 0;

// Subtitle track management
let currentSubtitleTracks = [];
let currentSubtitleTrackIndex = -1; // -1 means no subtitles
let currentLoadingSubtitleVideoId = null;
// Custom subtitle system variables
let customSubtitleCues = [];
let customSubtitleActive = false;
let customSubtitleTrackIndex = -1;
let customSubtitleUpdateInterval = null;

// Chunked subtitle loading variables
let subtitleChunks = new Map(); // Map<chunkKey, cues[]>
let currentChunkIndex = -1;
let nextChunkPreloadTime = -1;
let isLoadingChunk = false;
let CHUNK_DURATION = 600; // 10 minutes in seconds (adaptive)
const PRELOAD_BUFFER = 120; // Start loading next chunk 2 minutes before needed
let chunkFailureCount = 0; // Track failures to adapt chunk size

const params = new URLSearchParams(window.location.search);

const series = params.get('series');

fetch(`/api/videos/${series}`, {
  method: 'GET',
  headers: {
    'x-db-name': series
  }
})
  .then(response => response.json())
  .then(videos => {
    // Videos loaded
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

    // Refresh TV navigation after cards are loaded
    if (window.tvNavigation) {
      setTimeout(() => {
        window.tvNavigation.refreshNavigation();
      }, 100);
    }

    // Auto-select and click the video card if specified in URL
    const videoParam = params.get('id') || params.get('video');
    if (videoParam) {
      // Auto-selecting video from URL
      // Decode the video parameter
      const decodedVideoParam = decodeURIComponent(videoParam);

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
          const videoFile = video.file || '';

          // Checking video match

          // Exact matches (highest priority) - must be identical
          if (videoId === param || videoId === originalParam ||
            videoTitle === param || videoTitle === originalParam ||
            videoFilename === param || videoFilename === originalParam ||
            videoFile === param || videoFile === originalParam) {
            // Exact match found
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
          const fileSimilarity = calculateSimilarity(videoFile, param);

          // Similarity scores calculated

          if (idSimilarity >= 0.9 || titleSimilarity >= 0.9 || filenameSimilarity >= 0.9 || fileSimilarity >= 0.9) {
            // High similarity match found
            return { type: 'high-similarity', priority: 2, similarity: Math.max(idSimilarity, titleSimilarity, filenameSimilarity, fileSimilarity) };
          }

          // Medium similarity matches (70-89%)
          if (idSimilarity >= 0.7 || titleSimilarity >= 0.7 || filenameSimilarity >= 0.7 || fileSimilarity >= 0.7) {
            // Medium similarity match found
            return { type: 'medium-similarity', priority: 3, similarity: Math.max(idSimilarity, titleSimilarity, filenameSimilarity, fileSimilarity) };
          }

          // Normalize and compare (lowest priority)
          const normalize = (str) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const normalizedParam = normalize(param);
          if (normalize(videoId) === normalizedParam ||
            normalize(videoTitle) === normalizedParam ||
            normalize(videoFilename) === normalizedParam ||
            normalize(videoFile) === normalizedParam) {
            // Normalized match found
            return { type: 'normalized', priority: 4 };
          }

          // No match found
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

              // New best match found
              // Matched video

              // If we found an exact match, stop looking
              if (match.priority === 1) {
                // Exact match found, stopping search
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

          // Update watching overlay immediately
          updateWatchingOverlay(targetVideo.id);

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
              file: video.file,
              matches_id: videoId === decodedVideoParam,
              matches_title: video.title === decodedVideoParam,
              matches_filename: video.filename === decodedVideoParam,
              matches_file: video.file === decodedVideoParam
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
    if (updatedCurrTime == 0) return;
    if (currentVideoId) {
      fetch('/api/watch-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-db-name': series },
        body: JSON.stringify({
          video_id: currentVideoId,
          current_time: updatedCurrTime
        }),
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
  isManual = true;
  durationEl.textContent = formatTime(manualDuration);
  console.log("📢[:198]: manualDuration: ", manualDuration);
  seek.max = manualDuration;
  mobileseek.max = manualDuration;
  ensureControlsVisible();
});

playPause.addEventListener('click', () => {
  if (!video.paused) {
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
  mobileseek.value = parseInt(startTime) + parseInt(video.currentTime);
  currentTimeEl.textContent = formatTime(seek.value);
});

let seekTimeout;

seek.addEventListener('input', (e) => {
  const url = new URL(video.src);
  url.searchParams.set('start', seek.value);
  clearTimeout(seekTimeout);
  seekTimeout = setTimeout(() => { // update or add start param
    video.src = url.toString();
    video.load();                            // reload video with new source
    video.play();
  }, 300);
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

function clearSubtitleTracks() {
  if (!subtitleTrackButton || !subtitleTrackMenu) return;

  console.log('Clearing subtitle tracks');

  // Clear custom subtitle system
  customSubtitleActive = false;
  customSubtitleTrackIndex = -1;
  customSubtitleCues = [];

  // Stop custom subtitle updates
  if (customSubtitleUpdateInterval) {
    clearInterval(customSubtitleUpdateInterval);
    customSubtitleUpdateInterval = null;
  }

  // Hide custom subtitle
  hideCustomSubtitle();

  subtitleTrackMenu.innerHTML = '';
  subtitleTrackMenu.style.display = 'none';
  subtitleTrackButton.style.display = 'none';
  currentSubtitleTracks = [];
  currentSubtitleTrackIndex = -1; // -1 means no subtitles
  currentLoadingSubtitleVideoId = null;

  console.log('🎬 Custom subtitle system cleared');
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
    console.log("language ", languageGroups);
    Object.keys(languageGroups).forEach(language => {
      const tracks = languageGroups[language];
      tracks.forEach(track => {
        const menuItem = document.createElement('div');
        menuItem.className = 'audio-track-menu-item';
        menuItem.dataset.trackIndex = track.originalIndex;
        menuItem.setAttribute('tabindex', '0');

        menuItem.innerHTML = `
          <div class="track-info">
            <div class="track-language">${track.language}</div>
            <div class="track-quality">${track.quality} - ${Math.round(track.bitrate / 1000)}kbps</div>
          </div>
          <div class="track-checkmark">✓</div>
        `;

        // Add keyboard support for menu item
        menuItem.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const trackIndex = parseInt(menuItem.dataset.trackIndex);
            if (trackIndex !== currentAudioTrackIndex) {
              switchAudioTrack(trackIndex);
            }
          }
        });

        audioTrackMenu.appendChild(menuItem);
        console.log(`Added audio track option: index=${track.originalIndex}, language=${track.language}, quality=${track.quality}, displayName=${track.language} (${track.quality} - ${Math.round(track.bitrate / 1000)}kbps)`);
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

async function loadSubtitleTracks(videoId) {
  if (!subtitleTrackButton || !subtitleTrackMenu) {
    console.warn('🎬 Subtitle UI elements not found');
    return;
  }

  // Prevent multiple simultaneous loads for the same video
  if (currentLoadingSubtitleVideoId === videoId) {
    console.log('🎬 Subtitle tracks already loading for video:', videoId);
    return;
  }

  currentLoadingSubtitleVideoId = videoId;
  console.log('🎬 Loading subtitle tracks for video:', videoId);
  console.log('🎬 Current series:', series);
  console.log('🎬 API URL:', `/api/subtitle-tracks/${encodeURIComponent(series)}/${encodeURIComponent(videoId)}`);

  try {
    const response = await fetch(`/api/subtitle-tracks/${encodeURIComponent(series)}/${encodeURIComponent(videoId)}`);
    console.log('🎬 Response status:', response.status, response.statusText);

    const responseText = await response.text();
    console.log('🎬 Raw response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('🎬 JSON Parse Error:', parseError);
      console.error('🎬 Response text that failed to parse:', responseText);
      throw new Error('Invalid JSON response from subtitle tracks API');
    }

    console.log('🎬 Parsed subtitle tracks data:', JSON.stringify(data, null, 2));

    if (data.error) {
      console.warn('🎬 No subtitle tracks found:', data.error);
      subtitleTrackButton.style.display = 'none';
      subtitleTrackMenu.style.display = 'none';
      // Clear existing options even on error
      subtitleTrackMenu.innerHTML = '';
      currentSubtitleTracks = [];
      return;
    }

    currentSubtitleTracks = data.tracks;

    console.log('Loaded subtitle tracks:', {
      videoId: videoId,
      totalTracks: currentSubtitleTracks.length,
      tracks: currentSubtitleTracks.map(track => ({
        index: track.index,
        streamIndex: track.streamIndex,
        language: track.language,
        codec: track.codec,
        codecDisplayName: track.codecDisplayName,
        isBrowserCompatible: track.isBrowserCompatible,
        displayName: track.displayName
      }))
    });

    // Clear existing options and reset state
    console.log('Clearing existing subtitle track options');
    subtitleTrackMenu.innerHTML = '';

    // Add "Off" option first
    const offItem = document.createElement('div');
    offItem.className = 'subtitle-track-menu-item';
    offItem.dataset.trackIndex = '-1';
    offItem.innerHTML = `
      <div class="track-info">
        <div class="track-language">Off</div>
        <div class="track-codec">No Subtitles</div>
      </div>
      <span class="track-checkmark" style="display: none;">✓</span>
    `;
    subtitleTrackMenu.appendChild(offItem);

    // Add subtitle track options
    currentSubtitleTracks.forEach((track, index) => {
      const menuItem = document.createElement('div');
      menuItem.className = 'subtitle-track-menu-item';
      menuItem.dataset.trackIndex = track.index;
      menuItem.setAttribute('tabindex', '0');

      menuItem.innerHTML = `
        <div class="track-info">
          <div class="track-language">${track.language}</div>
          <div class="track-codec">${track.codecDisplayName}${track.isBrowserCompatible ? '' : ' (Converted)'}</div>
        </div>
        <span class="track-checkmark" style="display: none;">✓</span>
      `;

      // Add keyboard support for menu item
      menuItem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const trackIndex = parseInt(menuItem.dataset.trackIndex);
          if (trackIndex !== currentSubtitleTrackIndex) {
            switchSubtitleTrack(trackIndex);
          }
        }
      });

      subtitleTrackMenu.appendChild(menuItem);
      console.log(`Added subtitle track option: index=${track.index}, language=${track.language}, codec=${track.codecDisplayName}, compatible=${track.isBrowserCompatible}`);
    });

    // Set first subtitle track as default (not "Off")
    if (currentSubtitleTracks.length > 0) {
      currentSubtitleTrackIndex = 0; // Use first subtitle track
      console.log('Setting first subtitle track as default:', currentSubtitleTracks[0]);

      // Add subtitle tracks to HTML5 video element
      addSubtitleTracksToVideo(videoId);

      // Enable the first track by default
      enableSubtitleTrack(currentSubtitleTrackIndex);
    } else {
      currentSubtitleTrackIndex = -1; // No subtitles
    }

    // Update button and menu state
    updateSubtitleTrackButtonLabel();
    updateActiveSubtitleMenuItem();

    // Show button if subtitles are available
    if (currentSubtitleTracks.length > 0) {
      subtitleTrackButton.style.display = 'flex';
      console.log('Subtitle tracks found:', currentSubtitleTracks.length, 'Button should be visible');
    } else {
      subtitleTrackButton.style.display = 'none';
      console.log('No subtitle tracks, hiding button');
    }

  } catch (err) {
    console.error('Error loading subtitle tracks:', err);
    subtitleTrackButton.style.display = 'none';
    subtitleTrackMenu.style.display = 'none';
    // Clear existing options on error
    subtitleTrackMenu.innerHTML = '';
    currentSubtitleTracks = [];
  } finally {
    // Clear loading flag
    currentLoadingSubtitleVideoId = null;
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
  audioTrackButton.title = `Audio Track: ${currentTrack.language} (${currentTrack.quality} - ${Math.round(currentTrack.bitrate / 1000)}kbps)`;
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

function updateSubtitleTrackButtonLabel() {
  if (!subtitleTrackButton) return;

  const label = subtitleTrackButton.querySelector('.subtitle-track-label');
  if (label) {
    if (currentSubtitleTrackIndex >= 0 && currentSubtitleTracks[currentSubtitleTrackIndex]) {
      const currentTrack = currentSubtitleTracks[currentSubtitleTrackIndex];
      // Show first 3 letters of language
      label.textContent = currentTrack.language.substring(0, 3).toUpperCase();
      // Update button title
      subtitleTrackButton.title = `Subtitle Track: ${currentTrack.language} (${currentTrack.codecDisplayName})`;
    } else {
      label.textContent = 'SUB';
      subtitleTrackButton.title = 'Subtitles: Off';
    }
  }
}

function updateActiveSubtitleMenuItem() {
  if (!subtitleTrackMenu) return;

  // Remove active class from all items
  const menuItems = subtitleTrackMenu.querySelectorAll('.subtitle-track-menu-item');
  menuItems.forEach(item => {
    item.classList.remove('active');
    const checkmark = item.querySelector('.track-checkmark');
    if (checkmark) checkmark.style.display = 'none';
  });

  // Add active class to current track (or "Off" if index is -1)
  const trackIndexToFind = currentSubtitleTrackIndex >= 0 ? currentSubtitleTrackIndex : -1;
  const activeItem = subtitleTrackMenu.querySelector(`[data-track-index="${trackIndexToFind}"]`);
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

function addSubtitleTracksToVideo(videoId) {
  if (!videoPlayer) {
    console.warn('🎬 Video player not found for subtitle tracks');
    return;
  }

  if (!currentSubtitleTracks.length) {
    console.log('🎬 No subtitle tracks to add to video element');
    return;
  }

  // Use passed videoId or fallback to currentVideoId
  const actualVideoId = videoId || currentVideoId;

  console.log('🎬 Setting up custom subtitle system (no native tracks)');
  console.log('🎬 Video ID (parameter):', videoId);
  console.log('🎬 Current video ID (global):', currentVideoId);
  console.log('🎬 Actual video ID (using):', actualVideoId);
  console.log('🎬 Current series:', series);
  console.log('🎬 Start time:', startTime);
  console.log('🎬 Total tracks available:', currentSubtitleTracks.length);

  // Check if videoId is available
  if (!actualVideoId) {
    console.error('🎬 ❌ Video ID is not available, cannot create subtitle URLs');
    return;
  }

  // Remove any existing native subtitle tracks
  const existingTracks = videoPlayer.querySelectorAll('track[kind="subtitles"]');
  console.log('🎬 Removing', existingTracks.length, 'existing native subtitle tracks');
  existingTracks.forEach(track => track.remove());

  // Load subtitle data for custom display
  loadCustomSubtitleData(actualVideoId, series);
}

async function loadCustomSubtitleData(videoId, seriesName) {
  console.log('🎬 📦 Starting chunked subtitle loading...');

  if (currentSubtitleTracks.length === 0) {
    console.log('🎬 No subtitle tracks available');
    return;
  }

  // Clear previous subtitle data
  customSubtitleCues = [];
  subtitleChunks.clear();
  currentChunkIndex = -1;
  nextChunkPreloadTime = -1;

  // Store current video info for preloading
  currentLoadingSubtitleVideoId = { videoId, series: seriesName };

  // Load first chunk (0-10 minutes)
  await loadSubtitleChunk(videoId, seriesName, 0, 0);

  if (customSubtitleCues.length > 0) {
    customSubtitleActive = true;
    customSubtitleTrackIndex = 0;
    startCustomSubtitleDisplay();

    // Set up preloading for next chunk
    const videoDuration = videoPlayer.duration || 0;
    if (videoDuration > CHUNK_DURATION) {
      nextChunkPreloadTime = CHUNK_DURATION - PRELOAD_BUFFER; // 8 minutes
      console.log('🎬 📦 Next chunk will preload at:', formatTimeForDisplay(nextChunkPreloadTime));
    }
    console.log('🎬 Custom subtitle system activated with chunked loading');
  }
}

async function loadSubtitleChunk(videoId, seriesName, chunkIndex, startTime) {
  if (isLoadingChunk) {
    console.log('🎬 📦 Already loading a chunk, skipping...');
    return;
  }

  const chunkKey = `${chunkIndex}`;
  if (subtitleChunks.has(chunkKey)) {
    console.log('🎬 📦 Chunk', chunkIndex, 'already loaded, using cached data');
    return;
  }

  isLoadingChunk = true;

  try {
    const firstTrack = currentSubtitleTracks[0];
    const encodedVideoId = encodeURIComponent(videoId);
    const encodedSeries = encodeURIComponent(seriesName);

    console.log(`🎬 📦 Loading subtitle chunk ${chunkIndex}: ${formatTimeForDisplay(startTime)} - ${formatTimeForDisplay(startTime + CHUNK_DURATION)}`);

    const response = await fetch(`/api/subtitle-chunk/${encodedSeries}/${encodedVideoId}/${firstTrack.index}/${startTime}/${CHUNK_DURATION}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const subtitleContent = await response.text();
    console.log('🎬 📦 Chunk', chunkIndex, 'loaded:', subtitleContent.length, 'characters');

    // Parse WebVTT content for this chunk
    const chunkCues = parseCustomWebVTT(subtitleContent);
    console.log('🎬 📦 Chunk', chunkIndex, 'parsed:', chunkCues.length, 'cues');

    // Store chunk
    subtitleChunks.set(chunkKey, chunkCues);

    // If this is the first chunk, set it as active
    if (chunkIndex === 0) {
      customSubtitleCues = chunkCues;
      currentChunkIndex = chunkIndex;
    }

  } catch (error) {
    console.error(`🎬 ❌ Failed to load subtitle chunk ${chunkIndex}:`, error);
    chunkFailureCount++;

    // Adaptive chunk sizing - if chunks are failing, try smaller chunks
    if (chunkFailureCount >= 2 && CHUNK_DURATION > 180) {
      const oldDuration = CHUNK_DURATION;
      CHUNK_DURATION = Math.max(180, CHUNK_DURATION / 2); // Minimum 3 minutes
      console.log(`🎬 📦 Adapting chunk size: ${oldDuration}s → ${CHUNK_DURATION}s (failures: ${chunkFailureCount})`);
      chunkFailureCount = 0; // Reset failure count after adaptation

      // Retry with smaller chunk
      if (chunkIndex === 0) {
        console.log('🎬 📦 Retrying first chunk with smaller size...');
        setTimeout(() => {
          loadSubtitleChunk(
            currentLoadingSubtitleVideoId?.videoId || '',
            currentLoadingSubtitleVideoId?.series || '',
            0,
            0
          );
        }, 1000);
      }
    }
  } finally {
    isLoadingChunk = false;
  }
}

function switchToChunk(targetChunkIndex) {
  const chunkKey = `${targetChunkIndex}`;

  if (subtitleChunks.has(chunkKey)) {
    console.log('🎬 📦 Switching to chunk', targetChunkIndex);
    customSubtitleCues = subtitleChunks.get(chunkKey);
    currentChunkIndex = targetChunkIndex;
    return true;
  }

  return false;
}

function parseCustomWebVTT(content) {
  const cues = [];
  const lines = content.split('\n');
  let currentCue = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and WEBVTT header
    if (!line || line === 'WEBVTT') continue;

    // Check for timing line - handle both MM:SS.mmm and HH:MM:SS.mmm formats
    const timingMatch = line.match(/(\d{1,2}:\d{2}[.,]\d{3})\s*-->\s*(\d{1,2}:\d{2}[.,]\d{3})/);
    if (timingMatch) {
      // Save previous cue
      if (currentCue) {
        cues.push(currentCue);
      }

      // Start new cue - handle both . and , as decimal separator
      const startTimeStr = timingMatch[1].replace(',', '.');
      const endTimeStr = timingMatch[2].replace(',', '.');

      currentCue = {
        startTime: timeStringToSeconds(startTimeStr),
        endTime: timeStringToSeconds(endTimeStr),
        text: ''
      };
    } else if (currentCue && line) {
      // Add text to current cue
      if (currentCue.text) currentCue.text += '\n';
      currentCue.text += line;
    }
  }

  // Add the last cue
  if (currentCue) {
    cues.push(currentCue);
  }

  return cues;
}

function timeStringToSeconds(timeString) {
  const parts = timeString.split(':');

  if (parts.length === 2) {
    // Format: MM:SS.mmm
    const minutes = parseInt(parts[0]);
    const secondsAndMs = parts[1].split('.');
    const seconds = parseInt(secondsAndMs[0]);
    const milliseconds = parseInt(secondsAndMs[1]);

    return (minutes * 60) + seconds + (milliseconds / 1000);
  } else {
    // Format: HH:MM:SS.mmm
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const secondsAndMs = parts[2].split('.');
    const seconds = parseInt(secondsAndMs[0]);
    const milliseconds = parseInt(secondsAndMs[1]);

    return (hours * 3600) + (minutes * 60) + seconds + (milliseconds / 1000);
  }
}

function startCustomSubtitleDisplay() {
  // Clear existing interval
  if (customSubtitleUpdateInterval) {
    clearInterval(customSubtitleUpdateInterval);
  }

  // Update subtitle display every 100ms
  customSubtitleUpdateInterval = setInterval(() => {
    if (customSubtitleActive && customSubtitleCues.length > 0) {
      updateCustomSubtitleDisplay();
    }
  }, 100);

  console.log('🎬 Custom subtitle update loop started');
}

function updateCustomSubtitleDisplay() {
  // Get current movie time (your custom timing)
  const rawVideoTime = videoPlayer.currentTime;
  const currentMovieTime = parseInt(startTime) + parseInt(rawVideoTime);

  // Check if we need to switch chunks or preload next chunk
  const expectedChunkIndex = Math.floor(currentMovieTime / CHUNK_DURATION);

  // Switch chunks if needed
  if (expectedChunkIndex !== currentChunkIndex) {
    if (switchToChunk(expectedChunkIndex)) {
      console.log('🎬 📦 Switched to chunk', expectedChunkIndex, 'at time', formatTimeForDisplay(currentMovieTime));
    } else {
      console.log('🎬 📦 Chunk', expectedChunkIndex, 'not available, keeping current chunk');
    }
  }

  // Preload next chunk if we're approaching the end of current chunk
  if (nextChunkPreloadTime > 0 && currentMovieTime >= nextChunkPreloadTime) {
    const nextChunkIndex = currentChunkIndex + 1;
    const nextChunkStartTime = nextChunkIndex * CHUNK_DURATION;

    console.log('🎬 📦 Preloading chunk', nextChunkIndex);
    loadSubtitleChunk(
      currentLoadingSubtitleVideoId?.videoId || '',
      currentLoadingSubtitleVideoId?.series || '',
      nextChunkIndex,
      nextChunkStartTime
    );

    // Set next preload time for the chunk after
    nextChunkPreloadTime = nextChunkStartTime + CHUNK_DURATION - PRELOAD_BUFFER;
  }

  // Find active subtitle at current time
  const activeCue = customSubtitleCues.find(cue =>
    currentMovieTime >= cue.startTime && currentMovieTime <= cue.endTime
  );

  if (activeCue) {
    displayCustomSubtitle(activeCue.text);
  } else {
    hideCustomSubtitle();
  }
}

function displayCustomSubtitle(text) {
  // Remove existing subtitle
  hideCustomSubtitle();

  // Create custom subtitle element
  const subtitleDiv = document.createElement('div');
  subtitleDiv.id = 'custom-subtitle-overlay';
  subtitleDiv.style.cssText = `
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 18px;
    font-family: Arial, sans-serif;
    font-weight: normal;
    text-align: center;
    z-index: 1500;
    max-width: 85%;
    line-height: 1.4;
    pointer-events: none;
    white-space: pre-line;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;

  subtitleDiv.textContent = text;

  // Add to video container
  const videoContainer = videoPlayer.parentElement;
  if (!videoContainer) {
    return;
  }

  videoContainer.style.position = 'relative';
  videoContainer.appendChild(subtitleDiv);
}

function hideCustomSubtitle() {
  const existingSubtitle = document.getElementById('custom-subtitle-overlay');
  if (existingSubtitle) {
    existingSubtitle.remove();
  }
}

function formatTimeForDisplay(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  } else {
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

function enableSubtitleTrack(trackIndex) {
  console.log('🎬 Switching to custom subtitle track:', trackIndex);

  if (trackIndex < 0) {
    // Disable subtitles
    customSubtitleActive = false;
    customSubtitleTrackIndex = -1;
    hideCustomSubtitle();
    console.log('🎬 Custom subtitles disabled');
    return;
  }

  if (trackIndex >= currentSubtitleTracks.length) {
    console.warn('🎬 Invalid subtitle track index:', trackIndex);
    return;
  }

  // Load the selected track
  const selectedTrack = currentSubtitleTracks[trackIndex];
  console.log('🎬 Loading custom subtitle track:', selectedTrack.language);

  loadCustomSubtitleTrack(trackIndex);
}

async function loadCustomSubtitleTrack(trackIndex) {
  const track = currentSubtitleTracks[trackIndex];
  const subtitleUrl = `/api/subtitle/${encodeURIComponent(series)}/${encodeURIComponent(currentVideoId)}/${track.index}`;

  console.log('🎬 Loading custom subtitle track:', trackIndex, subtitleUrl);

  try {
    const response = await fetch(subtitleUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const subtitleContent = await response.text();
    console.log('🎬 Custom subtitle track loaded:', subtitleContent.length, 'characters');

    // Parse and activate new track
    customSubtitleCues = parseCustomWebVTT(subtitleContent);
    customSubtitleActive = true;
    customSubtitleTrackIndex = trackIndex;

    console.log('🎬 Switched to custom subtitle track:', track.language, `(${customSubtitleCues.length} cues)`);

    // Start display if not already running
    if (!customSubtitleUpdateInterval) {
      startCustomSubtitleDisplay();
    }

  } catch (error) {
    console.error('🎬 ❌ Failed to load custom subtitle track:', error);
  }
}

function synchronizeSubtitleTiming(textTrack, trackIndex) {
  if (!textTrack.cues || textTrack.cues.length === 0) return;

  const videoTime = videoPlayer.currentTime;
  const actualMovieTime = parseInt(startTime) + parseInt(videoTime);
  const timeOffset = parseInt(startTime);

  // If there's no time offset, no synchronization needed
  if (timeOffset === 0) return;

  console.log(`🎬 ⚡ Synchronizing kk subtitle timing for track ${trackIndex}:`, {
    videoTime: videoTime,
    actualMovieTime: actualMovieTime,
    timeOffset: timeOffset,
    totalCues: textTrack.cues.length
  });

  // Disable default subtitle display
  textTrack.mode = 'hidden';

  // Find cues that should be active at the actual movie time
  const activeCues = [];
  for (let i = 0; i < textTrack.cues.length; i++) {
    const cue = textTrack.cues[i];
    const cueStart = cue.startTime + timeOffset;
    const cueEnd = cue.endTime + timeOffset;

    if (actualMovieTime >= cueStart && actualMovieTime <= cueEnd) {
      activeCues.push(cue);
    }
  }

  // Display synchronized subtitles manually
  displaySynchronizedSubtitles(activeCues, trackIndex);
}

function displaySynchronizedSubtitles(activeCues, trackIndex) {
  // Remove existing custom subtitle display
  const existingSubtitleDiv = document.getElementById('custom-subtitles');
  if (existingSubtitleDiv) {
    existingSubtitleDiv.remove();
  }

  if (activeCues.length === 0) return;

  // Create custom subtitle display
  const subtitleDiv = document.createElement('div');
  subtitleDiv.id = 'custom-subtitles';
  subtitleDiv.style.cssText = `
    position: absolute;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 16px;
    font-family: Arial, sans-serif;
    text-align: center;
    z-index: 1000;
    max-width: 80%;
    line-height: 1.4;
    pointer-events: none;
  `;

  // Combine all active cue texts
  const combinedText = activeCues.map(cue => cue.text).join('\n');
  console.log("activeCues kk ", activeCues);
  subtitleDiv.innerHTML = combinedText;
  console.log("combinedText kk ", activeCues);

  // Add to video container
  const videoContainer = videoPlayer.parentElement;
  videoContainer.style.position = 'relative';
  videoContainer.appendChild(subtitleDiv);

  console.log(`🎬 📝 Displaying synchronized kk subtitle:`, combinedText.substring(0, 50) + '...');
}

async function fetchFullSubtitleData(trackElement, trackIndex) {
  const subtitleUrl = trackElement.src;
  console.log(`🎬 📥 Fetching full subtitle data ${trackIndex}:`, subtitleUrl);

  try {
    const response = await fetch(subtitleUrl);
    console.log(`🎬 📥 Subtitle response ${trackIndex}:`, {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    });

    if (response.ok) {
      const subtitleContent = await response.text();
      console.log(`🎬 📥 Full subtitle content loaded (${trackIndex}):`, subtitleContent.length, 'characters');

      // Store the full subtitle data
      fullSubtitleData = subtitleContent;

      // Parse subtitle cues
      manualSubtitleCues = parseWebVTTCues(subtitleContent);
      console.log(`🎬 📥 Parsed ${manualSubtitleCues.length} subtitle cues`);

      // Enable manual subtitle system
      manualSubtitleActive = true;
      setupManualSubtitleDisplay();

      return subtitleContent;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`🎬 📥 ❌ Failed to fetch subtitle data (${trackIndex}):`, error);
    return null;
  }
}

function parseWebVTTCues(webvttContent) {
  const cues = [];
  const lines = webvttContent.split('\n');
  let currentCue = null;

  console.log(`🎬 🔍 Parsing WebVTT content with ${lines.length} lines`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and WEBVTT header
    if (!line || line === 'WEBVTT') continue;

    // Check for timing line (HH:MM:SS.mmm --> HH:MM:SS.mmm)
    const timingMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
    if (timingMatch) {
      // Save previous cue if exists
      if (currentCue) {
        cues.push(currentCue);
      }

      // Start new cue
      currentCue = {
        startTime: timeStringToSeconds(timingMatch[1]),
        endTime: timeStringToSeconds(timingMatch[2]),
        text: ''
      };
    } else if (currentCue && line) {
      // Add text to current cue
      if (currentCue.text) currentCue.text += '\n';
      currentCue.text += line;
    }
  }

  // Add the last cue
  if (currentCue) {
    cues.push(currentCue);
  }

  console.log(`🎬 🔍 Parsed cues sample:`, cues.slice(0, 3));
  return cues;
}

function timeStringToSeconds(timeString) {
  const parts = timeString.split(':');

  if (parts.length === 2) {
    // Format: MM:SS.mmm
    const minutes = parseInt(parts[0]);
    const secondsAndMs = parts[1].split('.');
    const seconds = parseInt(secondsAndMs[0]);
    const milliseconds = parseInt(secondsAndMs[1]);

    return (minutes * 60) + seconds + (milliseconds / 1000);
  } else {
    // Format: HH:MM:SS.mmm
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const secondsAndMs = parts[2].split('.');
    const seconds = parseInt(secondsAndMs[0]);
    const milliseconds = parseInt(secondsAndMs[1]);

    return (hours * 3600) + (minutes * 60) + seconds + (milliseconds / 1000);
  }
}

function testSubtitleUrl(trackElement, trackIndex) {
  const subtitleUrl = trackElement.src;
  console.log(`🎬 🧪 Testing subtitle URL ${trackIndex}:`, subtitleUrl);

  fetch(subtitleUrl)
    .then(response => {
      console.log(`🎬 🧪 Subtitle URL ${trackIndex} response:`, {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });

      if (response.ok) {
        return response.text();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    })
    .then(subtitleContent => {
      const preview = subtitleContent.substring(0, 200);
      console.log(`🎬 🧪 Subtitle content preview (${trackIndex}):`, preview + (subtitleContent.length > 200 ? '...' : ''));
      console.log(`🎬 🧪 Total subtitle content length (${trackIndex}):`, subtitleContent.length, 'characters');
    })
    .catch(error => {
      console.error(`🎬 🧪 ❌ Subtitle URL test failed (${trackIndex}):`, error);
    });
}

function setupManualSubtitleDisplay() {
  console.log('🎬 ⚙️ Setting up manual subtitle display system');

  // Create subtitle timing control panel
  createSubtitleTimingControl();

  // Start subtitle update loop
  startSubtitleUpdateLoop();
}

function createSubtitleTimingControl() {
  // Remove existing control if present
  const existingControl = document.getElementById('subtitle-timing-control');
  if (existingControl) {
    existingControl.remove();
  }

  const controlPanel = document.createElement('div');
  controlPanel.id = 'subtitle-timing-control';
  controlPanel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 2000;
    min-width: 300px;
    border: 1px solid #333;
  `;

  controlPanel.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: bold;">📺 Subtitle Timing Control</div>
    
    <div style="margin-bottom: 8px;">
      <label>🎬 Current Movie Time: <span id="current-movie-time">00:00:00</span></label>
    </div>
    
    <div style="margin-bottom: 8px;">
      <label>⏰ Raw Video Time: <span id="raw-video-time">00:00:00</span></label>
    </div>
    
    <div style="margin-bottom: 8px;">
      <label>🎯 Time Offset: <input type="number" id="subtitle-offset" value="0" style="width: 80px; background: #333; color: white; border: 1px solid #555; padding: 2px;"> seconds</label>
    </div>
    
    <div style="margin-bottom: 8px;">
      <label>📝 Active Subtitle: <span id="active-subtitle-text">None</span></label>
    </div>
    
    <div style="margin-bottom: 8px;">
      <button id="sync-subtitle-btn" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">🔄 Sync with Current Time</button>
    </div>
    
    <div style="font-size: 12px; color: #ccc;">
      ℹ️ Adjust offset to sync subtitles with video
    </div>
  `;

  document.body.appendChild(controlPanel);

  // Add event listener for sync button
  document.getElementById('sync-subtitle-btn').addEventListener('click', () => {
    const currentMovieTime = parseInt(startTime) + parseInt(videoPlayer.currentTime);
    document.getElementById('subtitle-offset').value = currentMovieTime;
    console.log('🎬 🔄 Subtitle offset synced to current time:', currentMovieTime);
  });

  console.log('🎬 ⚙️ Subtitle timing control panel created');
}

function startSubtitleUpdateLoop() {
  if (window.subtitleUpdateInterval) {
    clearInterval(window.subtitleUpdateInterval);
  }

  window.subtitleUpdateInterval = setInterval(() => {
    if (manualSubtitleActive && manualSubtitleCues.length > 0) {
      updateManualSubtitles();
    }
  }, 100); // Update every 100ms for smooth subtitle display

  console.log('🎬 ⚙️ Subtitle update loop started');
}

function updateManualSubtitles() {
  // Get current times
  const rawVideoTime = videoPlayer.currentTime;
  console.log("rawVideoTime ", rawVideoTime);
  const currentMovieTime = parseInt(startTime) + parseInt(rawVideoTime);
  console.log("currentMovieTime ", currentMovieTime);
  const subtitleOffset = parseInt(document.getElementById('subtitle-offset')?.value || 0);
  console.log("subtitleOffset ", subtitleOffset);
  const adjustedTime = subtitleOffset; // Use the offset as the reference time for subtitles
  console.log("adjustedTime ", adjustedTime);
  // Update time displays
  document.getElementById('current-movie-time').textContent = formatTimeForDisplay(currentMovieTime);
  document.getElementById('raw-video-time').textContent = formatTimeForDisplay(rawVideoTime);

  // Find active subtitle cue
  const activeCue = manualSubtitleCues.find(cue =>
    adjustedTime >= cue.startTime && adjustedTime <= cue.endTime
  );

  if (activeCue) {
    document.getElementById('active-subtitle-text').textContent = activeCue.text.substring(0, 50) + '...';
    displayManualSubtitle(activeCue.text);
  } else {
    document.getElementById('active-subtitle-text').textContent = 'None';
    hideManualSubtitle();
  }
}

function displayManualSubtitle(text) {
  // Remove existing manual subtitle
  const existingSubtitle = document.getElementById('manual-subtitle-display');
  if (existingSubtitle) {
    existingSubtitle.remove();
  }

  // Create new subtitle display
  const subtitleDiv = document.createElement('div');
  subtitleDiv.id = 'manual-subtitle-display';
  subtitleDiv.style.cssText = `
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 18px;
    font-family: Arial, sans-serif;
    text-align: center;
    z-index: 1500;
    max-width: 80%;
    line-height: 1.4;
    pointer-events: none;
    white-space: pre-line;
  `;

  subtitleDiv.textContent = text;

  // Add to video container
  const videoContainer = videoPlayer.parentElement;
  videoContainer.style.position = 'relative';
  videoContainer.appendChild(subtitleDiv);
}

function hideManualSubtitle() {
  const existingSubtitle = document.getElementById('manual-subtitle-display');
  if (existingSubtitle) {
    existingSubtitle.remove();
  }
}

function formatTimeForDisplay(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function switchSubtitleTrack(trackIndex) {
  console.log('🎬 Switching subtitle track:', {
    from: currentSubtitleTrackIndex,
    to: trackIndex,
    tracksAvailable: currentSubtitleTracks.length
  });

  currentSubtitleTrackIndex = trackIndex;

  // Update UI
  updateSubtitleTrackButtonLabel();
  updateActiveSubtitleMenuItem();

  // Hide menu after selection
  subtitleTrackMenu.style.display = 'none';

  // Enable the selected subtitle track (or disable all if trackIndex is -1)
  enableSubtitleTrack(trackIndex);
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
  const audioTrackButtonMobile = document.getElementById('audioTrackButton-mobile');
  const subtitleTrackButtonMobile = document.getElementById('subtitleTrackButton-mobile');
  const audioTrackMenuMobile = document.getElementById('audioTrackMenu-mobile');
  const subtitleTrackMenuMobile = document.getElementById('subtitleTrackMenu-mobile');

  // Close desktop menus
  if (audioTrackMenu && audioTrackButton) {
    if (!audioTrackButton.contains(e.target) &&
      !audioTrackButtonMobile?.contains(e.target) &&
      !audioTrackMenu.contains(e.target)) {
      audioTrackMenu.style.display = 'none';
    }
  }
  if (subtitleTrackMenu && subtitleTrackButton) {
    if (!subtitleTrackButton.contains(e.target) &&
      !subtitleTrackButtonMobile?.contains(e.target) &&
      !subtitleTrackMenu.contains(e.target)) {
      subtitleTrackMenu.style.display = 'none';
    }
  }

  // Close mobile menus
  if (audioTrackMenuMobile && audioTrackButtonMobile) {
    if (!audioTrackButtonMobile.contains(e.target) &&
      !audioTrackMenuMobile.contains(e.target)) {
      audioTrackMenuMobile.style.display = 'none';
    }
  }
  if (subtitleTrackMenuMobile && subtitleTrackButtonMobile) {
    if (!subtitleTrackButtonMobile.contains(e.target) &&
      !subtitleTrackMenuMobile.contains(e.target)) {
      subtitleTrackMenuMobile.style.display = 'none';
    }
  }
});

// Subtitle track button event listeners
if (subtitleTrackButton) {
  // Toggle menu on button click
  subtitleTrackButton.addEventListener('click', (e) => {
    e.stopPropagation();
    if (subtitleTrackMenu.style.display === 'none' || !subtitleTrackMenu.style.display) {
      subtitleTrackMenu.style.display = 'block';
    } else {
      subtitleTrackMenu.style.display = 'none';
    }
  });

  // Keep controls visible when button is focused
  subtitleTrackButton.addEventListener('focus', () => {
    const controls = document.querySelector('.controls');
    if (controls) {
      controls.classList.add('show-subtitle-button');
    }
  });

  subtitleTrackButton.addEventListener('blur', () => {
    const controls = document.querySelector('.controls');
    if (controls) {
      controls.classList.remove('show-subtitle-button');
    }
  });

  subtitleTrackButton.addEventListener('mouseenter', () => {
    const controls = document.querySelector('.controls');
    if (controls) {
      controls.classList.add('show-subtitle-button');
    }
  });

  subtitleTrackButton.addEventListener('mouseleave', () => {
    const controls = document.querySelector('.controls');
    if (controls) {
      controls.classList.remove('show-subtitle-button');
    }
  });
}

// Subtitle track menu event listeners
if (subtitleTrackMenu) {
  // Handle menu item clicks
  subtitleTrackMenu.addEventListener('click', (e) => {
    const menuItem = e.target.closest('.subtitle-track-menu-item');
    if (menuItem) {
      const trackIndex = parseInt(menuItem.dataset.trackIndex);
      if (trackIndex !== currentSubtitleTrackIndex) {
        switchSubtitleTrack(trackIndex);
      }
    }
  });
}

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
document.addEventListener('keydown', function (e) {
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

  switch (e.key) {
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
