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

function renderVideoCard(video) {
    const div = document.createElement('div');
    div.className = 'video';
    div.id = video.id;

    // Create thumbnail container
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'video-thumbnail-container';

    // Create the video element
    const videoElement = document.createElement('video');
    videoElement.controls = false;
    const source = document.createElement('source');
    source.src = video.url;
    source.type = 'video/mp4';
    videoElement.appendChild(source);

    // Create the watched time redline
    const watchedTime = document.createElement('div');
    watchedTime.id = 'watched-time';
    watchedTime.className = 'watched-time';
    watchedTime.style.width = '0%';

    // Append video and redline to thumbnail container
    thumbnailContainer.appendChild(videoElement);
    thumbnailContainer.appendChild(watchedTime);

    // Create the details section
    const details = document.createElement('div');
    details.className = 'details';

    const videoName = document.createElement('span');
    videoName.className = 'video-name';
    videoName.textContent = video.title;

    const stats = document.createElement('div');
    stats.className = 'video-stats';

    const lastViewed = document.createElement('span');
    const lastViewedDate = new Date(video.lastOpened).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    lastViewed.textContent = `Last viewed ${lastViewedDate}`;

    // Assemble the stats
    stats.appendChild(lastViewed);
    details.appendChild(videoName);
    details.appendChild(stats);

    // Final assembly
    div.appendChild(thumbnailContainer);
    div.appendChild(details);

    // Event listeners
    div.addEventListener('click', () => playVideo(video));
    div.addEventListener('click', () => manualDuration = videoElement.duration);

    // Handle duration and watched bar
    videoElement.addEventListener('loadedmetadata', () => {
        const duration = videoElement.duration;

        const sizeAndStatus = document.createElement('span');
        sizeAndStatus.textContent = `${Math.round(video.size / 1024)}KB • ${video.isPlaying ? 'Now playing' : ''} ${duration<=video.current_time ? 'Watched' : ''}`;
        stats.appendChild(sizeAndStatus);

        videoElement.addEventListener('timeupdate', () => {
            const currentTime = video.current_time || videoElement.currentTime;
            const watchedPercentage = (currentTime / duration) * 100;
            watchedTime.style.width = watchedPercentage + '%';
        });

        // Initial watched time update
        const currentTime = video.current_time || videoElement.currentTime;
        const watchedPercentage = (currentTime / duration) * 100;
        watchedTime.style.width = watchedPercentage + '%';
    });

    return div;
}



fetch('/api/videos')
    .then(response => response.json())
    .then(videos => {
        console.log("📢[:91]: videos: ", videos);
        const gallery = document.getElementById('videoGallery');
        videos.forEach(video => {
            gallery.appendChild(renderVideoCard(video));
        });
    })
    .catch(err => console.error('Error loading videos:', err));

function playVideo(videodata,play=true) {
  currentVideoId = videodata.id;
  // Show the player container
  playerContainer.style.display = 'block';
  // Set the video source. Note: We are using our API to stream the video.
  videoPlayer.src = `/api/video/${videodata.id}`;
  videoPlayer.load();
  
  // Fetch the saved watch progress for this video
  fetch(`/api/watch-progress/${videodata.id}`)
    .then(response => response.json())
    .then(data => {
      if (data.current_time && data.current_time > 0) {
         startTime = data.current_time;
         const url = new URL(video.src);
          url.searchParams.set('start', data.current_time); // update or add start param
          video.src = url.toString();
          video.load();                            // reload video with new source
          // video.play();
        }
        if(play)
        videoPlayer.play();


     
    })
    .catch(err => {
      console.error('Error fetching watch progress:', err);
      if(play)
      videoPlayer.play();
    });
}

// Periodically save watch progress
videoPlayer.addEventListener('timeupdate', () => {
  // Throttle the updates (e.g., update every 5 seconds)
  if (progressUpdateTimeout) return;
  
  progressUpdateTimeout = setTimeout(() => {
    const current_time = videoPlayer.currentTime;
    fetch('/api/watch-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: currentVideoId, current_time:parseInt(startTime)+parseInt(current_time) }),
    }).catch(err => console.error('Error saving progress:', err));
    
    progressUpdateTimeout = null;
  }, 5000); // 5000ms = 5 seconds
});

video.addEventListener('ended', () => {
    if(confirm('Video finished playing!')){
        console.log("📢[:150]: curren   tVideoId: ", currentVideoId);
        const currentVideoElement = document.getElementById(currentVideoId);

        if (currentVideoElement) {
        const nextElement = currentVideoElement.nextElementSibling;
        console.log(nextElement);

        if (nextElement) {
            nextElement.click();
        }
        }

    } else {
        console.log("Player ended but user chose not to play next video.");
    }
   
    // You can also trigger other logic here
  });

//vide player retated


    // Optional: manually set duration if it's not detected (e.g. streaming with no metadata)
    let isManual = false;

    video.addEventListener('loadedmetadata', () => {
        // if (!isFinite(video.duration) || video.duration === Infinity) {
        isManual = true;
        durationEl.textContent = formatTime(manualDuration);
        seek.max = manualDuration;
        // } else {
        //   durationEl.textContent = formatTime(video.duration);
        //   seek.max = video.duration;
        // }
    });

    playPause.addEventListener('click', () => {
        if (video.paused) {
        video.play();
        playPause.textContent = '⏸️';
        } else {
        video.pause();
        playPause.textContent = '▶️';
        }
    });

    video.addEventListener('timeupdate', (e) => {
        seek.value = parseInt(startTime)+parseInt(video.currentTime);
        currentTimeEl.textContent = formatTime(seek.value);
        // seek.value = video.currentTime;
    });

    seek.addEventListener('input', (e) => {
        video.currentTime = seek.value;
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

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
//vide player retated
