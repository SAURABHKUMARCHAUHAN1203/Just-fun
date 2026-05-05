$(window).on('load', function () {
    const input = $('#m3u8-placeholder');
    input.val(localStorage.getItem('m3u8-link') || '');
    
    $('#form').on('submit', function (e) {
        e.preventDefault();
        const url = input.val().trim();
        if (url) {
            localStorage.setItem('m3u8-link', url);
            // Use player/index.html to ensure it works on file:// protocol
            window.location.href = './player/index.html#' + encodeURIComponent(url);
        }
    });
});