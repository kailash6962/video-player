function renderVideoCard(video) {
    const params = new URLSearchParams(window.location.search);

    const series = params.get('series');
    const getvideo = params.get('video');

    const div = document.createElement('div');
    div.className = 'video';
    div.id = video.id;

    const nowPlaying = video.active || video.id==getvideo ? true : false;

    // Create thumbnail container
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'video-thumbnail-container';

    const durationContainer = document.createElement('div');
    durationContainer.className = 'duration';
    durationContainer.textContent = formatTime(video.duration);
    
    // Create the video element
    const imageElement = document.createElement('img');
    imageElement.className = `thumbnail`;
    imageElement.src = `/api/thumbnail/file/${series || 'home'}/${video.id}`;
    
    // Create the watched time redline
    const watchedTime = document.createElement('div');
    watchedTime.id = 'watched-time';
    watchedTime.className = 'watched-time';
    watchedTime.style.width = '0%';
    
    // Append video and redline to thumbnail container
    thumbnailContainer.appendChild(imageElement);
    thumbnailContainer.appendChild(watchedTime);
    thumbnailContainer.appendChild(durationContainer);

    if(nowPlaying) {
        const overlayTextContainer = document.createElement('div');
        overlayTextContainer.className = 'thumbnailoverlay-text';
        overlayTextContainer.textContent = "Watching Now";
        thumbnailContainer.appendChild(overlayTextContainer);
    }

    // Create the details section
    const details = document.createElement('div');
    details.className = 'details';

    const videoName = document.createElement('span');
    videoName.className = 'video-name';
    videoName.textContent = cleanVideoTitle(video.title);

    const stats = document.createElement('div');
    stats.className = 'video-stats';

    const lastViewed = document.createElement('span');
    const lastViewedDate = video.lastOpened? `Last viewed ${convertDate(video.lastOpened)}` : "Not viewed yet";
    lastViewed.textContent = lastViewedDate;

    // Assemble the stats
    stats.appendChild(lastViewed);
    details.appendChild(videoName);
    details.appendChild(stats);

    // Final assembly
    div.appendChild(thumbnailContainer);
    div.appendChild(details);

    // Event listeners
    if(series)
    div.addEventListener('click', () => playVideo(video));
    else
    div.addEventListener('click', () => window.location.href = `/play?series=home&video=${video.id}`);

    const sizeAndStatus = document.createElement('span');
    sizeAndStatus.textContent = `${(video.duration - 5) <= video.current_time ? 'Watched ✅' : ''}`;
    stats.appendChild(sizeAndStatus);
    // Initial watched time update
    const currentTime = video.current_time || 0;
    const watchedPercentage = (currentTime / video.duration) * 100;
    watchedTime.style.width = watchedPercentage + '%';
    
    if(getvideo && getvideo==video.id) playVideo(video,false)
    if(!getvideo && video.active && series) playVideo(video,false) 

    
    return div;
}
function convertDate(date){
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}
function formatTime(seconds) {
     const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}
function playVideo(videodata,play=true) {
  loader.style.display = 'flex';
  console.log("📢[:116]: videodata: ", videodata);
  document.getElementById('video-title').innerText = cleanVideoTitle(videodata.title);
  document.getElementById('player-title').innerText = cleanVideoTitle(videodata.title);
//   document.getElementById('main-video-size').innerText = videodata.size+'KB';
  document.getElementById('main-video-lastviewed').innerText = videodata.lastOpened?`Last viewed: ${convertDate(videodata.lastOpened)}`:"Not viewed yet";
  currentVideoId = videodata.id;
  currentVideoDuration = videodata.duration;
  startTime = 0;
  // Show the player container
  playerContainer.style.display = 'block';
  // Set the video source. Note: We are using our API to stream the video.
  videoPlayer.src = `/api/video/${series}/${videodata.id}`;

  manualDuration = videodata.duration;

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
    console.warn("Thumbnail container not found for ID:", videodata.id);
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
        if(play)
        video.play();   
    })
    .catch(err => {
      console.error('Error fetching watch progress:', err);
      if(play)
      videoPlayer.play();
    });
}

function cleanVideoTitle(title) {
    // Remove domain-like prefix ending with ' - '
    return title.replace(/^([\w.-]+)\s*-\s*/i, '');
}