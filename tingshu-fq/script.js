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

// ================= DOM 节点 =================
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

// ================= 搜索功能 =================
async function performSearch() {
    const query = dom.searchInput.value.trim() || '都市';   // 默认关键词
    dom.searchLoader.style.display = 'block';
    dom.resultsGrid.innerHTML = '';
    try {
        const res = await fetch(`https://api.cenguigui.cn/api/tingshu/?name=${encodeURIComponent(query)}&page=1`);
        const data = await res.json();
        if (data.code === 200 && data.data) {
            state.searchResults = data.data;
            renderSearchResults(data.data);
        } else throw new Error('未找到搜索结果');
    } catch (err) {
        dom.resultsGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>搜索失败: ${err.message}</p>
                <button class="search-btn" onclick="performSearch()" style="margin-top:10px;padding:5px 15px">重新加载</button>
            </div>`;
    } finally {
        dom.searchLoader.style.display = 'none';
    }
}

function renderSearchResults(books) {
    dom.resultsGrid.innerHTML = '';
    books.forEach(b => {
        const isFavorited = isBookFavorited(b.book_id);
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <img src="${b.cover}" alt="${b.title}" class="book-cover">
            <div class="book-info">
                <div class="book-title">${b.title}</div>
                <div class="book-author">播音: ${b.author}</div>
                <div class="book-type">分类: ${b.type}</div>
                <div class="book-status">${b.CntPay}</div>
                <div class="book-intro">${b.intro}</div>
                <button class="expand-btn">展开</button>
                <div class="book-buttons">
                    <button class="book-btn favorite-book-btn ${isFavorited ? 'favorited' : ''}" 
                        data-bookid="${b.book_id}" title="${isFavorited ? '已收藏' : '收藏'}">
                        <i class="${isFavorited ? 'fas' : 'far'} fa-star"></i> 收藏
                    </button>
                    <button class="book-btn share-book-btn" data-bookid="${b.book_id}" title="分享">
                        <i class="fas fa-share-alt"></i> 分享
                    </button>
                </div>
            </div>`;
        card.addEventListener('click', e => {
            if (!e.target.closest('.book-btn') && !e.target.closest('.expand-btn')) loadBookDetails(b.book_id);
        });
        card.querySelector('.favorite-book-btn').addEventListener('click', toggleFavorite);
        card.querySelector('.share-book-btn').addEventListener('click', shareBook);
        card.querySelector('.expand-btn').addEventListener('click', toggleExpand);
        dom.resultsGrid.appendChild(card);
    });
}

// ================= 书籍详情 =================
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

// ================= 睡眠定时器 & 收藏（与旧版相同，省略） =================
function setSleepTimer(e) {
    const minutes = parseInt(e.currentTarget.dataset.minutes);
    state.sleepTimerMinutes = minutes;
    if (state.sleepTimer) { clearTimeout(state.sleepTimer); state.sleepTimer = null; }
    document.querySelectorAll('.timer-option').forEach(opt => opt.classList.toggle('timer-active', parseInt(opt.dataset.minutes) === minutes));
    if (minutes > 0) {
        state.sleepTimer = setTimeout(() => {
            pauseAudio();
            showToast(`睡眠定时器已结束播放`);
            state.sleepTimer = null;
            state.sleepTimerMinutes = 0;
        }, minutes * 60 * 1000);
        showToast(`已设置${minutes}分钟后停止播放`);
    } else {
        showToast(`已关闭睡眠定时器`);
    }
    dom.timerMenu.classList.remove('show');
}
function toggleFavorite(e) { /* 与旧版相同 */ }
function isBookFavorited(bookId) {
    const fav = localStorage.getItem('bookFavorites');
    return fav ? JSON.parse(fav).some(f => f.book_id === bookId) : false;
}
function toggleFavoritePanel(e) {
    e.stopPropagation();
    renderFavorites();
    dom.favoritePanel.style.display = dom.favoritePanel.style.display === 'block' ? 'none' : 'block';
}
function renderFavorites() {
    const fav = localStorage.getItem('bookFavorites');
    const favorites = fav ? JSON.parse(fav) : [];
    dom.favoriteList.innerHTML = '';
    if (!favorites.length) {
        dom.favoriteList.innerHTML = '<div class="no-favorites">暂无收藏书籍</div>';
        return;
    }
    favorites.forEach(book => {
        const item = document.createElement('div');
        item.className = 'favorite-item';
        item.innerHTML = `<img src="${book.cover}" alt="${book.title}" class="favorite-cover"><div class="favorite-info"><div class="favorite-title">${book.title}</div><div class="favorite-author">${book.author}</div></div><button class="remove-favorite" data-bookid="${book.book_id}"><i class="fas fa-times"></i></button>`;
        item.addEventListener('click', () => loadBookDetails(book.book_id));
        item.querySelector('.remove-favorite').addEventListener('click', e => {
            e.stopPropagation();
            removeFavorite(book.book_id);
        });
        dom.favoriteList.appendChild(item);
    });
}
function removeFavorite(bookId) {
    const fav = localStorage.getItem('bookFavorites');
    let favorites = fav ? JSON.parse(fav) : [];
    favorites = favorites.filter(f => f.book_id !== bookId);
    localStorage.setItem('bookFavorites', JSON.stringify(favorites));
    renderFavorites();
    document.querySelectorAll(`.favorite-book-btn[data-bookid="${bookId}"]`).forEach(btn => {
        btn.innerHTML = '<i class="far fa-star"></i> 收藏';
        btn.classList.remove('favorited');
    });
}
function shareBook(e) {
    e.stopPropagation();
    const bookId = e.currentTarget.dataset.bookid;
    const book = state.searchResults.find(b => b.book_id === bookId);
    if (book) {
        const shareText = `【Ajeo提示】请前往浏览器粘贴【链接】收听 \n  ${book.title} \n 【链接】：\n ${window.location.href.split('#')[0]}#book_id=${bookId}`;
        navigator.clipboard.writeText(shareText)
            .then(() => showToast('已复制，请到微信粘贴分享'))
            .catch(() => {
                const ta = document.createElement('textarea');
                ta.value = shareText;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                showToast('已复制，请到微信粘贴分享');
            });
    }
}
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

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

// ================= 展开按钮 =================
function toggleExpand(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const intro = btn.previousElementSibling;
    if (intro.classList.contains('expanded')) {
        intro.classList.remove('expanded');
        btn.textContent = '展开';
    } else {
        intro.classList.add('expanded');
        btn.textContent = '收起';
    }
}

// ================= 事件绑定 =================
function setupEventListeners() {
    dom.searchInput.addEventListener('focus', () => dom.hotSearchPanel.style.display = 'block');
    dom.searchInput.addEventListener('blur', () => setTimeout(() => dom.hotSearchPanel.style.display = 'none', 200));
    document.querySelectorAll('.tag').forEach(tag =>
        tag.addEventListener('click', () => {
            dom.searchInput.value = tag.textContent;
            performSearch();
            dom.hotSearchPanel.style.display = 'none';
        })
    );
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
    document.querySelectorAll('.speed-option').forEach(opt =>
        opt.addEventListener('click', () => {
            const speed = parseFloat(opt.dataset.speed);
            state.audio.playbackRate = speed;
            state.playbackRate = speed;
            dom.speedBtn.innerHTML = `<span>${speed}x</span>`;
            dom.speedMenu.classList.remove('show');
            updateMediaSessionPosition();
        })
    );
    document.addEventListener('click', e => {
        if (!dom.speedBtn.contains(e.target) && !dom.speedMenu.contains(e.target)) dom.speedMenu.classList.remove('show');
    });
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
    state.audio.addEventListener('error', () => updateProxyIndicator('error'));
    dom.sleepTimerBtn.addEventListener('click', e => { e.stopPropagation(); dom.timerMenu.classList.toggle('show'); });
    document.querySelectorAll('.timer-option').forEach(opt => opt.addEventListener('click', setSleepTimer));
    dom.favoriteButton.addEventListener('click', toggleFavoritePanel);
    document.addEventListener('click', e => {
        if (!dom.favoriteButton.contains(e.target) && !dom.favoritePanel.contains(e.target)) dom.favoritePanel.style.display = 'none';
        if (!dom.sleepTimerBtn.contains(e.target) && !dom.timerMenu.contains(e.target)) dom.timerMenu.classList.remove('show');
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
    // 保证首屏有默认关键词
    dom.searchInput.value = dom.searchInput.value || '都市';
    performSearch();
    state.audio.volume = 0.7;
    updateVolumeUI();
    updateProxyIndicator('init');
    const hash = window.location.hash;
    if (hash.startsWith('#book_id=')) {
        const bookId = hash.split('=')[1];
        loadBookDetails(bookId);
    }
    state.audio.setAttribute('crossorigin', 'anonymous');
}
window.addEventListener('DOMContentLoaded', initApp);
