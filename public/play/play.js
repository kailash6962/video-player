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
        videos.forEach(video => {
            gallery.appendChild(renderVideoCard(video));
        });
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
            document.getElementById(currentVideoId).querySelector('.watched-time').style.width = watchedPercentage + '%';
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

// Optionally, call once on load to sync icon
updatePlayPauseIcon();
