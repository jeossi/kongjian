// ================= MediaSession API =================
function setupMediaSession() {
    if ('mediaSession' in navigator) {
        // 设置媒体会话动作处理程序
        navigator.mediaSession.setActionHandler('play', () => {
            playAudio();
        });
        
        navigator.mediaSession.setActionHandler('pause', () => {
            pauseAudio();
        });
        
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            playPrevChapter();
        });
        
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            playNextChapter();
        });
        
        // 尝试设置seekto操作
        try {
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.fastSeek && 'fastSeek' in state.audio) {
                    state.audio.fastSeek(details.seekTime);
                } else {
                    state.audio.currentTime = details.seekTime;
                }
            });
        } catch (error) {
            console.log('不支持seekto操作');
        }
    }
}

function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;
    
    const chapter = state.chapters[state.currentChapterIndex];
    const book = state.currentBook;
    
    if (!chapter || !book) return;
    
    navigator.mediaSession.metadata = new MediaMetadata({
        title: chapter.title,
        artist: book.author,
        album: book.book_name,
        artwork: [
            { src: book.book_pic, sizes: '150x200', type: 'image/jpeg' },
            { src: book.book_pic, sizes: '300x400', type: 'image/jpeg' }
        ]
    });
    
    navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused";
}