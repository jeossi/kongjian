// ================= 全局状态 =================
const state = {
    currentPage: 'search',
    currentBook: null,
    currentChapterIndex: 0,
    chapters: [],
    audio: new Audio(), // 单例Audio对象
    isPlaying: false,
    searchResults: [],
    playbackRate: 1.0,
    retryCount: 0,
    maxRetry: 3,
    retryTimer: null,
    proxy: 'https://ajeo.cc/',
    isAudioLoaded: false,
    sleepTimer: null,
    sleepTimerMinutes: 0,
    backgroundPlayback: false,
    nextChapterUrl: null, // 预加载下一章URL
    volume: 0.7,
    lastUpdateTime: 0 // 节流控制
};

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

// ================= 初始化音频 =================
function initAudio() {
    state.audio.volume = state.volume;
    state.audio.preload = 'auto';
    state.audio.crossOrigin = 'anonymous';

    // 事件监听
    state.audio.addEventListener('timeupdate', throttle(updateProgressBar, 200));
    state.audio.addEventListener('progress', throttle(updateBufferBar, 500));
    state.audio.addEventListener('loadedmetadata', handleMetadataLoaded);
    state.audio.addEventListener('ended', handleAudioEnded);
    state.audio.addEventListener('error', handleAudioError);
    state.audio.addEventListener('playing', handleAudioPlaying);
    state.audio.addEventListener('pause', handleAudioPause);
}

// ================= 音频控制 =================
function playChapter(index) {
    if (index < 0 || index >= state.chapters.length) return;

    state.currentChapterIndex = index;
    updateChapterUI(index);

    const chapter = state.chapters[index];
    const audioUrl = index === state.currentChapterIndex + 1 && state.nextChapterUrl 
        ? state.nextChapterUrl 
        : getChapterProxyUrl(chapter.item_id);

    loadAudio(audioUrl).then(() => {
        if (state.isPlaying) {
            state.audio.play().catch(e => {
                console.error('播放失败:', e);
                tryRetry();
            });
        }
        updateMediaSession();
    }).catch(handleLoadError);

    // 预加载下一章
    if (index < state.chapters.length - 1) {
        preloadChapter(index + 1);
    }
}

function loadAudio(url) {
    cleanupAudioResources();
    return new Promise((resolve) => {
        state.audio.src = url;
        state.audio.load();
        const onCanPlay = () => {
            state.audio.removeEventListener('canplay', onCanPlay);
            resolve();
        };
        state.audio.addEventListener('canplay', onCanPlay, { once: true });
    });
}

function preloadChapter(index) {
    getChapterProxyUrl(state.chapters[index].item_id).then(url => {
        state.nextChapterUrl = url;
    });
}

function getChapterProxyUrl(itemId) {
    return fetch(`https://api.cenguigui.cn/api/tingshu/?item_id=${itemId}`)
        .then(res => res.json())
        .then(data => {
            if (data.code === 200 && data.data?.url) {
                return state.proxy + encodeURIComponent(data.data.url);
            }
            throw new Error('获取音频URL失败');
        });
}

// ================= 播放控制 =================
function togglePlay() {
    if (state.isPlaying) {
        pauseAudio();
    } else {
        playAudio();
    }
}

function playAudio() {
    if (!state.isAudioLoaded && state.chapters.length > 0) {
        playChapter(state.currentChapterIndex);
        return;
    }

    state.audio.play()
        .then(() => {
            state.isPlaying = true;
            dom.playButton.innerHTML = '<i class="fas fa-pause"></i>';
            updateMediaSession();
        })
        .catch(e => {
            console.error('播放失败:', e);
            tryRetry();
        });
}

function pauseAudio() {
    state.audio.pause();
    state.isPlaying = false;
    dom.playButton.innerHTML = '<i class="fas fa-play"></i>';
    savePlaybackPosition();
    updateMediaSession();
}

function playPrevChapter() {
    if (state.currentChapterIndex > 0) {
        playChapter(state.currentChapterIndex - 1);
    }
}

function playNextChapter() {
    if (state.currentChapterIndex < state.chapters.length - 1) {
        playChapter(state.currentChapterIndex + 1);
    } else {
        pauseAudio();
        state.audio.currentTime = 0;
        updateProgressBar();
    }
}

// ================= 媒体会话 =================
function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', playAudio);
    navigator.mediaSession.setActionHandler('pause', pauseAudio);
    navigator.mediaSession.setActionHandler('previoustrack', playPrevChapter);
    navigator.mediaSession.setActionHandler('nexttrack', playNextChapter);
}

function updateMediaSession() {
    if (!('mediaSession' in navigator) || !state.currentBook) return;

    const chapter = state.chapters[state.currentChapterIndex];
    navigator.mediaSession.metadata = new MediaMetadata({
        title: chapter?.title || '未知章节',
        artist: state.currentBook.author,
        album: state.currentBook.book_name,
        artwork: [
            { src: state.currentBook.book_pic, sizes: '150x200', type: 'image/jpeg' }
        ]
    });
    navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused";
}

// ================= UI更新 =================
function updateProgressBar() {
    if (state.audio.duration) {
        const percent = (state.audio.currentTime / state.audio.duration) * 100;
        dom.progress.style.width = percent + '%';
        dom.currentTime.textContent = formatTime(state.audio.currentTime);
    }
}

function updateBufferBar() {
    if (!state.audio.buffered || state.audio.buffered.length === 0) return;
    try {
        const bufferedEnd = state.audio.buffered.end(state.audio.buffered.length - 1);
        const percent = (bufferedEnd / state.audio.duration) * 100;
        dom.buffer.style.width = percent + '%';
    } catch (e) {
        console.warn('缓冲更新失败:', e);
    }
}

function updateChapterUI(index) {
    document.querySelectorAll('.chapter-item').forEach((li, i) => {
        li.classList.toggle('active', i === index);
    });
    const activeChapter = dom.chapterList.querySelector('.chapter-item.active');
    if (activeChapter) {
        setTimeout(() => activeChapter.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
}

// ================= 资源管理 =================
function cleanupAudioResources() {
    if (state.audio.src && state.audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(state.audio.src);
    }
    state.isAudioLoaded = false;
}

function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

// ================= 事件处理 =================
function handleAudioEnded() {
    playNextChapter();
}

function handleAudioError() {
    if (!state.isAudioLoaded && state.retryCount < state.maxRetry) {
        state.retryCount++;
        state.retryTimer = setTimeout(() => {
            playChapter(state.currentChapterIndex);
        }, 3000);
    }
}

function handleLoadError(error) {
    console.error('加载失败:', error);
    if (document.visibilityState === 'hidden') {
        state.backgroundPlayback = true;
        showToast("返回前台后自动继续");
    } else {
        tryRetry();
    }
}

function handleAudioPlaying() {
    state.isAudioLoaded = true;
    state.isPlaying = true;
    dom.playButton.innerHTML = '<i class="fas fa-pause"></i>';
    updateMediaSession();
}

function handleAudioPause() {
    state.isPlaying = false;
    dom.playButton.innerHTML = '<i class="fas fa-play"></i>';
    updateMediaSession();
}

function handleMetadataLoaded() {
    dom.totalTime.textContent = formatTime(state.audio.duration);
    updateBufferBar();
    restorePlaybackPosition();
}

// ================= 工具函数 =================
function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function proxyUrl(url) {
    return state.proxy + encodeURIComponent(url);
}

function tryRetry() {
    if (state.retryCount < state.maxRetry) {
        state.retryCount++;
        showToast(`正在重试 (${state.retryCount}/${state.maxRetry})`);
        state.retryTimer = setTimeout(() => {
            playChapter(state.currentChapterIndex);
        }, 3000);
    } else {
        showToast('播放失败，请稍后再试');
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

// ================= 页面导航 =================
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

// ================= 搜索功能 =================
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
        const isFavorited = isBookFavorited(b.book_id);
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
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.book-btn') && !e.target.closest('.expand-btn')) {
                loadBookDetails(b.book_id);
            }
        });
        card.querySelector('.favorite-book-btn').addEventListener('click', toggleFavorite);
        card.querySelector('.share-book-btn').addEventListener('click', shareBook);
        card.querySelector('.expand-btn').addEventListener('click', toggleExpand);
        dom.resultsGrid.appendChild(card);
    });
}

// ================= 书籍功能 =================
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
            const savedProgress = getSavedProgress(bookId);
            state.currentChapterIndex = savedProgress ? savedProgress.chapterIndex : 0;
            playChapter(state.currentChapterIndex);
        } else throw new Error('加载书籍详情失败');
    } catch (err) { 
        showToast(`加载失败: ${err.message}`);
        console.error(err); 
    }
}

function renderPlayerPage() {
    if (!state.currentBook) return;
    const { book_name, author, category, book_pic } = state.currentBook;
    dom.playerBookCover.src = book_pic;
    dom.playerBookTitle.textContent = book_name;
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
        const activeChapter = dom.chapterList.querySelector('.chapter-item.active');
        if (activeChapter) {
            activeChapter.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 300);
}

// ================= 收藏功能 =================
function toggleFavorite(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const bookId = btn.dataset.bookid;
    const storedFavorites = localStorage.getItem('bookFavorites');
    let favorites = storedFavorites ? JSON.parse(storedFavorites) : [];
    const bookIndex = favorites.findIndex(f => f.book_id === bookId);
    
    if (bookIndex !== -1) {
        favorites.splice(bookIndex, 1);
        btn.innerHTML = '<i class="far fa-star"></i> 收藏';
        btn.classList.remove('favorited');
    } else {
        const book = state.searchResults.find(b => b.book_id === bookId);
        if (book) {
            favorites.push({
                book_id: book.book_id,
                title: book.title,
                cover: book.cover,
                author: book.author
            });
            btn.innerHTML = '<i class="fas fa-star"></i> 收藏';
            btn.classList.add('favorited');
        }
    }
    localStorage.setItem('bookFavorites', JSON.stringify(favorites));
    renderFavorites();
}

function isBookFavorited(bookId) {
    const storedFavorites = localStorage.getItem('bookFavorites');
    if (!storedFavorites) return false;
    return JSON.parse(storedFavorites).some(f => f.book_id === bookId);
}

function toggleFavoritePanel(e) {
    e.stopPropagation();
    renderFavorites();
    dom.favoritePanel.style.display = dom.favoritePanel.style.display === 'block' ? 'none' : 'block';
}

function renderFavorites() {
    const storedFavorites = localStorage.getItem('bookFavorites');
    const favorites = storedFavorites ? JSON.parse(storedFavorites) : [];
    dom.favoriteList.innerHTML = '';
    if (favorites.length === 0) {
        dom.favoriteList.innerHTML = '<div class="no-favorites">暂无收藏书籍</div>';
        return;
    }
    favorites.forEach(book => {
        const item = document.createElement('div');
        item.className = 'favorite-item';
        item.innerHTML = `
            <img src="${book.cover}" alt="${book.title}" class="favorite-cover">
            <div class="favorite-info">
                <div class="favorite-title">${book.title}</div>
                <div class="favorite-author">${book.author}</div>
            </div>
            <button class="remove-favorite" data-bookid="${book.book_id}">
                <i class="fas fa-times"></i>
            </button>`;
        item.addEventListener('click', () => loadBookDetails(book.book_id));
        item.querySelector('.remove-favorite').addEventListener('click', (e) => {
            e.stopPropagation();
            removeFavorite(book.book_id);
        });
        dom.favoriteList.appendChild(item);
    });
}

function removeFavorite(bookId) {
    const storedFavorites = localStorage.getItem('bookFavorites');
    let favorites = storedFavorites ? JSON.parse(storedFavorites) : [];
    favorites = favorites.filter(f => f.book_id !== bookId);
    localStorage.setItem('bookFavorites', JSON.stringify(favorites));
    renderFavorites();
    document.querySelectorAll(`.favorite-book-btn[data-bookid="${bookId}"]`).forEach(btn => {
        btn.innerHTML = '<i class="far fa-star"></i> 收藏';
        btn.classList.remove('favorited');
    });
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

function restorePlaybackPosition() {
    if (!state.currentBook) return;
    const saved = localStorage.getItem(`bookProgress_${state.currentBook.book_id}`);
    if (!saved) return;
    const progress = JSON.parse(saved);
    if (progress && progress.chapterIndex === state.currentChapterIndex) {
        state.audio.currentTime = progress.currentTime;
        updateProgressBar();
    }
}

function getSavedProgress(bookId) {
    const saved = localStorage.getItem(`bookProgress_${bookId}`);
    return saved ? JSON.parse(saved) : null;
}

// ================= 睡眠定时器 =================
function setSleepTimer(e) {
    const minutes = parseInt(e.currentTarget.dataset.minutes);
    state.sleepTimerMinutes = minutes;
    
    if (state.sleepTimer) {
        clearTimeout(state.sleepTimer);
        state.sleepTimer = null;
    }
    
    document.querySelectorAll('.timer-option').forEach(opt => {
        opt.classList.toggle('timer-active', parseInt(opt.dataset.minutes) === minutes);
    });
    
    if (minutes > 0) {
        state.sleepTimer = setTimeout(() => {
            pauseAudio();
            showToast(`睡眠定时器已结束播放`);
            state.sleepTimer = null;
            state.sleepTimerMinutes = 0;
            document.querySelectorAll('.timer-option').forEach(opt => {
                opt.classList.remove('timer-active');
            });
        }, minutes * 60 * 1000);
        showToast(`已设置${minutes}分钟后停止播放`);
    } else {
        showToast(`已关闭睡眠定时器`);
    }
    dom.timerMenu.classList.remove('show');
}

// ================= 事件绑定 =================
function setupEventListeners() {
    // 搜索相关
    dom.searchInput.addEventListener('focus', () => dom.hotSearchPanel.style.display = 'block');
    dom.searchInput.addEventListener('blur', () => setTimeout(() => dom.hotSearchPanel.style.display = 'none', 200));
    document.querySelectorAll('.tag').forEach(tag => tag.addEventListener('click', () => {
        dom.searchInput.value = tag.textContent;
        performSearch();
        dom.hotSearchPanel.style.display = 'none';
    }));
    dom.searchButton.addEventListener('click', performSearch);
    dom.searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') performSearch(); });
    
    // 播放控制
    dom.backButton.addEventListener('click', () => { showPage('search'); cleanupAudioResources(); });
    dom.playButton.addEventListener('click', togglePlay);
    dom.prevButton.addEventListener('click', playPrevChapter);
    dom.nextButton.addEventListener('click', playNextChapter);
    dom.progressBar.addEventListener('click', e => {
        const percent = (e.clientX - dom.progressBar.getBoundingClientRect().left) / dom.progressBar.offsetWidth;
        state.audio.currentTime = percent * state.audio.duration;
    });
    
    // 音量控制
    dom.volumeButton.addEventListener('click', toggleMute);
    function toggleMute() {
        state.audio.muted = !state.audio.muted;
        updateVolumeUI();
    }
    function updateVolumeUI() {
        const v = state.audio.volume;
        dom.volumeLevel.style.width = v * 100 + '%';
        dom.volumeButton.innerHTML = `<i class="fas fa-volume-${state.audio.muted || v === 0 ? 'mute' : v < .5 ? 'down' : 'up'}"></i>`;
    }
    function setVolumeFromEvent(e) {
        const rect = dom.volumeBar.getBoundingClientRect();
        const x = (e.clientX ?? e.touches[0].clientX) - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        state.audio.volume = percent;
        state.volume = percent;
        updateVolumeUI();
    }
    dom.volumeBar.addEventListener('click', setVolumeFromEvent);
    dom.volumeBar.addEventListener('touchstart', e => {
        e.preventDefault();
        setVolumeFromEvent(e);
    });
    dom.volumeBar.addEventListener('touchmove', e => {
        e.preventDefault();
        setVolumeFromEvent(e);
    });
    
    // 倍速控制
    dom.speedBtn.addEventListener('click', e => {
        e.stopPropagation();
        dom.speedMenu.classList.toggle('show');
    });
    document.querySelectorAll('.speed-option').forEach(opt => opt.addEventListener('click', () => {
        const speed = parseFloat(opt.dataset.speed);
        state.audio.playbackRate = speed;
        state.playbackRate = speed;
        dom.speedBtn.innerHTML = `<span>${speed}x</span>`;
        dom.speedMenu.classList.remove('show');
    }));
    document.addEventListener('click', e => {
        if (!dom.speedBtn.contains(e.target) && !dom.speedMenu.contains(e.target)) {
            dom.speedMenu.classList.remove('show');
        }
    });
    
    // 收藏面板
    dom.favoriteButton.addEventListener('click', toggleFavoritePanel);
    document.addEventListener('click', e => {
        if (!dom.favoriteButton.contains(e.target) && !dom.favoritePanel.contains(e.target)) {
            dom.favoritePanel.style.display = 'none';
        }
    });
    
    // 睡眠定时器
    dom.sleepTimerBtn.addEventListener('click', e => {
        e.stopPropagation();
        dom.timerMenu.classList.toggle('show');
    });
    document.querySelectorAll('.timer-option').forEach(opt => opt.addEventListener('click', setSleepTimer));
    document.addEventListener('click', e => {
        if (!dom.sleepTimerBtn.contains(e.target) && !dom.timerMenu.contains(e.target)) {
            dom.timerMenu.classList.remove('show');
        }
    });
    
    // 展开按钮
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
    
    // 分享功能
    function shareBook(e) {
        e.stopPropagation();
        const bookId = e.currentTarget.dataset.bookid;
        const book = state.searchResults.find(b => b.book_id === bookId);
        if (book) {
            const shareText = `【Ajeo提示】请前往浏览器粘贴【链接】收听 \n  ${book.title} \n 【链接】：\n ${window.location.href.split('#')[0]}#book_id=${bookId}`;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(shareText).then(() => {
                    showToast('已复制，请到微信粘贴分享');
                }).catch(() => {
                    promptManualCopy(shareText);
                });
            } else {
                promptManualCopy(shareText);
            }
        }
    }
    
    function promptManualCopy(text) {
        const container = document.createElement('div');
        container.className = 'manual-copy-container';
        container.innerHTML = `
            <div class="manual-copy-box">
                <h3>请手动复制以下链接</h3>
                <textarea readonly class="copy-textarea">${text}</textarea>
                <button class="search-btn close-copy-btn">关闭</button>
            </div>`;
        document.body.appendChild(container);
        const textarea = container.querySelector('.copy-textarea');
        textarea.select();
        container.querySelector('.close-copy-btn').addEventListener('click', () => {
            document.body.removeChild(container);
        });
    }
}

// ================= 初始化 =================
function initApp() {
    initAudio();
    setupMediaSession();
    setupEventListeners();
    performSearch();
    
    // 处理深链接
    const hash = window.location.hash;
    if (hash.startsWith('#book_id=')) {
        loadBookDetails(hash.split('=')[1]);
    }
}

window.addEventListener('DOMContentLoaded', initApp);