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
    backgroundTimer: null, // 新增后台计时器
    backgroundStartTime: 0, // 新增后台计时起始时间
    backgroundStartPosition: 0 // 新增后台计时起始位置
};

// 防抖锁
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
    favoriteList: document.getElementById('favorite-list')
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
    state.audio.addEventListener('progress', updateBufferBar);
    state.audio.addEventListener('ended', handleAudioEnded);
    state.audio.addEventListener('loadedmetadata', () => {
        dom.totalTime.textContent = formatTime(state.audio.duration);
        restorePlaybackPosition();
        updateBufferBar();
        updateMediaSessionPosition();
    });
    
    // 改进的错误处理逻辑
    state.audio.addEventListener('error', () => {
        if (state.isAudioLoaded || state.audio.currentTime > 0) {
            console.warn('播放中出错，停止重试');
            updateProxyIndicator('error');
            return;
        }

        if (state.retryCount < state.maxRetry) {
            state.retryCount++;
            updateProxyIndicator('retry');
            state.retryTimer = setTimeout(() => {
                const chapter = state.chapters[state.currentChapterIndex];
                if (chapter) playChapterAudio(chapter);
            }, 3000);
        } else {
            updateProxyIndicator('error');
        }
    });
    
    state.audio.addEventListener('playing', () => {
        state.isAudioLoaded = true;
        console.log('音频成功开始播放');
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = "playing";
        }
    });
    
    // 收藏按钮事件
    dom.favoriteButton.addEventListener('click', toggleFavoritePanel);
    document.addEventListener('click', e => {
        if (!dom.favoriteButton.contains(e.target) && !dom.favoritePanel.contains(e.target)) {
            dom.favoritePanel.style.display = 'none';
        }
    });
    
    // 设置音量控制事件
    dom.volumeBar.addEventListener('click', setVolumeFromEvent);
    dom.volumeBar.addEventListener('touchstart', e => {
        e.preventDefault();
        setVolumeFromEvent(e);
    });
    dom.volumeBar.addEventListener('touchmove', e => {
        e.preventDefault();
        setVolumeFromEvent(e);
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

// ================= 页面可见性处理 =================
function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
        // 页面进入后台
        startBackgroundTracking();
    } else {
        // 页面回到前台
        stopBackgroundTracking();
        // 更新进度条
        updateProgressBar();
    }
}

function startBackgroundTracking() {
    // 记录进入后台时的时间和位置
    state.backgroundStartTime = Date.now();
    state.backgroundStartPosition = state.audio.currentTime;
    
    // 清除之前的计时器
    if (state.backgroundTimer) clearInterval(state.backgroundTimer);
    
    // 每秒更新一次进度
    state.backgroundTimer = setInterval(() => {
        if (state.isPlaying) {
            // 计算当前播放位置
            const elapsed = (Date.now() - state.backgroundStartTime) / 1000;
            const newPosition = state.backgroundStartPosition + elapsed;
            
            // 更新当前时间显示
            dom.currentTime.textContent = formatTime(newPosition);
            
            // 检查是否需要切换到下一章
            if (state.audio.duration && newPosition >= state.audio.duration) {
                handleAudioEnded();
            }
        }
    }, 1000);
}

function stopBackgroundTracking() {
    if (state.backgroundTimer) {
        clearInterval(state.backgroundTimer);
        state.backgroundTimer = null;
    }
}

// ================= 音频结束处理 =================
function handleAudioEnded() {
    if (document.visibilityState === 'visible') {
        // 页面在前台，直接播放下一章
        playNextChapter();
    } else {
        // 页面在后台，切换到下一章但不播放（保持暂停状态）
        if (state.currentChapterIndex < state.chapters.length - 1) {
            state.currentChapterIndex++;
            savePlaybackPosition();
            updateMediaSessionMetadata();
        }
    }
}

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

// ================= 缓冲条更新 =================
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
        
        // 卡片点击事件 - 排除按钮点击
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.book-btn') && !e.target.closest('.expand-btn')) {
                loadBookDetails(b.book_id);
            }
        });
        
        // 按钮事件
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
            state.retryCount = 0;
            state.isAudioLoaded = false;
            renderPlayerPage();
            showPage('player');
            if (state.chapters.length) {
                const savedProgress = getSavedProgress(bookId);
                if (savedProgress) {
                    state.currentChapterIndex = savedProgress.chapterIndex;
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

    // 添加：更新章节总数
    const totalChapters = state.chapters.length;
    const chapterCountEl = document.getElementById('chapter-count');
    if (chapterCountEl) {
        chapterCountEl.textContent = `共${totalChapters}章`;
    }

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

// ================= 代理 & 播放 =================
function proxyUrl(url) { return state.proxy + encodeURIComponent(url); }

async function playChapterAudio(chapter) {
    if (isLoadingAudio || state.isAudioLoaded) return;
    isLoadingAudio = true;

    try {
        updateProxyIndicator('init');

        const res = await fetch(`https://api.cenguigui.cn/api/tingshu/?item_id=${chapter.item_id}`);
        const data = await res.json();

        if (data.code === 200 && data.data?.url) {
            const audioUrl = proxyUrl(data.data.url);

            // 避免重复设置 src
            if (state.audio.src !== audioUrl) {
                state.audio.src = audioUrl;
                state.audio.load(); // 只加载一次
            }

            state.audio.playbackRate = state.playbackRate;
            state.isAudioLoaded = false;

            // 等待音频可以播放
            state.audio.oncanplay = async () => {
                try {
                    await state.audio.play();
                    state.isPlaying = true;
                    dom.playButton.innerHTML = '<i class="fas fa-pause"></i>';
                    updateProxyIndicator('success');
                    state.retryCount = 0;
                    state.isAudioLoaded = true;
                } catch (playErr) {
                    console.error('播放失败:', playErr);
                    tryRetry();
                }
            };

            state.audio.onerror = () => {
                if (!state.isAudioLoaded) {
                    tryRetry();
                }
            };
        } else {
            throw new Error('获取音频URL失败');
        }
    } catch (err) {
        console.error(err);
        tryRetry();
    } finally {
        isLoadingAudio = false;
    }
}

function playChapter(index) {
    if (index === state.currentChapterIndex && state.isAudioLoaded) return;

    pauseAudio();
    clearTimeout(state.retryTimer);
    state.retryCount = 0;
    state.isAudioLoaded = false;

    state.audio.currentTime = 0;
    updateProgressBar();

    state.currentChapterIndex = index;
    updateProxyIndicator('retry');

    document.querySelectorAll('.chapter-item').forEach((li, i) =>
        li.classList.toggle('active', i === index)
    );
    
    // 更新媒体会话元数据
    updateMediaSessionMetadata();

    if (state.chapters[index]) {
        playChapterAudio(state.chapters[index]);
    }
}

function tryRetry() {
    if (state.retryCount < state.maxRetry) {
        state.retryCount++;
        updateProxyIndicator('retry');
        state.retryTimer = setTimeout(() => {
            const chapter = state.chapters[state.currentChapterIndex];
            if (chapter) playChapterAudio(chapter);
        }, 3000);
    } else updateProxyIndicator('error');
}

// ================= 音频控制 =================
function playAudio() {
    state.audio.play().then(() => {
        state.isPlaying = true;
        dom.playButton.innerHTML = '<i class="fas fa-pause"></i>';
        // 更新媒体会话播放状态
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
    // 保存播放进度
    savePlaybackPosition();
    // 更新媒体会话播放状态
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
    // 更新媒体会话位置状态
    updateMediaSessionPosition();
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

// ================= 收藏功能 =================
function toggleFavorite(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const bookId = btn.dataset.bookid;
    
    const storedFavorites = localStorage.getItem('bookFavorites');
    let favorites = storedFavorites ? JSON.parse(storedFavorites) : [];
    
    const bookIndex = favorites.findIndex(f => f.book_id === bookId);
    
    if (bookIndex !== -1) {
        // 移除收藏
        favorites.splice(bookIndex, 1);
        btn.innerHTML = '<i class="far fa-star"></i> 收藏';
        btn.classList.remove('favorited');
    } else {
        // 添加收藏
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
    
    const favorites = JSON.parse(storedFavorites);
    return favorites.some(f => f.book_id === bookId);
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
            </button>
        `;
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
    
    // 更新搜索结果中的收藏状态
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
        
        // 创建一个临时的textarea元素来复制文本
        const copyToClipboardFallback = (text) => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (!successful) {
                    throw new Error('复制失败');
                }
            } catch (err) {
                console.error('使用execCommand复制失败:', err);
                throw err;
            } finally {
                document.body.removeChild(textarea);
            }
        };
        
        try {
            // 优先使用现代API
            if (navigator.clipboard) {
                navigator.clipboard.writeText(shareText).then(() => {
                    showToast('已复制，请到微信粘贴分享');
                }).catch(() => {
                    // 如果现代API失败，使用回退方案
                    copyToClipboardFallback(shareText);
                    showToast('已复制，请到微信粘贴分享');
                });
            } else {
                // 不支持clipboard API，直接使用回退方案
                copyToClipboardFallback(shareText);
                showToast('已复制，请到微信粘贴分享');
            }
        } catch (err) {
            console.error('复制失败:', err);
            // 如果所有方法都失败，显示手动复制提示
            promptManualCopy(shareText);
        }
    }
}

// ================= 媒体会话 API =================
function setupMediaSessionHandlers() {
    if ('mediaSession' in navigator) {
        // 设置媒体操作处理程序
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
    }
}

function updateMediaSessionMetadata() {
    if (!('mediaSession' in navigator) || !state.currentBook || !state.chapters[state.currentChapterIndex]) return;
    
    const chapter = state.chapters[state.currentChapterIndex];
    const book = state.currentBook;
    
    navigator.mediaSession.metadata = new MediaMetadata({
        title: chapter.title,
        artist: book.book_name,
        album: book.author,
        artwork: [
            { src: book.book_pic, sizes: '200x200', type: 'image/jpeg' }
        ]
    });
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

// 添加新的辅助函数
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
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
        </div>
    `;
    
    document.body.appendChild(container);
    
    const textarea = container.querySelector('.copy-textarea');
    textarea.select();
    
    container.querySelector('.close-copy-btn').addEventListener('click', () => {
        document.body.removeChild(container);
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
    if (!saved) return null;
    
    return JSON.parse(saved);
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

// ================= 初始化 =================
function initApp() {
    setupEventListeners();
    setupMediaSessionHandlers();
    performSearch();
    state.audio.volume = .7;
    updateVolumeUI();
    updateProxyIndicator('init');
    
    // 检查URL中是否有书籍ID
    const hash = window.location.hash;
    if (hash.startsWith('#book_id=')) {
        const bookId = hash.split('=')[1];
        loadBookDetails(bookId);
    }
}

window.addEventListener('DOMContentLoaded', initApp);
