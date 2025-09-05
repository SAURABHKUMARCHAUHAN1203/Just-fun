var video = document.getElementById('video');
var overlayTimer;
var isFullscreen = false;

function showOverlay(id, text) {
    $(id).text(text).show();
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => $(id).hide(), 1500);
}

function showSpeed() {
    showOverlay('#speed-overlay', video.playbackRate + 'x');
}

function playM3u8(url) {
    if (Hls.isSupported()) {
        video.volume = 0.3;
        var hls = new Hls();
        var m3u8Url = decodeURIComponent(url);
        hls.loadSource(m3u8Url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play();
        });
        document.title = url;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('canplay', function () {
            video.play();
        });
        video.volume = 0.3;
        document.title = url;
    }
}

function playPause() {
    if (video.paused) {
        video.play();
        showOverlay('#play-overlay', '▶');
    } else {
        video.pause();
        showOverlay('#play-overlay', '⏸');
    }
}

function volumeUp() {
    if (video.volume <= 0.9) {
        video.volume += 0.1;
        showOverlay('#volume-overlay', Math.round(video.volume * 100) + '%');
    }
}

function volumeDown() {
    if (video.volume >= 0.1) {
        video.volume -= 0.1;
        showOverlay('#volume-overlay', Math.round(video.volume * 100) + '%');
    }
}

function seekRight() {
    video.currentTime += 5;
    showOverlay('#seek-overlay', '+5s');
}

function seekLeft() {
    video.currentTime -= 5;
    showOverlay('#seek-overlay', '-5s');
}

function toggleMute() {
    video.muted = !video.muted;
    showOverlay('#volume-overlay', video.muted ? 'MUTED' : Math.round(video.volume * 100) + '%');
}

function toggleControls() {
    video.controls = !video.controls;
    showOverlay('#play-overlay', video.controls ? 'CONTROLS ON' : 'CONTROLS OFF');
}

function speedUp() {
    if (video.playbackRate < 8) {
        video.playbackRate += 0.5;
        showSpeed();
    }
}

function speedDown() {
    if (video.playbackRate > 0.25) {
        video.playbackRate -= 0.5;
        showSpeed();
    }
}

function resetSpeed() {
    video.playbackRate = 1;
    showSpeed();
}

function vidFullscreen() {
    if (!isFullscreen) {
        if (video.requestFullscreen) {
            video.requestFullscreen();
        } else if (video.mozRequestFullScreen) {
            video.mozRequestFullScreen();
        } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

function handleFullscreenChange() {
    isFullscreen = !!(document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement);
    
    if (isFullscreen) {
        video.controls = false;
        document.body.style.cursor = 'none';
        setTimeout(() => {
            document.body.style.cursor = 'none';
        }, 3000);
    } else {
        video.controls = true;
        document.body.style.cursor = 'default';
    }
}

playM3u8(window.location.href.split('#')[1]);

// Fullscreen event listeners
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

// Mouse movement in fullscreen
document.addEventListener('mousemove', function() {
    if (isFullscreen) {
        document.body.style.cursor = 'default';
        clearTimeout(window.cursorTimer);
        window.cursorTimer = setTimeout(() => {
            if (isFullscreen) document.body.style.cursor = 'none';
        }, 3000);
    }
});

$(window).on('load', function () {
    $('#video').on('click', function () {
        this.paused ? this.play() : this.pause();
    });
    Mousetrap.bind('p', playPause);
    Mousetrap.bind('space', playPause);
    Mousetrap.bind('up', function(e) {
        e.preventDefault();
        volumeUp();
    });
    Mousetrap.bind('down', function(e) {
        e.preventDefault();
        volumeDown();
    });
    Mousetrap.bind('right', function(e) {
        e.preventDefault();
        seekRight();
    });
    Mousetrap.bind('left', function(e) {
        e.preventDefault();
        seekLeft();
    });
    Mousetrap.bind('f', vidFullscreen);
    Mousetrap.bind('m', toggleMute);
    Mousetrap.bind('shift+right', speedUp);
    Mousetrap.bind('shift+left', speedDown);
    Mousetrap.bind('r', resetSpeed);
    Mousetrap.bind('c', toggleControls);
});