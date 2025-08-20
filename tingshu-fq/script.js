// ================= 全局状态 =================
const state = {
    currentPage: 'search',
    currentBook: null,
    currentChapterIndex: 0,
    chapters: [],
    audio: new Audio(),
    isPlaying: false,
    searchResults: [],
    playbackRate: 1,
    proxy: 'https://ajeo.cc/',
    isAudioLoaded: false,
    sleepTimer: null,
    sleepTimerMinutes: 0,
    wakeLock: null
};
let isLoadingAudio = false;

// ================= DOM 节点（省略，与之前相同） =================
const dom = {
    searchPage: document.getElementById('search-page'),
    playerPage: document.getElementById('player-page'),
    searchInput: document.getElementById('search-input'),
    searchButton: document.getElementById('search-button'),
    hotSearchPanel: document.getElementById('hot-search-panel'),
    resultsGrid: document.getElementById('results-grid'),
    searchLoader: document.getElementById('search-loader'),
    backButton: document.getElementById('back-button'),
    playerBookCover: document.getElementById('player-book-cover'),
    playerBookTitle: document.getElementById('player-book-title'),
    playerBookAuthor: document.getElementById('player-book-author'),
    playerBookCategory: document.getElementById('player-book-category'),
    chapterList: document.getElementById('chapter-list'),
    currentTime: document.getElementById('current-time'),
    totalTime: document.getElementById('total-time'),
    progressBar: document.getElementById('progress-bar'),
    progress: document.getElementById('progress'),
    buffer: document.getElementById('buffer'),
    playButton: document.getElementById('play-btn'),
    prevButton: document.getElementById('prev-btn'),
    nextButton: document.getElementById('next-btn'),
    volumeButton: document.getElementById('volume-btn'),
    volumeBar: document.getElementById('volume-bar'),
    volumeLevel: document.getElementById('volume-level'),
    speedBtn: document.getElementById('speed-btn'),
    speedMenu: document.getElementById('speed-menu'),
    proxyIndicator: document.getElementById('proxy-indicator'),
    favoriteButton: document.getElementById('favorite-button'),
    favoritePanel: document.getElementById('favorite-panel'),
    favoriteList: document.getElementById('favorite-list'),
    sleepTimerBtn: document.getElementById('sleep-timer-btn'),
    timerMenu: document.getElementById('timer-menu'),
    chapterCount: document.getElementById('chapter-count')
};

// ================= 工具：屏幕常亮 =================
async function requestWakeLock() {
    if ('wakeLock' in navigator && !state.wakeLock) {
        try { state.wakeLock = await navigator.wakeLock.request('screen'); } catch {}
    }
}
function releaseWakeLock() {
    if (state.wakeLock) { state.wakeLock.release().then(() => state.wakeLock = null); }
}

// ================= 页面导航 =================
function showPage(page) {
    dom.searchPage.style.display = page === 'search' ? 'block' : 'none';
    dom.playerPage.style.display   = page === 'player' ? 'block' : 'none';
    state.currentPage = page;
}

// ================= 搜索 & 渲染（与之前相同，省略） =================
async function performSearch() { /* 与旧版相同 */ }
function renderSearchResults(books) { /* 与旧版相同 */ }

// ================= 书籍详情加载 =================
async function loadBookDetails(bookId) {
    try {
        const res = await fetch(`https://api.cenguigui.cn/api/tingshu/?book_id=${bookId}`);
        const data = await res.json();
        if (data.code === 200 && data.data) {
            state.currentBook = data;
            state.chapters = data.data;
            state.isAudioLoaded = false;
            renderPlayerPage();
            showPage('player');
            requestWakeLock();
            const saved = getSavedProgress(bookId);
            state.currentChapterIndex = saved ? saved.chapterIndex : 0;
            playChapter(state.currentChapterIndex);
        } else throw new Error('加载书籍详情失败');
    } catch (err) { showToast(`加载失败: ${err.message}`); }
}

function renderPlayerPage() {
    if (!state.currentBook) return;
    const { book_name, author, category, book_pic } = state.currentBook;
    dom.playerBookCover.src       = book_pic;
    dom.playerBookTitle.textContent  = book_name;
    dom.playerBookAuthor.textContent = `播音: ${author}`;
    dom.playerBookCategory.textContent = `分类: ${category}`;
    dom.chapterList.innerHTML = '';
    dom.chapterCount.textContent = state.chapters.length;
    state.chapters.forEach((c, i) => {
        const li = document.createElement('li');
        li.className = 'chapter-item' + (i === state.currentChapterIndex ? ' active' : '');
        li.innerHTML = `<span class="chapter-number">${i + 1}</span>${c.title}`;
        li.addEventListener('click', () => playChapter(i));
        dom.chapterList.appendChild(li);
    });
    setTimeout(() => {
        const active = dom.chapterList.querySelector('.chapter-item.active');
        if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
}

// ================= 音频核心 =================
function proxyUrl(url) { return state.proxy + encodeURIComponent(url); }

async function playChapter(index) {
    if (index === state.currentChapterIndex && state.isAudioLoaded) return;
    state.currentChapterIndex = index;
    const chapter = state.chapters[index];
    if (!chapter) return;

    isLoadingAudio = true;
    updateProxyIndicator('init');
    try {
        const res = await fetch(`https://api.cenguigui.cn/api/tingshu/?item_id=${chapter.item_id}`);
        const data = await res.json();
        if (data.code !== 200 || !data.data?.url) throw new Error('无音频地址');

        state.audio.src        = proxyUrl(data.data.url);
        state.audio.playbackRate = state.playbackRate;
        state.isAudioLoaded  = false;
        await state.audio.play();
        state.isPlaying = true;
        dom.playButton.innerHTML = '<i class="fas fa-pause"></i>';
        updateProxyIndicator('success');
        state.isAudioLoaded = true;
    } catch (err) {
        updateProxyIndicator('error');
    } finally {
        isLoadingAudio = false;
    }

    // 更新章节高亮
    dom.chapterList.querySelectorAll('.chapter-item').forEach((li, i) =>
        li.classList.toggle('active', i === index)
    );
    updateMediaSession(true);
}

function playPrevChapter() {
    if (state.currentChapterIndex > 0) playChapter(state.currentChapterIndex - 1);
}
function playNextChapter() {
    if (state.currentChapterIndex < state.chapters.length - 1) {
        playChapter(state.currentChapterIndex + 1);
    } else {
        pauseAudio();
        state.audio.currentTime = 0;
    }
}

function playAudio() {
    state.audio.play().then(() => {
        state.isPlaying = true;
        dom.playButton.innerHTML = '<i class="fas fa-pause"></i>';
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    });
}
function pauseAudio() {
    state.audio.pause();
    state.isPlaying = false;
    dom.playButton.innerHTML = '<i class="fas fa-play"></i>';
    savePlaybackPosition();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
}
function togglePlay() { state.isPlaying ? pauseAudio() : playAudio(); }

// ================= 进度 & UI =================
function formatTime(sec) {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
function updateProgressBar() {
    if (state.audio.duration) {
        dom.progress.style.width = (state.audio.currentTime / state.audio.duration * 100) + '%';
        dom.currentTime.textContent = formatTime(state.audio.currentTime);
        updateMediaSessionPosition();
    }
}
function updateBufferBar() {
    if (!state.audio.buffered.length) { dom.buffer.style.width = '0%'; return; }
    try {
        const end = state.audio.buffered.end(state.audio.buffered.length - 1);
        dom.buffer.style.width = (end / state.audio.duration * 100) + '%';
    } catch {}
}
function updateProxyIndicator(status) {
    dom.proxyIndicator.className = 'proxy-indicator';
    switch (status) {
        case 'success':
            dom.proxyIndicator.className += ' proxy-success';
            dom.proxyIndicator.innerHTML = '<i class="fas fa-check"></i>';
            break;
        case 'retry':
            dom.proxyIndicator.className += ' proxy-warning';
            dom.proxyIndicator.innerHTML = '<i class="fas fa-redo-alt"></i>';
            break;
        case 'error':
            dom.proxyIndicator.className += ' proxy-error';
            dom.proxyIndicator.innerHTML = '<i class="fas fa-times"></i>';
            break;
        default:
            dom.proxyIndicator.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    }
}

// ================= MediaSession =================
function setupMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', playAudio);
        navigator.mediaSession.setActionHandler('pause', pauseAudio);
        navigator.mediaSession.setActionHandler('previoustrack', playPrevChapter);
        navigator.mediaSession.setActionHandler('nexttrack', playNextChapter);
    }
}
function updateMediaSession(isChapterSwitch = false) {
    if (!('mediaSession' in navigator) || !state.currentBook || !state.chapters[state.currentChapterIndex]) return;
    const chapter = state.chapters[state.currentChapterIndex];
    const book = state.currentBook;
    navigator.mediaSession.metadata = new MediaMetadata({
        title: chapter.title,
        artist: book.author,
        album: book.book_name,
        artwork: [{ src: book.book_pic, sizes: '200x200', type: 'image/jpeg' }]
    });
    if (isChapterSwitch && state.audio.duration && !isNaN(state.audio.duration)) updateMediaSessionPosition();
}
function updateMediaSessionPosition() {
    if ('mediaSession' in navigator && state.audio.duration && !isNaN(state.audio.duration)) {
        navigator.mediaSession.setPositionState({
            duration: state.audio.duration,
            playbackRate: state.playbackRate,
            position: state.audio.currentTime
        });
    }
}

// ================= 睡眠定时器 & 收藏（与之前相同，省略） =================
function setSleepTimer(e) { /* 与旧版相同 */ }
function toggleFavorite(e) { /* 与旧版相同 */ }
function renderFavorites() { /* 与旧版相同 */ }
function removeFavorite(bookId) { /* 与旧版相同 */ }
function shareBook(e) { /* 与旧版相同 */ }
function showToast(message) { /* 与旧版相同 */ }

// ================= 进度保存 =================
function savePlaybackPosition() {
    if (!state.currentBook || !state.audio.duration) return;
    const progress = {
        bookId: state.currentBook.book_id,
        chapterIndex: state.currentChapterIndex,
        currentTime: state.audio.currentTime,
        timestamp: Date.now()
    };
    localStorage.setItem(`bookProgress_${state.currentBook.book_id}`, JSON.stringify(progress));
}
function getSavedProgress(bookId) {
    const saved = localStorage.getItem(`bookProgress_${bookId}`);
    return saved ? JSON.parse(saved) : null;
}

// ================= 事件绑定 =================
function setupEventListeners() {
    dom.searchInput.addEventListener('focus', () => dom.hotSearchPanel.style.display = 'block');
    dom.searchInput.addEventListener('blur', () => setTimeout(() => dom.hotSearchPanel.style.display = 'none', 200));
    document.querySelectorAll('.tag').forEach(tag => tag.addEventListener('click', () => {
        dom.searchInput.value = tag.textContent;
        performSearch();
        dom.hotSearchPanel.style.display = 'none';
    }));
    dom.searchButton.addEventListener('click', performSearch);
    dom.searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') performSearch(); });
    dom.backButton.addEventListener('click', () => { showPage('search'); state.audio.pause(); releaseWakeLock(); });
    dom.playButton.addEventListener('click', togglePlay);
    dom.prevButton.addEventListener('click', playPrevChapter);
    dom.nextButton.addEventListener('click', playNextChapter);
    dom.progressBar.addEventListener('click', e => {
        const percent = (e.clientX - dom.progressBar.getBoundingClientRect().left) / dom.progressBar.offsetWidth;
        state.audio.currentTime = percent * state.audio.duration;
    });
    dom.volumeButton.addEventListener('click', () => { state.audio.muted = !state.audio.muted; });
    dom.speedBtn.addEventListener('click', e => { e.stopPropagation(); dom.speedMenu.classList.toggle('show'); });
    document.querySelectorAll('.speed-option').forEach(opt => opt.addEventListener('click', () => {
        const speed = parseFloat(opt.dataset.speed);
        state.audio.playbackRate = speed;
        state.playbackRate = speed;
        dom.speedBtn.innerHTML = `<span>${speed}x</span>`;
        dom.speedMenu.classList.remove('show');
        updateMediaSessionPosition();
    }));
    document.addEventListener('click', e => { if (!dom.speedBtn.contains(e.target) && !dom.speedMenu.contains(e.target)) dom.speedMenu.classList.remove('show'); });
    // 持续更新进度
    state.audio.addEventListener('timeupdate', updateProgressBar);
    state.audio.addEventListener('progress', updateBufferBar);
    // ✅ 关键：自然结束后立即同步播下一章
    state.audio.addEventListener('ended', () => {
        if (state.currentChapterIndex < state.chapters.length - 1) {
            playNextChapter();
        } else {
            pauseAudio();
            state.audio.currentTime = 0;
        }
    });
    state.audio.addEventListener('loadedmetadata', () => {
        dom.totalTime.textContent = formatTime(state.audio.duration);
        updateMediaSessionPosition();
    });
    // 睡眠定时器 & 收藏面板（与旧版相同）
    dom.sleepTimerBtn.addEventListener('click', e => { e.stopPropagation(); dom.timerMenu.classList.toggle('show'); });
    document.querySelectorAll('.timer-option').forEach(opt => opt.addEventListener('click', setSleepTimer));
    dom.favoriteButton.addEventListener('click', toggleFavoritePanel);
    document.addEventListener('click', e => {
        if (!dom.favoriteButton.contains(e.target) && !dom.favoritePanel.contains(e.target))
            dom.favoritePanel.style.display = 'none';
        if (!dom.sleepTimerBtn.contains(e.target) && !dom.timerMenu.contains(e.target))
            dom.timerMenu.classList.remove('show');
    });
    dom.volumeBar.addEventListener('click', e => {
        const rect = dom.volumeBar.getBoundingClientRect();
        state.audio.volume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    });
}

// ================= 初始化 =================
function initApp() {
    setupEventListeners();
    setupMediaSession();
    performSearch();
    state.audio.volume = 0.7;
}
window.addEventListener('DOMContentLoaded', initApp);
