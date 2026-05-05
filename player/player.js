const video = document.getElementById('video');
const playerContainer = document.getElementById('player-container');
const playPauseBtn = document.getElementById('play-pause');
const bigPlayBtn = document.getElementById('big-play');
const rewindBtn = document.getElementById('rewind');
const forwardBtn = document.getElementById('forward');
const muteBtn = document.getElementById('mute-btn');
const volumeSlider = document.getElementById('volume-slider');
const speedBtn = document.getElementById('speed-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const progressBar = document.getElementById('progress-bar');
const progressArea = document.getElementById('progress-area');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const loader = document.getElementById('loader');
const statusOverlay = document.getElementById('status-overlay');
const qualityBtn = document.getElementById('quality-btn');
const qualityMenu = document.getElementById('quality-menu');
const seekTooltip = document.getElementById('seek-tooltip');

let hls;
let hideControlsTimeout;
let isMuted = false;
let currentSpeed = 1;
let isDragging = false;

// --- Initialization ---

function initPlayer() {
    const hash = window.location.hash.substring(1);
    if (!hash) {
        alert('No m3u8 URL provided!');
        return;
    }
    const url = decodeURIComponent(hash);
    playM3u8(url);
}

function playM3u8(url) {
    if (Hls.isSupported()) {
        hls = new Hls({
            capLevelToPlayerSize: true,
            lowLatencyMode: true,
            enableWorker: true
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            setupQualityMenu(data.levels);
            attemptPlay();
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
            updateQualityActiveState(data.level);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        hls.recoverMediaError();
                        break;
                    default:
                        hls.destroy();
                        break;
                }
            }
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', attemptPlay);
    }
}

function setupQualityMenu(levels) {
    qualityMenu.innerHTML = '';
    const autoItem = document.createElement('div');
    autoItem.className = 'quality-item active';
    autoItem.dataset.level = '-1';
    autoItem.innerText = 'Auto';
    autoItem.onclick = () => setQuality(-1);
    qualityMenu.appendChild(autoItem);

    if (levels && levels.length > 1) {
        levels.forEach((level, index) => {
            const item = document.createElement('div');
            item.className = 'quality-item';
            item.dataset.level = index;
            const label = level.height ? `${level.height}p` : `Level ${index}`;
            item.innerText = label;
            item.onclick = () => setQuality(index);
            qualityMenu.appendChild(item);
        });
        qualityBtn.style.display = 'flex';
    } else {
        qualityBtn.style.display = 'none';
    }
}

function setQuality(levelIndex) {
    if (hls) {
        hls.currentLevel = levelIndex;
        updateQualityActiveState(levelIndex);
        qualityMenu.classList.remove('show');
    }
}

function updateQualityActiveState(activeLevel) {
    const items = qualityMenu.querySelectorAll('.quality-item');
    items.forEach(item => {
        item.classList.toggle('active', parseInt(item.dataset.level) === activeLevel);
    });
}

function attemptPlay() {
    loader.style.display = 'block';
    const playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.catch(() => {
            bigPlayBtn.style.display = 'flex';
            loader.style.display = 'none';
        });
    }
}

// --- UI Helpers ---

function formatTime(time) {
    if (isNaN(time) || time === Infinity) return "00:00";
    const hrs = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = Math.floor(time % 60);

    const displaySecs = secs < 10 ? '0' + secs : secs;
    
    if (hrs > 0) {
        const displayMins = mins < 10 ? '0' + mins : mins;
        return `${hrs}:${displayMins}:${displaySecs}`;
    } else {
        const displayMins = mins < 10 ? '0' + mins : mins;
        return `${displayMins}:${displaySecs}`;
    }
}

function showStatus(icon, text = '') {
    statusOverlay.innerHTML = `<i class="fas fa-${icon}"></i><div style="font-size: 14px; margin-top: 10px; font-weight: 600;">${text}</div>`;
    $(statusOverlay).stop(true, true).fadeIn(100).delay(600).fadeOut(200);
}

function toggleControls(show) {
    if (show) {
        playerContainer.classList.add('show-controls');
        playerContainer.style.cursor = 'default';
        clearTimeout(hideControlsTimeout);
        if (!video.paused) {
            hideControlsTimeout = setTimeout(() => toggleControls(false), 3000);
        }
    } else {
        playerContainer.classList.remove('show-controls');
        playerContainer.style.cursor = 'none';
        qualityMenu.classList.remove('show');
    }
}

// --- Control Actions ---

function togglePlay() {
    if (video.paused) {
        video.play();
        bigPlayBtn.style.display = 'none';
    } else {
        video.pause();
    }
}

function updatePlayPauseUI() {
    const isPaused = video.paused;
    playPauseBtn.innerHTML = isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    if (isPaused) toggleControls(true);
}

function seek(seconds) {
    video.currentTime += seconds;
    showStatus(seconds > 0 ? 'forward' : 'backward', `${seconds > 0 ? '+' : ''}${seconds}s`);
}

function toggleMute() {
    isMuted = !isMuted;
    video.muted = isMuted;
    updateVolumeUI();
}

function updateVolumeUI() {
    if (video.muted || video.volume === 0) {
        muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else if (video.volume < 0.5) {
        muteBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
    } else {
        muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
    volumeSlider.value = video.muted ? 0 : video.volume;
}

function changeVolume(val) {
    video.volume = val;
    video.muted = (val == 0);
    updateVolumeUI();
}

function changeSpeed() {
    currentSpeed += 0.25;
    if (currentSpeed > 5) currentSpeed = 0.25;
    video.playbackRate = currentSpeed;
    speedBtn.innerText = currentSpeed + 'x';
    showStatus('bolt', currentSpeed + 'x');
}

function toggleFullscreen() {
    const doc = window.document;
    const docEl = playerContainer;

    const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    const isFullscreen = !!(doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement || playerContainer.classList.contains('fake-fullscreen'));

    if (!isFullscreen) {
        if (requestFullScreen) {
            requestFullScreen.call(docEl).catch(() => {
                enterFakeFullscreen();
            });
        } else {
            enterFakeFullscreen();
        }
        
        // Handle Orientation
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {
                // Fallback for devices that don't support locking
                if (window.innerHeight > window.innerWidth) {
                    playerContainer.classList.add('rotated');
                }
            });
        } else if (window.innerHeight > window.innerWidth) {
            playerContainer.classList.add('rotated');
        }
    } else {
        if (doc.fullscreenElement) {
            if (cancelFullScreen) cancelFullScreen.call(doc);
        }
        exitFakeFullscreen();
        playerContainer.classList.remove('rotated');
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock().catch(() => {});
        }
    }
}

function enterFakeFullscreen() {
    playerContainer.classList.add('fake-fullscreen');
    playerContainer.style.position = 'fixed';
    playerContainer.style.top = '0';
    playerContainer.style.left = '0';
    playerContainer.style.width = '100vw';
    playerContainer.style.height = '100vh';
    playerContainer.style.zIndex = '9999';
    document.body.style.overflow = 'hidden';
}

function exitFakeFullscreen() {
    playerContainer.classList.remove('fake-fullscreen');
    playerContainer.style.position = '';
    playerContainer.style.top = '';
    playerContainer.style.left = '';
    playerContainer.style.width = '';
    playerContainer.style.height = '';
    playerContainer.style.zIndex = '';
    document.body.style.overflow = '';
}

// --- Event Listeners ---

video.addEventListener('play', () => {
    updatePlayPauseUI();
    bigPlayBtn.style.display = 'none';
});
video.addEventListener('pause', updatePlayPauseUI);
video.addEventListener('waiting', () => loader.style.display = 'block');
video.addEventListener('playing', () => {
    loader.style.display = 'none';
    bigPlayBtn.style.display = 'none';
});

video.addEventListener('timeupdate', () => {
    if (!isNaN(video.duration) && !isDragging) {
        const percent = (video.currentTime / video.duration) * 100;
        progressBar.style.width = `${percent}%`;
        currentTimeEl.innerText = formatTime(video.currentTime);
    }
});

video.addEventListener('loadedmetadata', () => {
    durationEl.innerText = formatTime(video.duration);
});

function scrub(e) {
    const rect = progressArea.getBoundingClientRect();
    let x = (e.pageX || (e.touches && e.touches[0] ? e.touches[0].pageX : (e.changedTouches ? e.changedTouches[0].pageX : 0))) - rect.left;
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;
    
    const percent = (x / rect.width);
    progressBar.style.width = (percent * 100) + '%';
    
    const seekTime = percent * video.duration;
    if (!isNaN(video.duration)) {
        currentTimeEl.innerText = formatTime(seekTime);
        seekTooltip.innerText = formatTime(seekTime);
        seekTooltip.style.left = `${x}px`;
        seekTooltip.style.display = 'block';
    }
    return percent;
}

progressArea.addEventListener('mousedown', (e) => {
    isDragging = true;
    scrub(e);
});

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        scrub(e);
    } else {
        // Just show tooltip on hover
        const rect = progressArea.getBoundingClientRect();
        if (e.pageY >= rect.top - 20 && e.pageY <= rect.bottom + 20 && e.pageX >= rect.left && e.pageX <= rect.right) {
            const x = e.pageX - rect.left;
            const percent = x / rect.width;
            if (!isNaN(video.duration)) {
                seekTooltip.innerText = formatTime(percent * video.duration);
                seekTooltip.style.left = `${x}px`;
                seekTooltip.style.display = 'block';
            }
        } else {
            seekTooltip.style.display = 'none';
        }
    }
});

window.addEventListener('mouseup', (e) => {
    if (isDragging) {
        isDragging = false;
        const percent = scrub(e);
        if (!isNaN(video.duration)) {
            video.currentTime = percent * video.duration;
        }
        seekTooltip.style.display = 'none';
    }
});

// Touch support for scrubbing
progressArea.addEventListener('touchstart', (e) => {
    isDragging = true;
    scrub(e);
});

window.addEventListener('touchmove', (e) => {
    if (isDragging) scrub(e);
}, { passive: false });

window.addEventListener('touchend', (e) => {
    if (isDragging) {
        isDragging = false;
        const rect = progressArea.getBoundingClientRect();
        let x = (e.changedTouches[0].pageX) - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        if (!isNaN(video.duration)) {
            video.currentTime = percent * video.duration;
        }
        seekTooltip.style.display = 'none';
    }
});

playPauseBtn.addEventListener('click', togglePlay);
bigPlayBtn.addEventListener('click', togglePlay);
rewindBtn.addEventListener('click', () => seek(-10));
forwardBtn.addEventListener('click', () => seek(10));
muteBtn.addEventListener('click', toggleMute);
speedBtn.addEventListener('click', changeSpeed);
fullscreenBtn.addEventListener('click', toggleFullscreen);

volumeSlider.addEventListener('input', (e) => changeVolume(e.target.value));
playerContainer.addEventListener('mousemove', () => toggleControls(true));

// Mobile Touch Swipes
let touchStartX = 0;
let touchStartY = 0;
playerContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    toggleControls(true);
});

playerContainer.addEventListener('touchend', (e) => {
    const diffX = touchStartX - e.changedTouches[0].clientX;
    const diffY = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 50) diffX > 0 ? seek(-10) : seek(10);
    } else {
        if (Math.abs(diffY) > 50) diffY > 0 ? changeVolume(Math.min(1, video.volume + 0.1)) : changeVolume(Math.max(0, video.volume - 0.1));
    }
});

playerContainer.addEventListener('click', (e) => {
    if (e.target === video || e.target === playerContainer) togglePlay();
});

document.addEventListener('fullscreenchange', () => {
    const isFullscreen = !!document.fullscreenElement;
    fullscreenBtn.innerHTML = isFullscreen ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
    if (!isFullscreen && !playerContainer.classList.contains('fake-fullscreen')) {
        playerContainer.classList.remove('rotated');
    }
});

// Auto-rotate logic for phone
window.addEventListener('orientationchange', () => {
    const isFullscreen = !!(document.fullscreenElement || playerContainer.classList.contains('fake-fullscreen'));
    if (isFullscreen) {
        if (window.orientation === 90 || window.orientation === -90) {
            playerContainer.classList.remove('rotated');
        } else {
            playerContainer.classList.add('rotated');
        }
    }
});

qualityBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    qualityMenu.classList.toggle('show');
});

document.addEventListener('click', () => qualityMenu.classList.remove('show'));

Mousetrap.bind('space', (e) => { e.preventDefault(); togglePlay(); });
Mousetrap.bind('f', (e) => { e.preventDefault(); toggleFullscreen(); });
Mousetrap.bind('m', (e) => { e.preventDefault(); toggleMute(); });
Mousetrap.bind('right', (e) => { e.preventDefault(); seek(5); });
Mousetrap.bind('left', (e) => { e.preventDefault(); seek(-5); });

initPlayer();
toggleControls(true);