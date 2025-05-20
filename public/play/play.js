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
let currentVideoDuration = null;
let progressUpdateTimeout = null;

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
        console.log("📢[:91]: videos: ", videos);
        const gallery = document.getElementById('videoGallery');
        videos.forEach(video => {
            gallery.appendChild(renderVideoCard(video));
        });
    })
    .catch(err => console.error('Error loading videos:', err));

function playVideo(videodata, play = true) {
    console.log("📢[:116]: videodata: ", videodata);
    document.getElementById('video-title').innerText = videodata.title;
    document.getElementById('player-title').innerText = videodata.title;
    document.getElementById('main-video-size').innerText = videodata.size + 'KB';
    document.getElementById('main-video-lastviewed').innerText = 'Last viewed: ' + convertDate(videodata.lastOpened);
    currentVideoId = videodata.id;
    currentVideoDuration = videodata.duration;
    // Show the player container
    playerContainer.style.display = 'block';
    // Set the video source. Note: We are using our API to stream the video.
    videoPlayer.src = `/api/video/${series}/${videodata.id}`;
    manualDuration = videodata.duration;

    // Fetch the saved watch progress for this video
    fetch(`/api/watch-progress/${videodata.id}`, {
        method: 'GET',
        headers: {
            'x-db-name': series
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log("📢[:127]: data: ", data);
            if (data.current_time && data.current_time > 0) {
                startTime = data.current_time;
                const url = new URL(video.src);
                url.searchParams.set('start', data.current_time); // update or add start param
                video.src = url.toString();

            } else {
                const url = new URL(video.src);
                url.searchParams.set('start', data.current_time); // update or add start param
                video.src = url.toString();
            }

            video.load();                            // reload video with new source
            if (play)
                video.play();



        })
        .catch(err => {
            console.error('Error fetching watch progress:', err);
            if (play)
                videoPlayer.play();
        });
}

// Periodically save watch progress
videoPlayer.addEventListener('timeupdate', () => {
    // Throttle the updates (e.g., update every 5 seconds)
    if (progressUpdateTimeout) return;

    progressUpdateTimeout = setTimeout(() => {
        const current_time = videoPlayer.currentTime;
        const updatedCurrTime = parseInt(startTime) + parseInt(current_time);
        const watchedPercentage = (updatedCurrTime / currentVideoDuration) * 100;
        fetch('/api/watch-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-db-name': series },
            body: JSON.stringify({ video_id: currentVideoId, current_time: updatedCurrTime }),
        }).catch(err => console.error('Error saving progress:', err));

        document.getElementById(currentVideoId).querySelector('.watched-time').style.width = watchedPercentage + '%';

        progressUpdateTimeout = null;
    }, 5000); // 5000ms = 5 seconds
});

video.addEventListener('ended', () => {
    if (confirm('Video finished playing!')) {
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
    console.log("📢[:198]: manualDuration: ", manualDuration);
    seek.max = manualDuration;
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
    } else {
        playerContainer.requestFullscreen();
        controls.style.display = 'none';
        playertitle.style.display = 'none';

        // Add hover effect to show controls in fullscreen
        playerContainer.addEventListener('mousemove', () => {
            controls.style.display = 'flex';
            playertitle.style.display = 'block';
            clearTimeout(playerContainer.hideControlsTimeout);
            playerContainer.hideControlsTimeout = setTimeout(() => {
                controls.style.display = 'none';
                playertitle.style.display = 'none';
            }, 2000); // Hide controls after 2 seconds of inactivity
        });
    }
});
