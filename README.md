# m3u8-player

M3U8 Player in browser. Play any live stream m3u8 link with this webapp at https://bharadwajpro.github.io/m3u8-player

I created this website because VLC is unstable in playing live streams. It buffers a lot.

If you want to extract m3u8 files from live streams. You can use `youtube-dl -F <video-url>` to display all formats available
and then type `youtube-dl -f <itag> -g <video-url>` for the direct link. Paste it in the website mentioned above and play it.
If it doesn't work, then raise an issue.

If you want live streams legally then visit this repo - https://github.com/notanewbie/LegalStream

This website is tested on Google Chrome and Firefox desktop web browsers. Not tested on android and iOS. Raise an issue if it doesn't work.

## Features

- **Enhanced UI**: Speed/volume indicators, quality selector, error handling
- **Mobile Support**: Touch controls for seeking and volume
- **Recent URLs**: Dropdown with last 10 used streams
- **Quality Control**: Auto or manual quality selection
- **Picture-in-Picture**: Multitasking support
- **Screenshot**: Capture current frame
- **Theme Toggle**: Dark/light mode
- **Auto-retry**: Reconnects on stream failure
- **Performance**: Optimized buffering and memory management

## Keyboard shortcuts

-   `up` and `down` - Volume
-   `left` and `right` - Seek by 5 secs
-   `shift+left` and `shift+right` - Speed control (0.25x increments, up to 4x)
-   `r` - Reset speed to 1x
-   `f` - Full screen
-   `m` - Mute
-   `p` - Picture-in-Picture
-   `s` - Screenshot
-   `t` - Theme toggle
-   `space` - Play/Pause

## Mobile Controls

-   **Horizontal swipe** - Seek forward/backward
-   **Vertical swipe** - Volume up/down
-   **Tap** - Play/Pause

## Known issues

-   The page is served over `https`. So if the stream url is not `https` but `http`, the browser may throw a warning. The content fails to load. Disable web security in Chrome to get around this.
-   CORS issue - If the media server blocks other IPs saying CORS. You might have to install this chrome extension to get around this - https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf
