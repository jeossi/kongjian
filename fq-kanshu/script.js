// 全局状态管理
const appState = {
    currentPage: 'books', // books, chapters, reader
    currentBook: null,
    currentChapter: null,
    currentChapterIndex: 0,
    currentPageNum: 1,
    totalPages: 3,
    booksData: [],
    chaptersData: [],
    hotKeywords: "玄幻", "穿越", "科幻", "盗墓", "情感", "总裁", "兵王","赘婿", "神医", "重生", "宫斗宅斗", "悬疑", "民俗秘闻", "脑洞","学霸", "儿童", "言情"],
    fontSize: 'md', // sm, md, lg, xl
    favorites: [],
    readingProgress: {},
    currentSharingBook: null,
    currentSearchKeyword: ''
};

// DOM元素引用
const elements = {
    // 页面容器
    booksPage: document.getElementById('books-page'),
    chaptersPage: document.getElementById('chapters-page'),
    readerPage: document.getElementById('reader-page'),
    
    // 书籍列表页元素
    booksContainer: document.getElementById('books-container'),
    booksLoading: document.getElementById('books-loading'),
    booksEmpty: document.getElementById('books-empty'),
    
    // 章节列表页元素
    backToBooks: document.getElementById('back-to-books'),
    bookTitle: document.getElementById('book-title'),
    bookAuthor: document.getElementById('book-author'),
    bookStatus: document.getElementById('book-status'),
    bookUpdate: document.getElementById('book-update'),
    chaptersContainer: document.getElementById('chapters-container'),
    chaptersLoading: document.getElementById('chapters-loading'),
    scrollToTop: document.getElementById('scroll-to-top'),
    
    // 阅读页元素
    backToChapters: document.getElementById('back-to-chapters'),
    chapterTitle: document.getElementById('chapter-title'),
    readerContent: document.getElementById('reader-content'),
    readerLoading: document.getElementById('reader-loading'),
    prevPageBtn: document.getElementById('prev-page'),
    nextPageBtn: document.getElementById('next-page'),
    currentPageEl: document.getElementById('current-page'),
    totalPagesEl: document.getElementById('total-pages'),
    chapterInfoEl: document.getElementById('chapter-info'),
    decreaseFont: document.getElementById('decrease-font'),
    increaseFont: document.getElementById('increase-font'),
    
    // 搜索相关元素 - 桌面端
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    hotSearchPanel: document.getElementById('hot-search-panel'),
    hotKeywordsContainer: document.getElementById('hot-keywords'),
    closeSearchPanel: document.getElementById('close-search-panel'),
    
    // 搜索相关元素 - 移动端
    searchInputMobile: document.getElementById('search-input-mobile'),
    searchBtnMobile: document.getElementById('search-btn-mobile'),
    hotSearchPanelMobile: document.getElementById('hot-search-panel-mobile'),
    hotKeywordsContainerMobile: document.getElementById('hot-keywords-mobile'),
    closeSearchPanelMobile: document.getElementById('close-search-panel-mobile'),
    
    // 工具栏元素
    fontSizeControl: document.getElementById('font-size-control'),
    fontSizeControlMobile: document.getElementById('font-size-control-mobile'),
    fontSizePanel: document.getElementById('font-size-panel'),
    closeFontPanel: document.getElementById('close-font-panel'),
    fontSmBtn: document.getElementById('font-sm'),
    fontMdBtn: document.getElementById('font-md'),
    fontLgBtn: document.getElementById('font-lg'),
    fontXlBtn: document.getElementById('font-xl'),
    
    favoritesBtn: document.getElementById('favorites-btn'),
    favoritesBtnMobile: document.getElementById('favorites-btn-mobile'),
    shareBtn: document.getElementById('share-btn'),
    shareBtnMobile: document.getElementById('share-btn-mobile'),
    sharePanel: document.getElementById('share-panel'),
    closeSharePanel: document.getElementById('close-share-panel'),
    copyLinkBtn: document.getElementById('copy-link-btn'),
    
    // 收藏夹元素
    favoritesPanel: document.getElementById('favorites-panel'),
    favoritesContainer: document.getElementById('favorites-container'),
    favoritesCount: document.getElementById('favorites-count'),
    closeFavoritesPanel: document.getElementById('close-favorites-panel')
};

// API基础URL
const API_BASE_URL = 'https://api.jkyai.top/API/fqmfxs.php';

// 初始化应用
function initApp() {
    // 从localStorage加载收藏数据
    try {
        const storedFavorites = localStorage.getItem('favorites');
        if (storedFavorites) {
            appState.favorites = JSON.parse(storedFavorites);
        }
        
        const storedProgress = localStorage.getItem('readingProgress');
        if (storedProgress) {
            appState.readingProgress = JSON.parse(storedProgress);
        }
    } catch (e) {
        console.error('加载本地存储数据失败:', e);
        appState.favorites = [];
        appState.readingProgress = {};
    }
    
    // 加载热门搜索关键词
    renderHotKeywords();
    
    // 默认加载"都市"类书籍
    fetchBooks('都市');
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始化收藏夹
    renderFavorites();
    
    // 恢复阅读进度
    restoreReadingProgress();
}

// 恢复阅读进度
function restoreReadingProgress() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookName = urlParams.get('book');
    const keyword = urlParams.get('keyword');
    
    if (bookName && keyword) {
        fetchBooks(keyword).then(() => {
            const book = appState.booksData.find(b => b['小说名称'] === decodeURIComponent(bookName));
            if (book) {
                const progressKey = `${book['小说名称']}`;
                const progress = appState.readingProgress[progressKey];
                
                if (progress) {
                    showBookChapters(book, progress.chapterIndex);
                    setTimeout(() => {
                        readChapter(progress.chapterIndex);
                        setTimeout(() => {
                            fetchChapterContent(appState.currentChapter['开始阅读'], progress.pageNum);
                        }, 100);
                    }, 100);
                } else {
                    showBookChapters(book);
                }
            }
        });
    }
}

// 保存阅读进度
function saveReadingProgress() {
    if (appState.currentBook && appState.currentChapter) {
        const progressKey = `${appState.currentBook['小说名称']}-${appState.currentBook['原创作者']}`;
        appState.readingProgress[progressKey] = {
            chapterIndex: appState.currentChapterIndex,
            pageNum: appState.currentPageNum,
            chapterTitle: appState.currentChapter['章节名称'],
            lastRead: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('readingProgress', JSON.stringify(appState.readingProgress));
        } catch (e) {
            console.error('保存阅读进度失败:', e);
        }
    }
}

// 渲染热门搜索关键词
function renderHotKeywords() {
    // 桌面端
    const container = elements.hotKeywordsContainer;
    container.innerHTML = '';
    
    const filteredKeywords = appState.hotKeywords.filter(keyword => keyword !== "多女主");
    
    filteredKeywords.forEach(keyword => {
        const keywordEl = document.createElement('button');
        keywordEl.className = 'px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300 hover:bg-indigo-900/50 hover:text-indigo-300 transition-colors';
        keywordEl.textContent = keyword;
        keywordEl.addEventListener('click', () => {
            elements.searchInput.value = keyword;
            appState.currentSearchKeyword = keyword;
            fetchBooks(keyword);
            elements.hotSearchPanel.classList.add('hidden');
        });
        container.appendChild(keywordEl);
    });
    
    // 移动端
    const mobileContainer = elements.hotKeywordsContainerMobile;
    mobileContainer.innerHTML = '';
    
    filteredKeywords.forEach(keyword => {
        const keywordEl = document.createElement('button');
        keywordEl.className = 'px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300 hover:bg-indigo-900/50 hover:text-indigo-300 transition-colors';
        keywordEl.textContent = keyword;
        keywordEl.addEventListener('click', () => {
            elements.searchInputMobile.value = keyword;
            appState.currentSearchKeyword = keyword;
            fetchBooks(keyword);
            elements.hotSearchPanelMobile.classList.add('hidden');
        });
        mobileContainer.appendChild(keywordEl);
    });
}

// 获取书籍列表
async function fetchBooks(keyword) {
    if (!keyword) return;
    
    appState.currentSearchKeyword = keyword;
    elements.booksContainer.innerHTML = '';
    elements.booksLoading.classList.remove('hidden');
    elements.booksEmpty.classList.add('hidden');
    
    try {
        const response = await fetch(`${API_BASE_URL}?name=${encodeURIComponent(keyword)}`);
        const data = await response.json();
        
        if (data.code === 200 && data.data && data.data.length > 0) {
            appState.booksData = data.data;
            renderBooksList();
            return data.data;
        } else {
            elements.booksEmpty.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error fetching books:', error);
        elements.booksEmpty.classList.remove('hidden');
        elements.booksEmpty.innerHTML = `
            <i class="fa-solid fa-exclamation-circle text-5xl mb-4 opacity-20"></i>
            <p>加载失败，请稍后重试</p>
        `;
    } finally {
        elements.booksLoading.classList.add('hidden');
    }
}

// 渲染书籍列表
function renderBooksList() {
    const container = elements.booksContainer;
    container.innerHTML = '';
    
    appState.booksData.forEach(book => {
        const isFavorited = appState.favorites.some(fav => 
            fav['小说名称'] === book['小说名称'] && fav['原创作者'] === book['原创作者']
        );
        
        const bookCard = document.createElement('div');
        bookCard.className = 'bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-indigo-900/5 transition-all duration-300 group';
        bookCard.innerHTML = `
            <div class="p-5">
                <h3 class="text-xl font-bold mb-2 text-gray-100 group-hover:text-indigo-400 transition-colors line-clamp-2">${book['小说名称']}</h3>
                <div class="text-sm text-gray-400 mb-4">作者：${book['原创作者']}</div>
                
                <div class="space-y-2 text-sm mb-5 text-left">
                    <div class="flex">
                        <span class="text-gray-500 mr-2">状态:</span>
                        <span class="${book['是否完结'].includes('连载') ? 'text-amber-400' : 'text-green-400'}">${book['是否完结'].replace('状态：', '')}</span>
                    </div>
                    <div class="flex">
                        <span class="text-gray-500 mr-2">更新:</span>
                        <span class="text-gray-300">${book['内容'].replace('更新时间：', '')}</span>
                    </div>
                    <div class="flex">
                        <span class="text-gray-500 mr-2">最新章节:</span>
                        <span class="text-gray-300 line-clamp-1">${book['最近更新']}</span>
                    </div>
                </div>
                
                <div class="flex space-x-2">
                    <button class="read-book-btn flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-center text-sm font-medium transition-colors" 
                            data-book='${JSON.stringify(book)}' data-chapter-index="0">
                        开始阅读
                    </button>
                    <button class="show-chapters-btn py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-center text-sm font-medium transition-colors"
                            data-book='${JSON.stringify(book)}'>
                        <i class="fa-solid fa-list"></i>
                    </button>
                    <button class="favorite-book-btn py-2 px-3 rounded-lg text-center text-sm font-medium transition-colors ${isFavorited ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-700 hover:bg-gray-600'}"
                            data-book='${JSON.stringify(book)}'>
                        <i class="fa-solid ${isFavorited ? 'fa-star text-white' : 'fa-star text-gray-300'}"></i>
                    </button>
                    <button class="share-book-btn py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-center text-sm font-medium transition-colors"
                            data-book='${JSON.stringify(book)}'>
                        <i class="fa-solid fa-share-alt text-gray-300"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(bookCard);
    });
    
    // 绑定书籍卡片按钮事件
    document.querySelectorAll('.read-book-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const book = JSON.parse(e.currentTarget.dataset.book);
            const chapterIndex = parseInt(e.currentTarget.dataset.chapterIndex);
            showBookChapters(book, chapterIndex);
        });
    });
    
    document.querySelectorAll('.show-chapters-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const book = JSON.parse(e.currentTarget.dataset.book);
            showBookChapters(book);
        });
    });
    
    // 绑定收藏按钮事件
    document.querySelectorAll('.favorite-book-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const book = JSON.parse(e.currentTarget.dataset.book);
            toggleFavorite(book);
            e.stopPropagation();
        });
    });
    
    // 绑定分享按钮事件
    document.querySelectorAll('.share-book-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const book = JSON.parse(e.currentTarget.dataset.book);
            appState.currentSharingBook = book;
            elements.sharePanel.classList.remove('hidden');
            e.stopPropagation();
        });
    });
}

// 获取章节目录
async function fetchChapters(book) {
    appState.currentBook = book;
    
    elements.bookTitle.textContent = book['小说名称'];
    elements.bookAuthor.textContent = `作者: ${book['原创作者']}`;
    elements.bookStatus.textContent = book['是否完结'];
    elements.bookUpdate.textContent = book['内容'];
    
    elements.chaptersContainer.innerHTML = '';
    elements.chaptersLoading.classList.remove('hidden');
    
    try {
        const response = await fetch(book['章节目录']);
        const data = await response.json();
        
        if (data.code === 200 && data.data && data.data.chapters) {
            const processedChapters = processChapters(data.data.chapters);
            appState.chaptersData = processedChapters;
            renderChaptersList();
        } else {
            elements.chaptersContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-10 text-gray-400">
                    <i class="fa-solid fa-book-open text-4xl mb-3 opacity-20"></i>
                    <p>无法加载章节目录</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching chapters:', error);
        elements.chaptersContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-gray-400">
                <i class="fa-solid fa-exclamation-circle text-4xl mb-3 opacity-20"></i>
                <p>加载失败，请稍后重试</p>
            </div>
        `;
    } finally {
        elements.chaptersLoading.classList.add('hidden');
    }
}

// 处理章节数据，补全缺失章节
function processChapters(chapters) {
    if (chapters.length <= 1) return chapters;
    
    const processedChapters = [];
    
    for (let i = 0; i < chapters.length; i++) {
        processedChapters.push(chapters[i]);
        
        if (i < chapters.length - 1) {
            const currentChapterNum = extractChapterNumber(chapters[i]['章节名称']);
            const nextChapterNum = extractChapterNumber(chapters[i+1]['章节名称']);
            
            if (nextChapterNum && currentChapterNum && nextChapterNum > currentChapterNum + 1) {
                const currentUrl = chapters[i]['开始阅读'];
                const urlParts = currentUrl.match(/(.*?)(\d+)\.html&num=1/);
                
                if (urlParts && urlParts.length >= 3) {
                    const urlPrefix = urlParts[1];
                    const currentFileNum = parseInt(urlParts[2]);
                    
                    for (let num = currentChapterNum + 1; num < nextChapterNum; num++) {
                        const fileNum = currentFileNum + (num - currentChapterNum);
                        const chapterUrl = `${urlPrefix}${fileNum}.html&num=1`;
                        
                        processedChapters.push({
                            '章节名称': `第${num}章`,
                            '开始阅读': chapterUrl
                        });
                    }
                }
            }
        }
    }
    
    return processedChapters;
}

// 从章节标题中提取章节号
function extractChapterNumber(chapterTitle) {
    const numMatch = chapterTitle.match(/第([零一二三四五六七八九十百千万]+|\d+)章/);
    
    if (!numMatch || !numMatch[1]) return null;
    
    const numStr = numMatch[1];
    
    if (/^\d+$/.test(numStr)) {
        return parseInt(numStr);
    }
    
    const chineseNumbers = {
        '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
        '十': 10, '百': 100, '千': 1000, '万': 10000
    };
    
    let result = 0;
    let temp = 0;
    
    for (let i = 0; i < numStr.length; i++) {
        const char = numStr[i];
        const value = chineseNumbers[char];
        
        if (value === 10) {
            temp = temp === 0 ? 10 : temp * 10;
        } else if (value === 100) {
            temp *= 100;
            result += temp;
            temp = 0;
        } else if (value === 1000) {
            temp *= 1000;
            result += temp;
            temp = 0;
        } else if (value === 10000) {
            result += temp;
            result *= 10000;
            temp = 0;
        } else {
            temp += value;
        }
    }
    
    result += temp;
    return result > 0 ? result : null;
}

// 渲染章节目录
function renderChaptersList() {
    const container = elements.chaptersContainer;
    container.innerHTML = '';
    
    appState.chaptersData.forEach((chapter, index) => {
        const chapterEl = document.createElement('div');
        chapterEl.className = `chapter-item p-4 pl-5 text-gray-300 hover:text-indigo-300 ${index === appState.currentChapterIndex ? 'active' : ''}`;
        chapterEl.innerHTML = `
            <button class="read-chapter-btn w-full text-left" data-chapter-index="${index}">
                <div class="font-medium">${chapter['章节名称']}</div>
            </button>
        `;
        container.appendChild(chapterEl);
    });
    
    // 绑定章节点击事件
    document.querySelectorAll('.read-chapter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const chapterIndex = parseInt(e.currentTarget.dataset.chapterIndex);
            readChapter(chapterIndex);
        });
    });
    
    if (appState.currentChapterIndex >= 0 && appState.chaptersData.length > 0) {
        const activeChapter = container.querySelector(`.chapter-item:nth-child(${appState.currentChapterIndex + 1})`);
        if (activeChapter) {
            activeChapter.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        if (appState.currentChapter === null && appState.chaptersData.length > 0) {
            appState.currentChapterIndex = 0;
            container.querySelector('.chapter-item:first-child').classList.add('active');
        }
    }
}

// 阅读章节内容
async function readChapter(chapterIndex) {
    if (chapterIndex < 0 || chapterIndex >= appState.chaptersData.length) return;
    
    appState.currentChapterIndex = chapterIndex;
    appState.currentChapter = appState.chaptersData[chapterIndex];
    
    // 恢复阅读进度
    const progressKey = `${appState.currentBook['小说名称']}-${appState.currentBook['原创作者']}`;
    const savedProgress = appState.readingProgress[progressKey];
    if (savedProgress && savedProgress.chapterIndex === chapterIndex) {
        appState.currentPageNum = savedProgress.pageNum;
    } else {
        appState.currentPageNum = 1;
    }
    
    elements.chapterTitle.textContent = appState.currentChapter['章节名称'];
    elements.chapterInfoEl.textContent = `${chapterIndex + 1}/${appState.chaptersData.length} 章节`;
    
    switchPage('reader');
    await fetchChapterContent(appState.currentChapter['开始阅读'], appState.currentPageNum);
    
    document.querySelectorAll('.chapter-item').forEach((item, index) => {
        item.classList.toggle('active', index === chapterIndex);
    });
}

// 获取章节内容
async function fetchChapterContent(url, pageNum) {
    elements.readerContent.innerHTML = '';
    elements.readerLoading.classList.remove('hidden');
    elements.currentPageEl.textContent = pageNum;
    
    try {
        const contentUrl = url.replace(/num=\d+/, `num=${pageNum}`);
        const response = await fetch(contentUrl);
        const text = await response.text();
        
        const content = parseChapterContent(text);
        renderChapterContent(content);
        
        appState.currentPageNum = pageNum;
        elements.currentPageEl.textContent = pageNum;
        
        updateNavigationButtons();
        elements.readerContent.scrollTop = 0;
        
        // 保存阅读进度
        saveReadingProgress();
        
    } catch (error) {
        console.error('Error fetching chapter content:', error);
        elements.readerContent.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-gray-400">
                <i class="fa-solid fa-exclamation-circle text-4xl mb-3 opacity-20"></i>
                <p>内容加载失败，请稍后重试</p>
                <button id="retry-load-content" class="mt-4 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
                    重试
                </button>
            </div>
        `;
        
        document.getElementById('retry-load-content').addEventListener('click', () => {
            fetchChapterContent(url, pageNum);
        });
    } finally {
        elements.readerLoading.classList.add('hidden');
    }
}

// 解析章节内容
function parseChapterContent(rawContent) {
    let content = rawContent.replace(/<[^>]*>?/gm, '');
    content = content.replace(/第\(\d+\/\d+\)页/, '').trim();
    const paragraphs = content.split(/\n{2,}/).filter(p => p.trim().length > 0);
    
    return paragraphs;
}

// 渲染章节内容
function renderChapterContent(paragraphs) {
    const container = elements.readerContent;
    container.innerHTML = '';
    
    paragraphs.forEach(paragraph => {
        const pEl = document.createElement('div');
        pEl.className = 'reader-paragraph';
        pEl.textContent = paragraph;
        container.appendChild(pEl);
    });
    
    applyFontSize();
}

// 切换页面
function switchPage(page) {
    appState.currentPage = page;
    
    elements.booksPage.classList.add('hidden');
    elements.chaptersPage.classList.add('hidden');
    elements.readerPage.classList.add('hidden');
    
    switch(page) {
        case 'books':
            elements.booksPage.classList.remove('hidden');
            break;
        case 'chapters':
            elements.chaptersPage.classList.remove('hidden');
            break;
        case 'reader':
            elements.readerPage.classList.remove('hidden');
            break;
    }
}

// 显示书籍章节列表
function showBookChapters(book, chapterIndex = 0) {
    appState.currentChapterIndex = chapterIndex;
    appState.currentChapter = null;
    
    fetchChapters(book);
    switchPage('chapters');
}

// 切换到上一页
function goToPrevPage() {
    if (appState.currentPageNum > 1) {
        fetchChapterContent(
            appState.currentChapter['开始阅读'], 
            appState.currentPageNum - 1
        );
    } else if (appState.currentChapterIndex > 0) {
        appState.currentChapterIndex--;
        appState.currentChapter = appState.chaptersData[appState.currentChapterIndex];
        elements.chapterTitle.textContent = appState.currentChapter['章节名称'];
        elements.chapterInfoEl.textContent = `${appState.currentChapterIndex + 1}/${appState.chaptersData.length} 章节`;
        
        const chapterItems = document.querySelectorAll('.chapter-item');
        chapterItems.forEach((item, index) => {
            item.classList.toggle('active', index === appState.currentChapterIndex);
        });
        
        const activeChapter = chapterItems[appState.currentChapterIndex];
        if (activeChapter) {
            activeChapter.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        fetchChapterContent(appState.currentChapter['开始阅读'], appState.totalPages);
    }
}

// 切换到下一页
function goToNextPage() {
    if (appState.currentPageNum < appState.totalPages) {
        fetchChapterContent(
            appState.currentChapter['开始阅读'], 
            appState.currentPageNum + 1
        );
    } else if (appState.currentChapterIndex < appState.chaptersData.length - 1) {
        appState.currentChapterIndex++;
        appState.currentChapter = appState.chaptersData[appState.currentChapterIndex];
        elements.chapterTitle.textContent = appState.currentChapter['章节名称'];
        elements.chapterInfoEl.textContent = `${appState.currentChapterIndex + 1}/${appState.chaptersData.length} 章节`;
        
        const chapterItems = document.querySelectorAll('.chapter-item');
        chapterItems.forEach((item, index) => {
            item.classList.toggle('active', index === appState.currentChapterIndex);
        });
        
        const activeChapter = chapterItems[appState.currentChapterIndex];
        if (activeChapter) {
            activeChapter.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        fetchChapterContent(appState.currentChapter['开始阅读'], 1);
    }
}

// 应用字体大小
function applyFontSize() {
    const contentEl = elements.readerContent;
    
    switch(appState.fontSize) {
        case 'sm':
            contentEl.style.fontSize = '16px';
            break;
        case 'md':
            contentEl.style.fontSize = '18px';
            break;
        case 'lg':
            contentEl.style.fontSize = '20px';
            break;
        case 'xl':
            contentEl.style.fontSize = '24px';
            break;
    }
}

// 更新导航按钮状态
function updateNavigationButtons() {
    const { currentPageNum, totalPages, chaptersData, currentChapterIndex } = appState;
    
    elements.prevPageBtn.disabled = currentPageNum === 1 && currentChapterIndex === 0;
    elements.prevPageBtn.innerHTML = currentPageNum > 1 
        ? '<i class="fa-solid fa-angle-left mr-2"></i> 上一页' 
        : '<i class="fa-solid fa-angle-left mr-2"></i> 上一章';
    
    elements.nextPageBtn.disabled = currentPageNum === totalPages && currentChapterIndex === chaptersData.length - 1;
    elements.nextPageBtn.innerHTML = currentPageNum < totalPages 
        ? '下一页 <i class="fa-solid fa-angle-right ml-2"></i>' 
        : '下一章 <i class="fa-solid fa-angle-right ml-2"></i>';
}

// 切换收藏状态
function toggleFavorite(book) {
    if (!book) return;
    
    // 只存储必要的书籍信息
    const bookData = {
'小说名称': book['小说名称'] || '',
    '原创作者': book['原创作者'] || '',  // 修正为正确字段名
    '是否完结': book['是否完结'] || '',
    '内容': book['内容'] || '',
    '最近更新': book['最近更新'] || '',
    '章节目录': book['章节目录'] ? book['章节目录'].startsWith('http') 
        ? book['章节目录'] 
        : `https:${book['章节目录']}` : ''  // 确保URL完整
};
    
    const isFavorited = appState.favorites.some(fav => 
        fav['小说名称'] === bookData['小说名称'] && fav['原创作者'] === bookData['原创作者']
    );
    
    if (isFavorited) {
        appState.favorites = appState.favorites.filter(fav => 
            !(fav['小说名称'] === bookData['小说名称'] && fav['原创作者'] === bookData['原创作者'])
        );
        showToast('已移除收藏', 'success');
    } else {
        appState.favorites.push(bookData);
        showToast('已添加收藏', 'success');
    }
    
    try {
        localStorage.setItem('favorites', JSON.stringify(appState.favorites));
    } catch (e) {
        console.error('保存收藏失败:', e);
        showToast('保存收藏失败', 'error');
    }
    
    renderBooksList();
    renderFavorites();
}

// 渲染收藏夹
function renderFavorites() {
    const container = elements.favoritesContainer;
    container.innerHTML = '';
    
    if (appState.favorites.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-gray-400">
                <i class="fa-solid fa-bookmark text-4xl mb-3 opacity-20"></i>
                <p>暂无收藏书籍</p>
            </div>
        `;
        elements.favoritesCount.textContent = '0';
        return;
    }
    
    appState.favorites.forEach((book, index) => {
        const progressKey = `${book['小说名称']}`;
        const progress = appState.readingProgress[progressKey];
        
        const bookEl = document.createElement('div');
        bookEl.className = 'favorite-book';
        
        let progressText = '';
        if (progress) {
            progressText = `<p class="text-xs text-indigo-400">读到: ${progress.chapterTitle}</p>`;
        }
        
        bookEl.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1 min-w-0">
                    <h4 class="line-clamp-1">${book['小说名称']}</h4>
                    <p class="text-sm text-gray-400">${book['原创作者']} · ${book['是否完结'].replace('状态：', '')}</p>
                    ${progressText}
                </div>
                <div class="flex space-x-1 ml-3">
                    <button class="read-favorite-btn p-2 text-gray-400 hover:text-white" data-index="${index}" title="阅读">
                        <i class="fa-solid fa-book-open"></i>
                    </button>
                    <button class="delete-favorite-btn p-2 text-gray-400 hover:text-red-400" data-index="${index}" title="移除">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(bookEl);
    });
    
    elements.favoritesCount.textContent = appState.favorites.length;
    
    document.querySelectorAll('.read-favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            const book = appState.favorites[index];
            showBookChapters(book);
            elements.favoritesPanel.classList.add('hidden');
            e.stopPropagation();
        });
    });
    
    document.querySelectorAll('.delete-favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            appState.favorites.splice(index, 1);
            try {
                localStorage.setItem('favorites', JSON.stringify(appState.favorites));
            } catch (e) {
                console.error('移除收藏失败:', e);
            }
            renderFavorites();
            renderBooksList();
            showToast('已移除收藏', 'success');
            e.stopPropagation();
        });
    });
}

// 生成分享链接
function generateShareLink(book) {
    const baseUrl = window.location.origin + window.location.pathname;
    let shareUrl = `${baseUrl}?keyword=${encodeURIComponent(appState.currentSearchKeyword)}&book=${encodeURIComponent(book['小说名称'])}`;
    shareUrl += `&t=${Date.now()}`;
    return shareUrl;
}

// 复制链接到剪贴板
function copyToClipboard(text) {
    if (navigator.clipboard) {
        return navigator.clipboard.writeText(text);
    } else {
        // 兼容旧版浏览器
        return new Promise((resolve, reject) => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textarea);
                if (successful) {
                    resolve();
                } else {
                    reject(new Error('复制失败'));
                }
            } catch (err) {
                document.body.removeChild(textarea);
                reject(err);
            }
        });
    }
}

// 显示提示消息
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-gray-100 px-4 py-2 rounded-lg shadow-lg z-50 fade-in ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 绑定事件监听器
function bindEventListeners() {
    // 桌面端搜索事件
    elements.searchInput.addEventListener('focus', () => {
        elements.hotSearchPanel.classList.remove('hidden');
    });
    
    elements.searchBtn.addEventListener('click', () => {
        const keyword = elements.searchInput.value.trim();
        if (keyword) {
            fetchBooks(keyword);
            elements.hotSearchPanel.classList.add('hidden');
        }
    });
    
    elements.closeSearchPanel.addEventListener('click', () => {
        elements.hotSearchPanel.classList.add('hidden');
    });
    
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const keyword = e.target.value.trim();
            if (keyword) {
                fetchBooks(keyword);
                elements.hotSearchPanel.classList.add('hidden');
            }
        }
    });
    
    // 移动端搜索事件
    elements.searchInputMobile.addEventListener('focus', () => {
        elements.hotSearchPanelMobile.classList.remove('hidden');
    });
    
    elements.searchBtnMobile.addEventListener('click', () => {
        const keyword = elements.searchInputMobile.value.trim();
        if (keyword) {
            fetchBooks(keyword);
            elements.hotSearchPanelMobile.classList.add('hidden');
        }
    });
    
    elements.closeSearchPanelMobile.addEventListener('click', () => {
        elements.hotSearchPanelMobile.classList.add('hidden');
    });
    
    // 点击页面其他地方关闭搜索面板
    document.addEventListener('click', (e) => {
        if (!elements.searchInput.contains(e.target) && 
            !elements.hotSearchPanel.contains(e.target) &&
            !elements.searchBtn.contains(e.target)) {
            elements.hotSearchPanel.classList.add('hidden');
        }
        
        if (!elements.searchInputMobile.contains(e.target) && 
            !elements.hotSearchPanelMobile.contains(e.target) &&
            !elements.searchBtnMobile.contains(e.target)) {
            elements.hotSearchPanelMobile.classList.add('hidden');
        }
    });
    
    // 其他事件绑定
    elements.backToBooks.addEventListener('click', () => {
        switchPage('books');
    });
    
    elements.backToChapters.addEventListener('click', () => {
        switchPage('chapters');
    });
    
    elements.scrollToTop.addEventListener('click', () => {
        elements.chaptersContainer.scrollTop = 0;
    });
    
    elements.prevPageBtn.addEventListener('click', goToPrevPage);
    elements.nextPageBtn.addEventListener('click', goToNextPage);
    
    // 字体大小控制
    elements.fontSizeControl.addEventListener('click', () => {
        elements.fontSizePanel.classList.toggle('hidden');
    });
    
    elements.fontSizeControlMobile.addEventListener('click', () => {
        elements.fontSizePanel.classList.toggle('hidden');
    });
    
    elements.closeFontPanel.addEventListener('click', () => {
        elements.fontSizePanel.classList.add('hidden');
    });
    
    elements.fontSmBtn.addEventListener('click', () => {
        appState.fontSize = 'sm';
        applyFontSize();
        elements.fontSizePanel.classList.add('hidden');
    });
    
    elements.fontMdBtn.addEventListener('click', () => {
        appState.fontSize = 'md';
        applyFontSize();
        elements.fontSizePanel.classList.add('hidden');
    });
    
    elements.fontLgBtn.addEventListener('click', () => {
        appState.fontSize = 'lg';
        applyFontSize();
        elements.fontSizePanel.classList.add('hidden');
    });
    
    elements.fontXlBtn.addEventListener('click', () => {
        appState.fontSize = 'xl';
        applyFontSize();
        elements.fontSizePanel.classList.add('hidden');
    });
    
    // 收藏夹按钮
    elements.favoritesBtn.addEventListener('click', () => {
        elements.favoritesPanel.classList.toggle('hidden');
    });
    
    elements.favoritesBtnMobile.addEventListener('click', () => {
        elements.favoritesPanel.classList.toggle('hidden');
    });
    
    elements.closeFavoritesPanel.addEventListener('click', () => {
        elements.favoritesPanel.classList.add('hidden');
    });
    
    // 分享按钮
    elements.shareBtn.addEventListener('click', () => {
        if (appState.currentBook) {
            appState.currentSharingBook = appState.currentBook;
            elements.sharePanel.classList.remove('hidden');
        } else {
            showToast('请先选择要分享的书籍', 'error');
        }
    });
    
    elements.shareBtnMobile.addEventListener('click', () => {
        if (appState.currentBook) {
            appState.currentSharingBook = appState.currentBook;
            elements.sharePanel.classList.remove('hidden');
        } else {
            showToast('请先选择要分享的书籍', 'error');
        }
    });
    
    elements.closeSharePanel.addEventListener('click', () => {
        elements.sharePanel.classList.add('hidden');
    });
    
    elements.copyLinkBtn.addEventListener('click', () => {
        if (appState.currentSharingBook) {
            const link = generateShareLink(appState.currentSharingBook);
            copyToClipboard(link)
                .then(() => {
                    showToast('链接已复制到剪贴板', 'success');
                })
                .catch(err => {
                    console.error('复制失败:', err);
                    showToast('复制失败，请手动复制', 'error');
                });
        } else {
            showToast('请先选择要分享的书籍', 'error');
        }
    });
    
    // 微信分享按钮（模拟）
    document.getElementById('wechat-share-btn').addEventListener('click', () => {
        if (appState.currentSharingBook) {
            const link = generateShareLink(appState.currentSharingBook);
            showToast('请打开微信粘贴链接分享', 'info');
        } else {
            showToast('请先选择要分享的书籍', 'error');
        }
    });
    
    // QQ分享按钮（模拟）
    document.getElementById('qq-share-btn').addEventListener('click', () => {
        if (appState.currentSharingBook) {
            const link = generateShareLink(appState.currentSharingBook);
            showToast('请打开QQ粘贴链接分享', 'info');
        } else {
            showToast('请先选择要分享的书籍', 'error');
        }
    });
    
    elements.decreaseFont.addEventListener('click', () => {
        if (appState.fontSize === 'xl') {
            appState.fontSize = 'lg';
        } else if (appState.fontSize === 'lg') {
            appState.fontSize = 'md';
        } else if (appState.fontSize === 'md') {
            appState.fontSize = 'sm';
        }
        applyFontSize();
        saveReadingProgress();
    });
    
    elements.increaseFont.addEventListener('click', () => {
        if (appState.fontSize === 'sm') {
            appState.fontSize = 'md';
        } else if (appState.fontSize === 'md') {
            appState.fontSize = 'lg';
        } else if (appState.fontSize === 'lg') {
            appState.fontSize = 'xl';
        }
        applyFontSize();
        saveReadingProgress();
    });
    
    // 点击页面其他地方关闭面板
    document.addEventListener('click', (e) => {
        if (!elements.favoritesBtn.contains(e.target) && 
            !elements.favoritesBtnMobile.contains(e.target) && 
            !elements.favoritesPanel.contains(e.target)) {
            elements.favoritesPanel.classList.add('hidden');
        }
        
        if (!elements.shareBtn.contains(e.target) && 
            !elements.shareBtnMobile.contains(e.target) && 
            !elements.sharePanel.contains(e.target)) {
            elements.sharePanel.classList.add('hidden');
        }
    });
    
    // 移动端左右滑动换页
    let touchStartX = 0;
    let touchEndX = 0;
    
    elements.readerContent.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);
    
    elements.readerContent.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);
    
    function handleSwipe() {
        const swipeThreshold = 50;
        
        if (touchEndX - touchStartX > swipeThreshold) {
            goToPrevPage();
        } else if (touchStartX - touchEndX > swipeThreshold) {
            goToNextPage();
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);
