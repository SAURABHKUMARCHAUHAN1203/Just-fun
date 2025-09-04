var video = document.getElementById('video');
var hls, retryCount = 0, overlayTimer;

function updateOverlay() {
    $('#speed').text(video.playbackRate + 'x');
    $('#volume').text(Math.round(video.volume * 100) + '%');
    $('#info').removeClass('hidden');
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => $('#info').addClass('hidden'), 3000);
}

function showError(msg) {
    $('#error').text(msg).removeClass('hidden');
    setTimeout(() => $('#error').addClass('hidden'), 3000);
}

function playM3u8(url) {
    if (!url) return showError('No URL provided');
    
    if (Hls.isSupported()) {
        video.volume = 0.3;
        hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
        });
        var m3u8Url = decodeURIComponent(url);
        hls.loadSource(m3u8Url);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
            video.play();
            populateQualitySelector(data.levels);
        });
        
        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                if (retryCount < 3) {
                    retryCount++;
                    showError(`Connection lost. Retry ${retryCount}/3`);
                    setTimeout(() => hls.loadSource(m3u8Url), 2000);
                } else {
                    showError('Stream failed permanently');
                }
            }
        });
        
        document.title = url;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('canplay', () => video.play());
        video.volume = 0.3;
        document.title = url;
    } else {
        showError('Browser not supported');
    }
}

function populateQualitySelector(levels) {
    const select = $('#quality');
    select.empty().append('<option value="-1">Auto Quality</option>');
    levels.forEach((level, i) => {
        select.append(`<option value="${i}">${level.height}p (${Math.round(level.bitrate/1000)}k)</option>`);
    });
}

function playPause() {
    video.paused ? video.play() : video.pause();
}

function volumeUp() {
    if (video.volume <= 0.9) {
        video.volume += 0.1;
        updateOverlay();
    }
}

function volumeDown() {
    if (video.volume >= 0.1) {
        video.volume -= 0.1;
        updateOverlay();
    }
}

function seekRight() {
    video.currentTime += 5;
}

function seekLeft() {
    video.currentTime -= 5;
}

function toggleMute() {
    video.muted = !video.muted;
    updateOverlay();
}

function speedUp() {
    if (video.playbackRate < 4) {
        video.playbackRate += 0.25;
        updateOverlay();
    }
}

function speedDown() {
    if (video.playbackRate > 0.25) {
        video.playbackRate -= 0.25;
        updateOverlay();
    }
}

function resetSpeed() {
    video.playbackRate = 1;
    updateOverlay();
}

function vidFullscreen() {
    if (video.requestFullscreen) {
        video.requestFullscreen();
    } else if (video.mozRequestFullScreen) {
        video.mozRequestFullScreen();
    } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
    }
}

function togglePiP() {
    if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
    } else if (video.requestPictureInPicture) {
        video.requestPictureInPicture();
    }
}

function takeScreenshot() {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const link = document.createElement('a');
    link.download = 'screenshot.png';
    link.href = canvas.toDataURL();
    link.click();
}

function toggleTheme() {
    document.body.style.backgroundColor = document.body.style.backgroundColor === 'white' ? 'black' : 'white';
}

playM3u8(window.location.href.split('#')[1]);

$(window).on('load', function () {
    updateOverlay();
    
    $('#video').on('click', function () {
        this.paused ? this.play() : this.pause();
    });
    
    $('#quality').on('change', function() {
        if (hls) hls.currentLevel = parseInt(this.value);
    });
    
    $('#pip').on('click', togglePiP);
    $('#screenshot').on('click', takeScreenshot);
    $('#theme').on('click', toggleTheme);
    
    // Touch support for mobile
    let touchStartX, touchStartY;
    video.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    video.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (Math.abs(diffX) > 50) {
                diffX > 0 ? seekLeft() : seekRight();
            }
        } else {
            if (Math.abs(diffY) > 50) {
                diffY > 0 ? volumeUp() : volumeDown();
            }
        }
    });
    
    // Keyboard shortcuts
    Mousetrap.bind('space', playPause);
    Mousetrap.bind('up', volumeUp);
    Mousetrap.bind('down', volumeDown);
    Mousetrap.bind('right', seekRight);
    Mousetrap.bind('left', seekLeft);
    Mousetrap.bind('f', vidFullscreen);
    Mousetrap.bind('m', toggleMute);
    Mousetrap.bind('shift+right', speedUp);
    Mousetrap.bind('shift+left', speedDown);
    Mousetrap.bind('r', resetSpeed);
    Mousetrap.bind('p', togglePiP);
    Mousetrap.bind('s', takeScreenshot);
    Mousetrap.bind('t', toggleTheme);
});
