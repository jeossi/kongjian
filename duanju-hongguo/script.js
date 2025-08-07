// ================= 全局状态 =================
const state = {
    currentPage: 'search',
    currentBook: null,
    currentChapterIndex: 0,
    chapters: [],
    videoPlayer: document.getElementById('video-player'),
    searchResults: []
};

// ================= DOM 节点 =================
const dom = {
    searchPage: document.getElementById('search-page'),
    playerPage: document.getElementById('player-page'),
    searchInput: document.getElementById('search-input'),
    searchButton: document.getElementById('search-button'),
    resultsGrid: document.getElementById('results-grid'),
    searchLoader: document.getElementById('search-loader'),
    backButton: document.getElementById('back-button'),
    playerBookCover: document.getElementById('player-book-cover'),
    playerBookTitle: document.getElementById('player-book-title'),
    playerBookAuthor: document.getElementById('player-book-author'),
    playerBookCategory: document.getElementById('player-book-category'),
    playerBookDuration: document.getElementById('player-book-duration'),
    chapterList: document.getElementById('chapter-list'),
    videoPlayer: document.getElementById('video-player'),
    favoriteButton: document.getElementById('favorite-button'),
    favoritePanel: document.getElementById('favorite-panel'),
    favoriteList: document.getElementById('favorite-list'),
    progressBar: document.getElementById('progress-bar'),
    progress: document.getElementById('progress'),
    currentTime: document.getElementById('current-time'),
    totalTime: document.getElementById('total-time'),
    playBtn: document.getElementById('play-btn'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    speedBtn: document.getElementById('speed-btn'),
    speedMenu: document.getElementById('speed-menu'),
    volumeBtn: document.getElementById('volume-btn'),
    volumeBar: document.getElementById('volume-bar'),
    volumeLevel: document.getElementById('volume-level')
};

// ================= 初始化 =================
function initApp() {
    setupEventListeners();
    performSearch('推荐榜'); // 默认加载推荐榜
}

window.addEventListener('DOMContentLoaded', initApp);

// ================= 绑定事件 =================
function setupEventListeners() {
    dom.searchButton.addEventListener('click', () => performSearch());
    dom.searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') performSearch(); });
    dom.backButton.addEventListener('click', () => showPage('search'));
    dom.favoriteButton.addEventListener('click', toggleFavoritePanel);
    document.addEventListener('click', e => {
        if (!dom.favoriteButton.contains(e.target) && !dom.favoritePanel.contains(e.target)) {
            dom.favoritePanel.style.display = 'none';
        }
    });

    // 播放/暂停
    dom.playBtn.addEventListener('click', () => {
        if (dom.videoPlayer.paused) dom.videoPlayer.play(); else dom.videoPlayer.pause();
    });
    dom.videoPlayer.addEventListener('play', () => dom.playBtn.innerHTML = '<i class="fas fa-pause"></i>');
    dom.videoPlayer.addEventListener('pause', () => dom.playBtn.innerHTML = '<i class="fas fa-play"></i>');

    // 上一集 / 下一集
    dom.prevBtn.addEventListener('click', () => playChapter(state.currentChapterIndex - 1));
    dom.nextBtn.addEventListener('click', () => playChapter(state.currentChapterIndex + 1));

    // 倍速
    dom.speedBtn.addEventListener('click', () => dom.speedMenu.classList.toggle('show'));
    dom.speedMenu.addEventListener('click', e => {
        if (e.target.classList.contains('speed-option')) {
            const speed = parseFloat(e.target.dataset.speed);
            dom.videoPlayer.playbackRate = speed;
            dom.speedMenu.classList.remove('show');
        }
    });

    // 音量
    dom.volumeBtn.addEventListener('click', () => dom.videoPlayer.muted = !dom.videoPlayer.muted);
    dom.volumeBar.addEventListener('click', e => {
        const rect = dom.volumeBar.getBoundingClientRect();
        const vol = (e.clientX - rect.left) / rect.width;
        dom.videoPlayer.volume = vol;
        dom.volumeLevel.style.width = (vol * 100) + '%';
    });

    // 进度条
    dom.progressBar.addEventListener('click', e => {
        const rect = dom.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        dom.videoPlayer.currentTime = percent * dom.videoPlayer.duration;
    });
    dom.videoPlayer.addEventListener('loadedmetadata', () => dom.totalTime.textContent = formatTime(dom.videoPlayer.duration));
    dom.videoPlayer.addEventListener('timeupdate', () => {
        dom.currentTime.textContent = formatTime(dom.videoPlayer.currentTime);
        dom.progress.style.width = (dom.videoPlayer.currentTime / dom.videoPlayer.duration * 100) + '%';
    });
}

// ================= 工具函数 =================
function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// ================= 页面切换 =================
function showPage(page) {
    dom.searchPage.style.display = page === 'search' ? 'block' : 'none';
    dom.playerPage.style.display = page === 'player' ? 'block' : 'none';
    state.currentPage = page;
}

// ================= 搜索 =================
async function performSearch(query = dom.searchInput.value.trim() || '推荐榜') {
    dom.searchLoader.style.display = 'block';
    dom.resultsGrid.innerHTML = '';
    try {
        const res = await fetch(`https://api.cenguigui.cn/api/duanju/api.php?name=${encodeURIComponent(query)}&page=1`);
        const data = await res.json();
        if (data.code === 200 && data.data) {
            state.searchResults = data.data;
            renderSearchResults(data.data);
        } else {
            throw new Error('未找到搜索结果');
        }
    } catch (err) {
        dom.resultsGrid.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>搜索失败: ${err.message}</p></div>`;
    } finally {
        dom.searchLoader.style.display = 'none';
    }
}

// ================= 渲染搜索结果 =================
function renderSearchResults(books) {
    dom.resultsGrid.innerHTML = '';
    books.forEach(b => {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <img src="${b.cover}" alt="${b.title}" class="book-cover">
            <div class="book-info">
                <div class="book-title">${b.title}</div>
                <div class="book-author">作者: ${b.author}</div>
                <div class="book-type">分类: ${b.type}</div>
                <div class="book-status">播放量: ${b.play_cnt}</div>
                <div class="book-status">集数: ${b.episode_cnt} 集</div>
                <div class="book-intro">${b.intro}</div>
                <button class="book-btn" onclick="loadBookDetails('${b.book_id}')">立即观看</button>
            </div>
        `;
        dom.resultsGrid.appendChild(card);
    });
}

// ================= 加载剧集详情 =================
async function loadBookDetails(bookId) {
    try {
        const res = await fetch(`https://api.cenguigui.cn/api/duanju/api.php?book_id=${bookId}&showRawParams=false`);
        const data = await res.json();
        if (data.code === 200 && data.data) {
            state.currentBook = data;
            state.chapters = data.data;
            state.currentChapterIndex = 0;
            renderPlayerPage();
            showPage('player');
            playChapter(0); // 自动播放第一集
        } else {
            throw new Error('加载剧集失败');
        }
    } catch (err) {
        alert('加载失败: ' + err.message);
    }
}

// ================= 渲染播放页 =================
function renderPlayerPage() {
    const { book_name, author, category, desc, book_pic, duration } = state.currentBook;
    dom.playerBookTitle.textContent = book_name;
    dom.playerBookAuthor.textContent = `播音: ${author}`;
    dom.playerBookCategory.textContent = `分类: ${category}`;
    dom.playerBookDuration.textContent = `时长: ${duration}`;
    dom.playerBookCover.src = book_pic;

    dom.chapterList.innerHTML = '';
    state.chapters.forEach((c, i) => {
        const li = document.createElement('li');
        li.className = 'chapter-item' + (i === 0 ? ' active' : '');
        li.innerHTML = `<span class="chapter-number">${i + 1}</span>${c.title}`;
        li.addEventListener('click', () => playChapter(i));
        dom.chapterList.appendChild(li);
    });
}

// ================= 播放剧集 =================
async function playChapter(index) {
    if (index < 0 || index >= state.chapters.length) return;
    const chapter = state.chapters[index];
    state.currentChapterIndex = index;
    dom.chapterList.querySelectorAll('.chapter-item').forEach((li, i) => li.classList.toggle('active', i === index));

    try {
        const res = await fetch(`https://api.cenguigui.cn/api/duanju/api.php?video_id=${chapter.video_id}&type=json&showRawParams=false`);
        const data = await res.json();
        if (data.code === 200 && data.data?.url) {
            dom.videoPlayer.src = data.data.url;
            dom.videoPlayer.play();
        } else {
            throw new Error('获取视频地址失败');
        }
    } catch (err) {
        alert('播放失败: ' + err.message);
    }
}

// ================= 收藏相关 =================
function toggleFavoritePanel() {
    dom.favoritePanel.style.display = dom.favoritePanel.style.display === 'block' ? 'none' : 'block';
}