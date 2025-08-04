// ================= 全局状态 =================
const state = {
    currentPage: 'search',
    currentBook: null,
    currentChapterIndex: 0,
    chapters: [],
    audio: new Audio(),
    isPlaying: false,
    searchResults: [],
    playbackRate: 1.0,
    retryCount: 0,
    maxRetry: 2,
    retryTimer: null,
    proxy: 'https://jeotv.dpdns.org/',
};

// 防抖锁
let isLoadingAudio = false;
let lastPlayedChapterId = null;

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
    playButton: document.getElementById('play-btn'),
    prevButton: document.getElementById('prev-btn'),
    nextButton: document.getElementById('next-btn'),
    volumeButton: document.getElementById('volume-btn'),
    volumeBar: document.getElementById('volume-bar'),
    volumeLevel: document.getElementById('volume-level'),
    speedBtn: document.getElementById('speed-btn'),
    speedMenu: document.getElementById('speed-menu'),
    proxyIndicator: document.getElementById('proxy-indicator')
};

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
    dom.backButton.addEventListener('click', () => { showPage('search'); pauseAudio(); });
    dom.playButton.addEventListener('click', togglePlay);
    dom.prevButton.addEventListener('click', playPrevChapter);
    dom.nextButton.addEventListener('click', playNextChapter);
    dom.progressBar.addEventListener('click', e => {
        const percent = (e.clientX - dom.progressBar.getBoundingClientRect().left) / dom.progressBar.offsetWidth;
        state.audio.currentTime = percent * state.audio.duration;
    });
    dom.volumeButton.addEventListener('click', toggleMute);
    dom.speedBtn.addEventListener('click', e => { e.stopPropagation(); dom.speedMenu.classList.toggle('show'); });
    document.querySelectorAll('.speed-option').forEach(opt => opt.addEventListener('click', () => {
        const speed = parseFloat(opt.dataset.speed);
        state.audio.playbackRate = speed; state.playbackRate = speed;
        dom.speedBtn.innerHTML = `<span>${speed}x</span>`;
        dom.speedMenu.classList.remove('show');
    }));
    document.addEventListener('click', e => {
        if (!dom.speedBtn.contains(e.target) && !dom.speedMenu.contains(e.target)) dom.speedMenu.classList.remove('show');
    });
    state.audio.addEventListener('timeupdate', updateProgressBar);
    state.audio.addEventListener('ended', playNextChapter);
    state.audio.addEventListener('loadedmetadata', () => dom.totalTime.textContent = formatTime(state.audio.duration));
    state.audio.addEventListener('error', () => {
        // 已播放过，不再重试
        if (state.audio.currentTime > 0) {
            console.warn('播放中出错，停止重试');
            updateProxyIndicator('error');
            return;
        }
        // 否则重试
        if (state.retryCount < state.maxRetry) {
            state.retryCount++;
            updateProxyIndicator('retry');
            state.retryTimer = setTimeout(() => {
                const chapter = state.chapters[state.currentChapterIndex];
                if (chapter) playChapterAudio(chapter);
            }, 10000);
        } else {
            updateProxyIndicator('error');
            console.warn('达到最大重试次数，停止重试');
        }
    });
}
function setVolumeFromEvent(e) {
    const rect = dom.volumeBar.getBoundingClientRect();
    const x = (e.clientX ?? e.touches[0].clientX) - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    state.audio.volume = percent;
    updateVolumeUI();
}

// 鼠标点击
dom.volumeBar.addEventListener('click', setVolumeFromEvent);

// 触屏滑动
dom.volumeBar.addEventListener('touchstart', e => {
    e.preventDefault();
    setVolumeFromEvent(e);
});
dom.volumeBar.addEventListener('touchmove', e => {
    e.preventDefault();
    setVolumeFromEvent(e);
});

// ================= 页面切换 =================
function showPage(page) {
    if (page === 'search') {
        dom.searchPage.style.display = 'block';
        dom.playerPage.style.display = 'none';
        state.currentPage = 'search';
    } else {
        dom.searchPage.style.display = 'none';
        dom.playerPage.style.display = 'block';
        state.currentPage = 'player';
    }
}

// ================= 代理指示器 =================
function updateProxyIndicator(status) {
    dom.proxyIndicator.className = 'proxy-indicator';
    switch (status) {
        case 'success':
            dom.proxyIndicator.classList.add('proxy-success');
            dom.proxyIndicator.innerHTML = '<i class="fas fa-check"></i>';
            break;
        case 'retry':
            dom.proxyIndicator.classList.add('proxy-warning');
            dom.proxyIndicator.innerHTML = '<i class="fas fa-redo-alt"></i>';
            break;
        case 'error':
            dom.proxyIndicator.classList.add('proxy-error');
            dom.proxyIndicator.innerHTML = '<i class="fas fa-times"></i>';
            break;
        default:
            dom.proxyIndicator.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    }
}

// ================= 搜索 =================
async function performSearch() {
    const query = dom.searchInput.value.trim() || '都市';
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
            </div>`;
        card.addEventListener('click', () => loadBookDetails(b.book_id));
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
            state.retryCount = 0;
            renderPlayerPage();
            showPage('player');
            if (state.chapters.length) playChapter(0);
        } else throw new Error('加载书籍详情失败');
    } catch (err) { alert(`加载失败: ${err.message}`); }
}
function renderPlayerPage() {
    if (!state.currentBook) return;
    const { book_name, author, category, book_pic } = state.currentBook;
    dom.playerBookCover.src = book_pic;
    dom.playerBookTitle.textContent = book_name;
    dom.playerBookAuthor.textContent = `播音: ${author}`;
    dom.playerBookCategory.textContent = `分类: ${category}`;
    dom.chapterList.innerHTML = '';
    state.chapters.forEach((c, i) => {
        const li = document.createElement('li');
        li.className = 'chapter-item' + (i === state.currentChapterIndex ? ' active' : '');
        li.innerHTML = `<span class="chapter-number">${i + 1}</span>${c.title}`;
        li.addEventListener('click', () => playChapter(i));
        dom.chapterList.appendChild(li);
    });
}

// ================= 代理 & 播放 =================
function proxyUrl(url) { return state.proxy + encodeURIComponent(url); }
async function playChapterAudio(chapter) {
    if (isLoadingAudio || lastPlayedChapterId === chapter.item_id) return;
    isLoadingAudio = true;
    lastPlayedChapterId = chapter.item_id;
    try {
        const res = await fetch(`https://api.cenguigui.cn/api/tingshu/?item_id=${chapter.item_id}`);
        const data = await res.json();
        if (data.code === 200 && data.data) {
            state.audio.src = proxyUrl(data.data.url);
            state.audio.load();
            state.audio.playbackRate = state.playbackRate;
            playAudio();
            updateProxyIndicator('success');
            state.retryCount = 0;
        } else throw new Error('获取音频URL失败');
    } catch (err) {
        console.error(err);
        if (state.audio.currentTime === 0) tryRetry();
    } finally {
        isLoadingAudio = false;
    }
}
function playChapter(index) {
    pauseAudio();
    state.audio.src = '';
    state.currentChapterIndex = index;
    state.retryCount = 0;
    updateProxyIndicator('retry');
    if (state.chapters[index]) playChapterAudio(state.chapters[index]);
    document.querySelectorAll('.chapter-item').forEach((li, i) => li.classList.toggle('active', i === index));
}
function tryRetry() {
    if (state.retryCount < state.maxRetry) {
        state.retryCount++;
        updateProxyIndicator('retry');
        state.retryTimer = setTimeout(() => playChapterAudio(state.chapters[state.currentChapterIndex]), 10000);
    } else updateProxyIndicator('error');
}

// ================= 音频控制 =================
function playAudio() {
    state.audio.play().catch(() => tryRetry());
    state.isPlaying = true;
    dom.playButton.innerHTML = '<i class="fas fa-pause"></i>';
}
function pauseAudio() {
    state.audio.pause();
    state.isPlaying = false;
    dom.playButton.innerHTML = '<i class="fas fa-play"></i>';
}
function togglePlay() {
    state.isPlaying ? pauseAudio() : playAudio();
}
function playPrevChapter() {
    if (state.currentChapterIndex > 0) playChapter(state.currentChapterIndex - 1);
}
function playNextChapter() {
    if (state.currentChapterIndex < state.chapters.length - 1) playChapter(state.currentChapterIndex + 1);
    else {
        pauseAudio();
        state.audio.currentTime = 0;
        updateProgressBar();
    }
}
function updateProgressBar() {
    if (state.audio.duration) dom.progress.style.width = (state.audio.currentTime / state.audio.duration * 100) + '%';
    dom.currentTime.textContent = formatTime(state.audio.currentTime);
}
function updateVolumeUI() {
    const v = state.audio.volume;
    dom.volumeLevel.style.width = v * 100 + '%';
    dom.volumeButton.innerHTML = `<i class="fas fa-volume-${state.audio.muted || v === 0 ? 'mute' : v < .5 ? 'down' : 'up'}"></i>`;
}
function toggleMute() {
    state.audio.muted = !state.audio.muted;
    updateVolumeUI();
}
function formatTime(sec) {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ================= 初始化 =================
function initApp() {
    setupEventListeners();
    performSearch();
    state.audio.volume = .7;
    updateVolumeUI();
    updateProxyIndicator('init');
}
window.addEventListener('DOMContentLoaded', initApp);