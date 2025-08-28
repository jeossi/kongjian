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
    maxRetry: 1,
    retryTimer: null,
    proxy: 'https://ajeo.cc/',
    isAudioLoaded: false,
    sleepTimer: null,
    sleepTimerMinutes: 0,
    backgroundPlayback: false,
    isMediaSessionReady: false,
    // 新增状态管理
    wakeLock: null,
    lastUpdateTime: 0,
    progressUpdateTimer: null,
    isScreenLocked: false,
    autoPlayNextEnabled: true
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

// ================= 页面导航 =================
function showPage(page) {
    if (page === 'search') {
        dom.searchPage.style.display = 'block';
        dom.playerPage.style.display = 'none';
        state.currentPage = 'search';
        // 释放唤醒锁
        releaseWakeLock();
    } else {
        dom.searchPage.style.display = 'none';
        dom.playerPage.style.display = 'block';
        state.currentPage = 'player';
        // 请求唤醒锁以保持播放
        requestWakeLock();
    }
}

// ================= 屏幕唤醒锁管理 =================
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            state.wakeLock = await navigator.wakeLock.request('screen');
            console.log('已获取屏幕唤醒锁');
            
            state.wakeLock.addEventListener('release', () => {
                console.log('屏幕唤醒锁已释放');
            });
        }
    } catch (err) {
        console.log('无法获取屏幕唤醒锁:', err);
    }
}

async function releaseWakeLock() {
    if (state.wakeLock) {
        try {
            await state.wakeLock.release();
            state.wakeLock = null;
            console.log('主动释放屏幕唤醒锁');
        } catch (err) {
            console.log('释放唤醒锁失败:', err);
        }
    }
}

// ================= 进度同步管理 =================
function startProgressSync() {
    // 清除之前的定时器
    if (state.progressUpdateTimer) {
        clearInterval(state.progressUpdateTimer);
    }
    
    // 创建高频率的进度更新定时器
    state.progressUpdateTimer = setInterval(() => {
        if (state.isPlaying && state.audio && !isNaN(state.audio.currentTime)) {
            const now = Date.now();
            state.lastUpdateTime = now;
            
            // 强制更新进度显示
            updateProgressBar();
            updateBufferBar();
        }
    }, 500); // 每500ms更新一次，确保同步
}

function stopProgressSync() {
    if (state.progressUpdateTimer) {
        clearInterval(state.progressUpdateTimer);
        state.progressUpdateTimer = null;
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
                    <button class="book-btn play-book-btn" data-bookid="${b.book_id}" title="播放">
                        <i class="fas fa-play"></i> 播放
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
        card.querySelector('.play-book-btn').addEventListener('click', playBook);
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
            state.isAudioLoaded = false;
            renderPlayerPage();
            showPage('player');
            if (state.chapters.length) {
                const savedChapterIndex = getSavedChapterIndex(bookId);
                if (savedChapterIndex !== null) {
                    state.currentChapterIndex = savedChapterIndex;
                    playChapter(state.currentChapterIndex);
                } else {
                    state.currentChapterIndex = 0;
                    playChapter(0);
                }
            }
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

// ================= 音频播放器 =================
function cleanupAudio() {
    state.audio.pause();
    state.isPlaying = false;
    state.isAudioLoaded = false;
    stopProgressSync(); // 停止进度同步
    if (state.audio.src && state.audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(state.audio.src);
    }
    state.audio.removeAttribute('src');
    state.audio.load();
    clearTimeout(state.retryTimer);
    state.retryCount = 0;
    console.log('Audio resources cleaned up');
}

function proxyUrl(url) { return state.proxy + encodeURIComponent(url); }

function updateMediaSessionMetadata(stage = 'init', coverUrl = null) {
    if (!('mediaSession' in navigator) || !state.currentBook || !state.chapters[state.currentChapterIndex]) return;
    
    const chapter = state.chapters[state.currentChapterIndex];
    const book = state.currentBook;

    navigator.mediaSession.metadata = new MediaMetadata({
        title: chapter.title,
        artist: book.author,
        album: book.book_name,
        artwork: coverUrl ? [{ src: coverUrl, sizes: '150x200', type: 'image/jpeg' }] : []
    });
}

// ================= MediaSession API =================
function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    
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
    
    // 位置跳转处理
    navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime && state.audio.duration) {
            state.audio.currentTime = details.seekTime;
            updateProgressBar();
        }
    });
    
    // 快进快退处理
    navigator.mediaSession.setActionHandler('seekforward', () => {
        if (state.audio.currentTime) {
            state.audio.currentTime = Math.min(state.audio.currentTime + 30, state.audio.duration);
        }
    });
    
    navigator.mediaSession.setActionHandler('seekbackward', () => {
        if (state.audio.currentTime) {
            state.audio.currentTime = Math.max(state.audio.currentTime - 30, 0);
        }
    });
    
    state.isMediaSessionReady = true;
}

// 重置MediaSession状态
function resetMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setPositionState({
            duration: 0,
            playbackRate: 1,
            position: 0
        });
        navigator.mediaSession.playbackState = "none";
    }
}

async function playChapter(index) {
    if (index === state.currentChapterIndex && state.isAudioLoaded) return;

    // 立即更新MediaSession元数据
    updateMediaSessionMetadata('init', state.currentBook?.book_pic || null);
    
    state.currentChapterIndex = index;
    document.querySelectorAll('.chapter-item').forEach((li, i) =>
        li.classList.toggle('active', i === index)
    );

    const chapter = state.chapters[index];
    if (!chapter) return;

    try {
        const res = await fetch(`https://api.cenguigui.cn/api/tingshu/?item_id=${chapter.item_id}`);
        const data = await res.json();
        if (data.code === 200 && data.data?.url) {
            const audioUrl = proxyUrl(data.data.url);

            state.audio.src = audioUrl;
            state.audio.load();
            state.audio.playbackRate = state.playbackRate;
            state.isAudioLoaded = false;
            updateProxyIndicator('init');

            state.audio.oncanplay = async () => {
                try {
                    await state.audio.play();
                    state.isPlaying = true;
                    dom.playButton.innerHTML = '<i class="fas fa-pause"></i>';
                    state.isAudioLoaded = true;
                    
                    // 开始进度同步
                    startProgressSync();

                    // 延迟更新 MediaSession
                    updateMediaSessionMetadata('cover', state.currentBook.book_pic);
                    if ('mediaSession' in navigator) {
                        navigator.mediaSession.playbackState = "playing";
                    }
                    updateProxyIndicator('success');
                    
                    // 保存当前章节索引
                    saveCurrentChapterIndex();
                } catch (playErr) {
                    console.error('播放失败:', playErr);
                    updateProxyIndicator('error');
                }
            };

            state.audio.onerror = () => {
                updateProxyIndicator('error');
                tryRetry();
            };

            if (state.audio.readyState >= 2) {
                updateProxyIndicator('success');
            }
        }
    } catch (err) {
        console.error(err);
        updateProxyIndicator('error');
    }
}

function tryRetry() {
    if (state.retryCount < state.maxRetry) {
        state.retryCount++;
        updateProxyIndicator('retry');
        state.retryTimer = setTimeout(() => {
            const chapter = state.chapters[state.currentChapterIndex];
            if (chapter) playChapter(state.currentChapterIndex);
        }, 3000);
    } else updateProxyIndicator('error');
}

function playAudio() {
    state.audio.play().then(() => {
        state.isPlaying = true;
        dom.playButton.innerHTML = '<i class="fas fa-pause"></i>';
        startProgressSync(); // 开始进度同步
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = "playing";
        }
    }).catch((err) => {
        console.error('播放失败:', err);
        tryRetry();
    });
}

function pauseAudio() {
    state.audio.pause();
    state.isPlaying = false;
    dom.playButton.innerHTML = '<i class="fas fa-play"></i>';
    stopProgressSync(); // 停止进度同步
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = "paused";
    }
}

function togglePlay() {
    state.isPlaying ? pauseAudio() : playAudio();
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
        updateProgressBar();
    }
}

// 增强的自动播放下一章功能
function autoPlayNextChapter() {
    console.log('准备自动播放下一章, 当前状态:', {
        autoPlayEnabled: state.autoPlayNextEnabled,
        isPlaying: state.isPlaying,
        currentIndex: state.currentChapterIndex,
        totalChapters: state.chapters.length
    });
    
    if (!state.autoPlayNextEnabled) {
        console.log('自动播放已禁用');
        return;
    }
    
    if (state.currentChapterIndex < state.chapters.length - 1) {
        console.log('开始播放下一章...');
        playChapter(state.currentChapterIndex + 1);
    } else {
        console.log('已到最后一章，停止播放');
        pauseAudio();
        state.audio.currentTime = 0;
        updateProgressBar();
    }
}

function updateProgressBar() {
    if (state.audio.duration) {
        const progressPercent = (state.audio.currentTime / state.audio.duration * 100);
        dom.progress.style.width = progressPercent + '%';
    }
    dom.currentTime.textContent = formatTime(state.audio.currentTime);
    
    // 更新 MediaSession 位置状态
    if ('mediaSession' in navigator && !isNaN(state.audio.duration)) {
        try {
            navigator.mediaSession.setPositionState({
                duration: state.audio.duration,
                playbackRate: state.audio.playbackRate,
                position: state.audio.currentTime
            });
        } catch (e) {
            // 忽略MediaSession更新错误，避免影响正常播放
        }
    }
}

function updateBufferBar() {
    if (!state.audio || !state.audio.buffered || state.audio.buffered.length === 0) {
        dom.buffer.style.width = '0%';
        return;
    }
    try {
        const bufferedEnd = state.audio.buffered.end(state.audio.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / state.audio.duration) * 100;
        dom.buffer.style.width = `${bufferedPercent}%`;
    } catch (e) {
        console.warn('更新缓冲条时出错:', e);
    }
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
            document.querySelectorAll('.timer-option').forEach(opt => opt.classList.remove('timer-active'));
        }, minutes * 60 * 1000);
        showToast(`已设置${minutes}分钟后停止播放`);
    } else {
        showToast(`已关闭睡眠定时器`);
    }
    dom.timerMenu.classList.remove('show');
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

function shareBook(e) {
    e.stopPropagation();
    const bookId = e.currentTarget.dataset.bookid;
    const book = state.searchResults.find(b => b.book_id === bookId);
    if (book) {
        const shareText = `【Ajeo提示】请前往浏览器粘贴【链接】收听 \n  ${book.title} \n 【链接】：\n ${window.location.href.split('#')[0]}#book_id=${bookId}`;
        const copyToClipboardFallback = (text) => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                const successful = document.execCommand('copy');
                if (!successful) throw new Error('复制失败');
            } catch (err) {
                console.error('使用execCommand复制失败:', err);
                throw err;
            } finally {
                document.body.removeChild(textarea);
            }
        };
        try {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(shareText).then(() => {
                    showToast('已复制，请到微信粘贴分享');
                }).catch(() => {
                    copyToClipboardFallback(shareText);
                    showToast('已复制，请到微信粘贴分享');
                });
            } else {
                copyToClipboardFallback(shareText);
                showToast('已复制，请到微信粘贴分享');
            }
        } catch (err) {
            console.error('复制失败:', err);
            promptManualCopy(shareText);
        }
    }
}

function playBook(e) {
    e.stopPropagation();
    const bookId = e.currentTarget.dataset.bookid;
    loadBookDetails(bookId);
}

// ================= 工具函数 =================
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

// ================= 章节保存 =================
function saveCurrentChapterIndex() {
    if (!state.currentBook) return;
    localStorage.setItem(`bookChapter_${state.currentBook.book_id}`, state.currentChapterIndex.toString());
}

function getSavedChapterIndex(bookId) {
    const saved = localStorage.getItem(`bookChapter_${bookId}`);
    return saved !== null ? parseInt(saved) : null;
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
    document.querySelectorAll('.tag').forEach(tag => tag.addEventListener('click', () => {
        dom.searchInput.value = tag.textContent;
        performSearch();
        dom.hotSearchPanel.style.display = 'none';
    }));
    dom.searchButton.addEventListener('click', performSearch);
    dom.searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') performSearch(); });
    dom.backButton.addEventListener('click', () => { showPage('search'); cleanupAudio(); });
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
    
    // 更新音频事件监听 - 使用增强的 timeupdate 处理
    state.audio.addEventListener('timeupdate', () => {
        // 只在用户界面可见时更新UI，但总是更新内部状态
        if (!state.isScreenLocked) {
            updateProgressBar();
        }
        
        // 始终更新MediaSession状态
        if ('mediaSession' in navigator && !isNaN(state.audio.duration)) {
            try {
                navigator.mediaSession.setPositionState({
                    duration: state.audio.duration,
                    playbackRate: state.audio.playbackRate,
                    position: state.audio.currentTime
                });
            } catch (e) {
                // 忽略错误
            }
        }
    });
    
    state.audio.addEventListener('progress', updateBufferBar);
    
    // 修复的 ended 事件处理 - 直接调用自动播放下一章
    state.audio.addEventListener('ended', () => {
        console.log('音频播放结束，触发自动播放下一章');
        autoPlayNextChapter();
    });
    
    state.audio.addEventListener('loadedmetadata', () => {
        dom.totalTime.textContent = formatTime(state.audio.duration);
        updateBufferBar();
    });
    state.audio.addEventListener('error', () => {
        if (state.isAudioLoaded || state.audio.currentTime > 0) {
            console.warn('播放中出错，停止重试');
            updateProxyIndicator('error');
            return;
        }
        tryRetry();
    });
    state.audio.addEventListener('playing', () => {
        state.isAudioLoaded = true;
        updateProxyIndicator('success');
        console.log('音频成功开始播放');
    });
    dom.favoriteButton.addEventListener('click', toggleFavoritePanel);
    document.addEventListener('click', e => {
        if (!dom.favoriteButton.contains(e.target) && !dom.favoritePanel.contains(e.target)) {
            dom.favoritePanel.style.display = 'none';
        }
    });
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
    
    // 增强的页面可见性变化处理
    document.addEventListener('visibilitychange', () => {
        console.log('页面可见性变化:', document.visibilityState);
        
        if (document.visibilityState === 'visible') {
            state.isScreenLocked = false;
            
            // 页面重新可见时强制更新进度和缓冲
            updateProgressBar();
            updateBufferBar();
            
            // 重新启用自动播放下一章
            state.autoPlayNextEnabled = true;
            
            // 检查是否需要恢复播放
            if (state.backgroundPlayback && state.isPlaying) {
                state.audio.play().catch(e => {
                    console.log('恢复播放失败:', e);
                });
                state.backgroundPlayback = false;
            }
            
            // 更新 MediaSession 状态
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused";
            }
            
            // 重新请求唤醒锁
            if (state.currentPage === 'player' && state.isPlaying) {
                requestWakeLock();
            }
        } else if (document.visibilityState === 'hidden') {
            state.isScreenLocked = true;
            state.backgroundPlayback = state.isPlaying;
            
            // 确保自动播放下一章仍然启用
            state.autoPlayNextEnabled = true;
            
            // 更新MediaSession状态
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused";
            }
            
            // 锁屏前更新一次进度和缓冲
            updateProgressBar();
            updateBufferBar();
        }
    });
    
    // 页面失去焦点和获得焦点的处理
    window.addEventListener('blur', () => {
        console.log('窗口失去焦点');
        state.isScreenLocked = true;
    });
    
    window.addEventListener('focus', () => {
        console.log('窗口获得焦点');
        state.isScreenLocked = false;
        updateProgressBar();
        updateBufferBar();
    });
    
    // 增强的页面恢复事件监听
    document.addEventListener('resume', () => {
        console.log('页面恢复事件触发');
        if (state.isPlaying) {
            state.audio.play().catch(e => {
                console.log('恢复播放失败:', e);
            });
        }
    }, false);
    
    // 添加页面beforeunload事件处理
    window.addEventListener('beforeunload', () => {
        releaseWakeLock();
    });
}

function setVolumeFromEvent(e) {
    const rect = dom.volumeBar.getBoundingClientRect();
    const x = (e.clientX ?? e.touches[0].clientX) - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    state.audio.volume = percent;
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

// ================= 初始化 =================
function initApp() {
    setupEventListeners();
    setupMediaSession();
    performSearch();
    state.audio.volume = .7;
    updateVolumeUI();
    updateProxyIndicator('init');
    const hash = window.location.hash;
    if (hash.startsWith('#book_id=')) {
        const bookId = hash.split('=')[1];
        loadBookDetails(bookId);
    }
    state.audio.setAttribute('crossorigin', 'anonymous');
    
    // 初始化时启用自动播放下一章
    state.autoPlayNextEnabled = true;
    
    console.log('应用初始化完成');
}
window.addEventListener('DOMContentLoaded', initApp);
