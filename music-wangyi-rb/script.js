// 全局变量
let currentSongList = []; // 当前播放列表
let currentSongIndex = 0; // 当前播放歌曲索引
let isPlaying = false; // 播放状态
let lyricsArray = []; // 歌词数组
let currentSongUrl = ''; // 当前歌曲播放链接
let audioContext = null; // 音频上下文
let currentChartName = '热歌榜'; // 当前榜单名称
let isAutoPlayEnabled = true; // 自动播放开关
let lyricsScrollMode = 'smooth'; // 歌词滚动模式
let isRepeatMode = false; // 单曲循环模式
let autoScrollTimeout = null; // 自动滚动定时器
let isUserScrolling = false; // 用户是否正在滚动
let favoriteSongs = []; // 收藏的歌曲列表
let mediaSession = null; // 媒体会话对象
let currentPlaylistInfo = null; // 当前歌单信息
let currentSearchKeyword = ''; // 当前搜索关键字

// DOM元素
const chartButtons = document.querySelectorAll('.chart-btn');
const songListElement = document.getElementById('song-list');
const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeElement = document.getElementById('current-time');
const totalTimeElement = document.getElementById('total-time');
const qualitySelect = document.getElementById('quality-select');

// 歌曲信息元素
const albumPic = document.getElementById('album-pic');
const songName = document.getElementById('song-name');
const artist = document.getElementById('artist');
const album = document.getElementById('album');
const duration = document.getElementById('duration');
const size = document.getElementById('size');
const format = document.getElementById('format');

// 歌词元素
const lyricsContainer = document.getElementById('lyrics-container');
const lyricsContent = document.querySelector('.lyrics-content');
const toggleLyricsBtn = document.getElementById('toggle-lyrics-btn');

// 选项按钮（移动到歌词区域的按钮）
const favoriteBtn = document.getElementById('favorite-btn');
const shareBtn = document.getElementById('share-btn');
const downloadLyricBtn = document.getElementById('download-lyric-btn');
const downloadSongBtn = document.getElementById('download-song-btn');

// 新增按钮
const repeatBtn = document.getElementById('repeat-btn');

// 新增播放歌单和搜索元素
const playlistInput = document.getElementById('playlist-input');
const playPlaylistBtn = document.getElementById('play-playlist-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

// 弹出面板元素
const playlistPanel = document.getElementById('playlist-panel');
const searchPanel = document.getElementById('search-panel');
const popularPlaylists = document.getElementById('popular-playlists');
const popularSearches = document.getElementById('popular-searches');
const panelOverlay = document.createElement('div');
panelOverlay.className = 'panel-overlay';
document.body.appendChild(panelOverlay);

// 标题元素
const playlistTitle = document.getElementById('playlist-title');
const songCountElement = document.getElementById('song-count');
// 添加榜单描述元素
const listDescriptionElement = document.getElementById('list-description');

// 占位符元素
const songPlaceholder = document.querySelector('.song-placeholder');
const lyricPlaceholder = document.querySelector('.lyric-placeholder');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查URL参数，看是否是分享链接
    const urlParams = new URLSearchParams(window.location.search);
    const sharedSongId = urlParams.get('songId');
    const sharedSongName = urlParams.get('songName');
    const sharedArtist = urlParams.get('artist');
    
    // 初始化MediaSession API
    initMediaSession();
    
    // 监听页面可见性变化
    handleVisibilityChange();
    
    // 定义热门歌单ID数据（统一管理，避免数据重复）
    const popularPlaylistIds = [
	    "7219768967","4985489887","368254901","6829713162","8438624285",
        "12589832642","4897639127","8799505292","12639638645","12767620640","12528734640"
    ];
    
    // 动态生成热门歌单面板中的列表项
    popularPlaylists.innerHTML = '';
    
    // 获取面板头部元素
    const playlistPanelHeader = document.querySelector('#playlist-panel .panel-header');
    
    // 创建关闭按钮
    const closePlaylistBtn = document.createElement('button');
    closePlaylistBtn.className = 'panel-close';
    closePlaylistBtn.innerHTML = '<i class="fas fa-times"></i>';
    closePlaylistBtn.addEventListener('click', () => closePanel(playlistPanel));
    playlistPanelHeader.appendChild(closePlaylistBtn);
    
    popularPlaylistIds.forEach(id => {
        const tag = document.createElement('div');
        tag.className = 'hot-tag';
        tag.textContent = id;
        tag.setAttribute('data-id', id);
        popularPlaylists.appendChild(tag);
    });
    
    // 定义热门搜索关键词数据（统一管理，避免数据重复）
    const popularSearchKeywords = [
        "大潞","烟嗓船长","文夫","马键涛","就是南方凯","程响","郭静","赵乃吉",
        "王佳音","鱼蛋","窝窝","艺凌","洋澜一","任夏","魏佳艺","韩小欠","单依纯",
        "DJ","茶道","古筝","助眠","健身","钢琴","萨克斯","笛子","吉他","二胡","古风","民谣","佛教",
        "治愈房车","经典老歌","70后","80后","90后",        
        "周杰伦","林俊杰","邓紫棋","陈奕迅","汪苏泷","林宥嘉","薛之谦","吴亦凡","刀郎",
        "周深","王子健","Beyond","五月天","伍佰","王一佳","王菲","陶喆",
        "七月上","于春洋","周传雄","张杰","半吨兄弟","张学友",
        "跳楼机","搀扶"
    ];
    
    // 动态生成热门搜索面板中的列表项
    popularSearches.innerHTML = '';
    
    // 获取搜索面板头部元素
    const searchPanelHeader = document.querySelector('#search-panel .panel-header');
    
    // 创建关闭按钮
    const closeSearchBtn = document.createElement('button');
    closeSearchBtn.className = 'panel-close';
    closeSearchBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeSearchBtn.addEventListener('click', () => closePanel(searchPanel));
    searchPanelHeader.appendChild(closeSearchBtn);
    
    popularSearchKeywords.forEach(keyword => {
        const tag = document.createElement('div');
        tag.className = 'hot-tag';
        tag.textContent = keyword;
        tag.setAttribute('data-keyword', keyword);
        popularSearches.appendChild(tag);
    });
    
    // 如果有分享的歌曲信息，则直接播放该歌曲
    if (sharedSongId && sharedSongName && sharedArtist) {
        // 创建一个临时的歌曲对象
        const sharedSong = {
            id: sharedSongId,
            name: decodeURIComponent(sharedSongName),
            artistsname: decodeURIComponent(sharedArtist)
        };
        
        // 设置当前歌曲列表为包含这首歌曲的列表
        currentSongList = [sharedSong];
        currentSongIndex = 0;
        
        // 加载并播放这首歌曲
        loadSongDetails(sharedSongId);
        
        // 更新UI显示
        songName.textContent = sharedSong.name;
        artist.textContent = `艺术家: ${sharedSong.artistsname}`;
        playlistTitle.innerHTML = `分享歌曲 <span id="song-count">(1首)</span>`;
        
        // 隐藏榜单描述
        if (listDescriptionElement) {
            listDescriptionElement.style.display = 'none';
        }
        
        // 取消所有榜单按钮的激活状态
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 渲染歌曲列表
        renderSongList();
        
        // 更新收藏按钮状态
        updateFavoriteButtonState();
    } else {
        // 从本地存储加载收藏的歌曲
        const savedFavorites = localStorage.getItem('favoriteSongs');
        if (savedFavorites) {
            favoriteSongs = JSON.parse(savedFavorites);
        }
        
        // 默认加载歌单里排在首位的歌单
        const firstPlaylistId = popularPlaylistIds[0];
        if (firstPlaylistId) {
            // 设置输入框的值为首个歌单ID
            playlistInput.value = firstPlaylistId;
            // 自动播放首个歌单
            playCustomPlaylist();
        } else {
            // 如果没有歌单ID，则默认加载热歌榜
            loadChartSongs('热歌榜');
        }
        
        // 初始化收藏按钮状态
        updateFavoriteButtonState();
    }
    
    // 绑定榜单按钮事件
    chartButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 更新按钮状态
            chartButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 加载对应榜单
            const listName = this.getAttribute('data-list');
            currentChartName = listName;
            updatePlaylistTitle(listName);
            
            // 根据榜单名称加载不同内容
            if (listName === '我的收藏') {
                renderFavoriteSongs();
            } else {
                loadChartSongs(listName);
            }
        });
    });
    
    // 绑定播放歌单事件
    playPlaylistBtn.addEventListener('click', playCustomPlaylist);
    
    // 绑定搜索事件
    searchBtn.addEventListener('click', searchSongs);
    
    // 绑定回车键搜索事件
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchSongs();
        }
    });
    
    // 为输入框添加通用事件处理
    function setupInputHandlers(inputElement, showPanelFunction) {
        // 焦点事件
        inputElement.addEventListener('focus', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            showPanelFunction();
            setTimeout(() => {
                this.select();
            }, 100);
        });
        
        // 输入事件
        inputElement.addEventListener('input', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
        });
        
        // 点击事件
        inputElement.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            showPanelFunction();
        });
    }

    // 创建通用的输入框处理函数
    function setupGenericInputHandlers(inputElement, panelElement) {
        setupInputHandlers(inputElement, () => showPanel(panelElement, inputElement));
    }

    // 为歌单和搜索输入框设置事件处理
    setupGenericInputHandlers(playlistInput, playlistPanel);
    setupGenericInputHandlers(searchInput, searchPanel);
    
    // 通用面板列表项点击处理函数
    function handlePanelItemClick(e, tagClass, dataAttribute, setInputValue, closeAction) {
        if (e.target.classList.contains(tagClass)) {
            const data = e.target.getAttribute(dataAttribute);
            setInputValue(data);
            closePanels();
            closeAction();
        }
    }

    // 绑定面板列表项点击事件
    popularPlaylists.addEventListener('click', function(e) {
        handlePanelItemClick(
            e, 
            'hot-tag', 
            'data-id', 
            (data) => playlistInput.value = data, 
            playCustomPlaylist
        );
    });

    popularSearches.addEventListener('click', function(e) {
        handlePanelItemClick(
            e, 
            'hot-tag', 
            'data-keyword', 
            (data) => searchInput.value = data, 
            searchSongs
        );
    });

    // 绑定面板背景遮罩点击事件
    panelOverlay.addEventListener('click', closePanels);
    
    // 绑定播放控制事件
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrev);
    nextBtn.addEventListener('click', playNext);
    
    // 绑定新增按钮事件
    repeatBtn.addEventListener('click', toggleRepeat);
    
    // 绑定音频事件
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', handleSongEnd);
    audioPlayer.addEventListener('loadedmetadata', function() {
        totalTimeElement.textContent = formatTime(audioPlayer.duration);
    });
    audioPlayer.addEventListener('canplay', function() {
        // 当音频可以播放时自动播放（如果启用自动播放）
        if (isAutoPlayEnabled && !isPlaying) {
            playAudio();
        }
    });
    progressBar.addEventListener('input', setProgress);
    
    // 绑定音质选择事件
    qualitySelect.addEventListener('change', function() {
        if (currentSongList.length > 0) {
            loadSongDetails(currentSongList[currentSongIndex].id);
        }
    });
    
    // 绑定选项按钮事件（移动到歌词区域的按钮）
    favoriteBtn.addEventListener('click', favoriteSong);
    shareBtn.addEventListener('click', shareSong);
    downloadLyricBtn.addEventListener('click', downloadLyrics);
    downloadSongBtn.addEventListener('click', downloadSong);
    
    // 绑定歌词展开/收起事件
    toggleLyricsBtn.addEventListener('click', toggleLyrics);
    
    // 初始化音频上下文
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Web Audio API 不支持:', e);
    }
    
    // 添加键盘快捷键支持
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // 添加播放列表滚动事件监听器
    const songList = document.getElementById('song-list');
    if (songList) {
        let scrollTimer = null;
        
        songList.addEventListener('scroll', function() {
            // 清除之前的定时器
            if (scrollTimer) {
                clearTimeout(scrollTimer);
            }
            
            // 只有在自动滚动期间才设置用户滚动标志
            if (autoScrollTimeout) {
                isUserScrolling = true;
            }
            
            // 设置一个短暂的定时器来检测滚动结束
            scrollTimer = setTimeout(() => {
                // 用户滚动结束后，3秒后重新启用自动滚动
                setTimeout(() => {
                    isUserScrolling = false;
                }, 3000);
            }, 100); // 100ms的延迟来检测滚动结束
        });
    }

    // 确保输入框按钮正确定位
    positionInputButtons();
    
    // 添加窗口大小改变事件监听器，确保在窗口大小改变时按钮仍然正确定位
    window.addEventListener('resize', positionInputButtons);
});

// 显示面板的通用函数
function showPanel(panel, inputElement) {
    closePanels();
    
    // 获取输入框和面板的位置信息
    const inputRect = inputElement.getBoundingClientRect();
    const panelHeight = 300; // 面板最大高度
    
    // 计算面板应该显示的位置
    let top, left, width;
    
    // 获取视口尺寸
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // 计算面板底部位置
    const panelBottom = inputRect.bottom + panelHeight;
    
    // 判断面板是否会在视口底部溢出
    if (panelBottom > viewportHeight) {
        // 如果会溢出，则向上弹出
        top = (inputRect.top - panelHeight - 5 + window.scrollY);
    } else {
        // 否则向下弹出
        top = (inputRect.bottom + 5 + window.scrollY);
    }
    
    // 设置面板位置
    left = (inputRect.left + window.scrollX);
    width = inputRect.width;
    
    // 设置面板样式
    panel.style.top = top + 'px';
    panel.style.left = left + 'px';
    panel.style.width = width + 'px';
    
    // 在小屏幕上调整面板宽度以适应屏幕
    if (viewportWidth <= 768) {
        panel.style.left = '10px';
        panel.style.width = (viewportWidth - 20) + 'px';
    }
    
    panel.classList.add('active');
    panelOverlay.classList.add('active');
}

// 显示热门歌单面板
function showPlaylistPanel() {
    showPanel(playlistPanel, playlistInput);
}

// 显示热门搜索面板
function showSearchPanel() {
    showPanel(searchPanel, searchInput);
}

// 关闭指定面板
function closePanel(panel) {
    panel.classList.remove('active');
    panelOverlay.classList.remove('active');
    // 重置面板位置样式
    panel.style.top = '';
    panel.style.left = '';
    panel.style.width = '';
}

// 关闭所有面板
function closePanels() {
    closePanel(playlistPanel);
    closePanel(searchPanel);
}

// 键盘快捷键处理函数
function handleKeyboardShortcuts(e) {
    // 防止在输入框中触发快捷键
    if (e.target !== document.body) return;
    
    // 空格键切换播放/暂停
    if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        return;
    }
    
    // 左右箭头键切换歌曲
    if (e.code === 'ArrowLeft') {
        playPrev();
        return;
    }
    
    if (e.code === 'ArrowRight') {
        playNext();
        return;
    }
    
    // 上下箭头键切换歌词展开/收起
    if (e.code === 'ArrowUp') {
        toggleLyrics();
        return;
    }
    
    // R键切换单曲循环
    if (e.code === 'KeyR') {
        toggleRepeat();
        return;
    }
}

// 更新歌曲列表标题
function updatePlaylistTitle(chartName) {
    playlistTitle.innerHTML = `${chartName}列表 <span id="song-count">(0首)</span>`;
    // 更新计数元素引用
    songCountElement.innerHTML = '(0首)';
}

// 通用API调用函数
function callApi(url, loadingMessage, successCallback, errorCallback) {
    // 显示加载状态
    showLoadingState(loadingMessage);
    
    fetch(url)
        .then(response => {
            // 检查响应状态
            if (!response.ok) {
                throw new Error(`网络响应错误: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.code === 200) {
                successCallback(data);
            } else {
                console.error('API调用失败:', data.msg);
                if (errorCallback) {
                    errorCallback(data);
                } else {
                    showErrorState(`API调用失败: ${data.msg || '未知错误'}`);
                }
            }
        })
        .catch(error => {
            console.error('API调用出错:', error);
            showErrorState('网络错误，请稍后重试');
            if (errorCallback) {
                errorCallback(error);
            }
        });
}

// 加载榜单歌曲
function loadChartSongs(listName) {
    // 显示加载状态
    showLoadingState('正在加载榜单...');
    
    // 清除歌单信息（如果不是歌单模式）
    currentPlaylistInfo = null;
    
    // 设置对应榜单按钮为激活状态
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-list') === listName) {
            btn.classList.add('active');
        }
    });
    
    const apiUrl = `https://node.api.xfabe.com/api/wangyi/musicChart?list=${encodeURIComponent(listName)}`;
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                // 更新歌曲列表标题和计数
                playlistTitle.innerHTML = `${listName}列表 <span id="song-count">(${data.data.songs.length}首)</span>`;
                
                // 显示榜单描述信息 - 增强处理不同数据格式
                let listDesc = '';
                if (data.data && data.data.listDesc) {
                    listDesc = data.data.listDesc;
                } else if (data.listDesc) {
                    listDesc = data.listDesc;
                }
                
                if (listDesc && listDescriptionElement) {
                    listDescriptionElement.innerHTML = `<div class='chart-description'>${listDesc}</div>`;
                    listDescriptionElement.style.display = 'block';
                } else if (listDescriptionElement) {
                    listDescriptionElement.style.display = 'none';
                }
                
                // 更新歌曲列表
                currentSongList = data.data.songs;
                renderSongList();
                
                // 如果启用了自动播放且列表不为空，自动播放第一首
                if (isAutoPlayEnabled && currentSongList.length > 0) {
                    playSong(0);
                }
            } else {
                console.error('加载榜单失败:', data.msg);
                showErrorState('加载榜单失败');
            }
        })
        .catch(error => {
            console.error('加载榜单出错:', error);
            showErrorState('网络错误，请稍后重试');
        });
}

// 格式化时间显示（将秒数转换为mm:ss格式）
function formatDuration(seconds) {
    // 如果输入是字符串，尝试转换为数字
    if (typeof seconds === 'string') {
        // 检查是否已经是时间格式（包含冒号）
        if (seconds.includes(':')) {
            return seconds; // 已经是格式化的时间，直接返回
        }
        // 尝试转换为数字
        seconds = parseFloat(seconds);
    }
    
    // 如果不是有效数字，返回默认值
    if (isNaN(seconds) || seconds < 0) {
        return '0:00';
    }
    
    // 如果数值很大，可能是毫秒单位，转换为秒
    if (seconds > 10000) {
        seconds = seconds / 1000;
    }
    
    // 将秒数转换为分钟和秒数
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    // 格式化为mm:ss格式
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// 格式化歌曲时长显示
function formatSongDuration(song) {
    let durationText = '';
    if (song.duration) {
        // 检查duration是否为数字类型，如果是则转换为秒数再格式化
        if (typeof song.duration === 'number') {
            // 如果是毫秒单位，转换为秒
            if (song.duration > 10000) {
                durationText = formatDuration(song.duration / 1000);
            } else {
                durationText = formatDuration(song.duration);
            }
        } else if (typeof song.duration === 'string') {
            // 如果是字符串，先尝试转换为数字
            const durationNum = parseFloat(song.duration);
            if (!isNaN(durationNum)) {
                // 如果是毫秒单位，转换为秒
                if (durationNum > 10000) {
                    durationText = formatDuration(durationNum / 1000);
                } else {
                    durationText = formatDuration(durationNum);
                }
            } else {
                // 如果不能转换为数字，直接使用
                durationText = formatDuration(song.duration);
            }
        }
    }
    
    // 如果没有duration字段但有time字段，使用time字段
    if (!durationText && song.time) {
        durationText = formatDuration(song.time);
    }
    
    return durationText;
}

// 创建歌曲列表项
function createSongListItem(song, index, isFavoriteMode = false) {
    const li = document.createElement('li');
    li.className = 'song-item';
    li.dataset.index = index;
    
    let payElement = '';
    
    if (isFavoriteMode) {
        // 收藏模式显示付费信息
        let payClass = '';
        let payText = '';
        if (song.pay === '付费音乐') {
            payClass = 'pay-song';
            payText = '付费';
        } else if (song.pay === '免费音乐') {
            payClass = 'free-song';
            payText = '免费';
        }
        payElement = song.pay ? `<div class="song-pay ${payClass}">${payText}</div>` : '';
    } else {
        // 其他模式根据当前显示模式决定显示内容
        const isPlaylistMode = currentPlaylistInfo && currentPlaylistInfo.songName;
        const isSearchMode = currentSearchKeyword && currentSearchKeyword.length > 0;
        
        // 获取歌曲时长信息
        const durationText = formatSongDuration(song);
        
        if (isPlaylistMode) {
            // 歌单模式显示时长
            payElement = durationText ? `<div class="song-pay free-song">${durationText}</div>` : '';
        } else if (isSearchMode) {
            // 搜索模式显示时长
            payElement = durationText ? `<div class="song-pay free-song">${durationText}</div>` : '';
        } else {
            // 榜单模式显示付费信息
            let payClass = '';
            let payText = '';
            if (song.pay === '付费音乐') {
                payClass = 'pay-song';
                payText = '付费';
            } else if (song.pay === '免费音乐') {
                payClass = 'free-song';
                payText = '免费';
            }
            payElement = song.pay ? `<div class="song-pay ${payClass}">${payText}</div>` : '';
        }
    }
    
    li.innerHTML = `
        <div class="song-index">${index + 1}</div>
        <div class="song-info">
            <div class="song-title">${song.name}</div>
            <div class="song-artist">${song.artistsname}</div>
        </div>
        ${payElement}
    `;
    
    return li;
}

// 渲染歌曲列表
function renderSongList() {
    // 移除占位符
    if (songPlaceholder) {
        songPlaceholder.remove();
    }
    
    songListElement.innerHTML = '';
    
    // 检查是否是歌单列表状态（通过currentPlaylistInfo是否存在来判断）
    const isPlaylistMode = currentPlaylistInfo && currentPlaylistInfo.songName;
    
    // 检查是否是搜索模式
    const isSearchMode = currentSearchKeyword && currentSearchKeyword.length > 0;
    
    // 如果是歌单模式，确保歌单信息显示正确
    if (isPlaylistMode && listDescriptionElement) {
        let playlistInfoHTML = `
            <div class="playlist-info">
                <img src="${currentPlaylistInfo.songPic}" alt="歌单封面" class="playlist-pic">
                <div class="playlist-details">
                    <strong>歌单名称:</strong> ${currentPlaylistInfo.songName}<br>
                    <strong>创建者:</strong> ${currentPlaylistInfo.userName}
                    <br><strong>个性签名:</strong> <span class="song-artist signature">${currentPlaylistInfo.userSignature || ''}</span>
        `;
        
        playlistInfoHTML += `
                </div>
            </div>
        `;
        
        listDescriptionElement.innerHTML = playlistInfoHTML;
        listDescriptionElement.style.display = 'block';
    }
    // 对于搜索模式和榜单模式，不需要在这里做任何操作，因为它们的内容已经在searchSongs和loadChartSongs函数中设置了
    // 只有在"我的收藏"模式下才需要隐藏描述信息
    else if (!isPlaylistMode && !isSearchMode && currentChartName === '我的收藏' && listDescriptionElement) {
        // 如果是"我的收藏"模式，隐藏描述信息
        listDescriptionElement.style.display = 'none';
    }
    
    currentSongList.forEach((song, index) => {
        const li = createSongListItem(song, index);
        
        li.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            playSong(index);
        });
        
        songListElement.appendChild(li);
    });
}

// 播放指定索引的歌曲
function playSong(index) {
    if (currentSongList.length === 0) return;
    
    // 更新当前歌曲索引
    currentSongIndex = index;
    
    // 加载歌曲详情
    loadSongDetails(currentSongList[index].id);
    
    // 更新活动歌曲的样式
    updateActiveSongStyle();
    
    // 更新收藏按钮状态
    updateFavoriteButtonState();
    
    // 滚动到播放器区域
    const playerSection = document.querySelector('.player-section');
    if (playerSection) {
        // 使用平滑滚动
        playerSection.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
}

// 加载歌曲详情
function loadSongDetails(songId) {
    // 显示加载状态
    songName.textContent = '正在加载...';
    artist.textContent = '艺术家';
    album.textContent = '专辑';
    duration.textContent = '时长: --:--';
    size.textContent = '大小: --MB';
    format.textContent = '格式: --';
    
    const quality = qualitySelect.value;
    const apiUrl = `https://api.cenguigui.cn/api/netease/music_v1.php?id=${songId}&type=json&level=${quality}`;
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // 添加调试信息
            console.log('API返回的数据:', data);
            
            if (data.code === 200) {
                const songInfo = data.data;
                
                // 添加调试信息
                console.log('歌曲信息:', songInfo);
                
                // 保存歌曲播放链接
                currentSongUrl = songInfo.url;
                
                // 更新歌曲信息
                albumPic.src = songInfo.pic || 'https://placehold.co/180x180/1a1a2e/ffffff?text=专辑封面';
                songName.textContent = songInfo.name;
                artist.textContent = `艺术家: ${songInfo.artist}`;
                album.textContent = `专辑: ${songInfo.album}`;
                
                // 格式化时长显示
                const formattedDuration = songInfo.duration ? formatDuration(songInfo.duration) : '--:--';
                duration.textContent = `时长: ${formattedDuration}`;
                
                size.textContent = `大小: ${songInfo.size}`;
                format.textContent = `格式: ${songInfo.format}`;
                
                // 处理歌词
                // 先尝试常见的歌词字段名
                const lyricText = songInfo.lyric || songInfo.lyrics || songInfo.songLyric || '';
                console.log('歌词文本:', lyricText);
                
                if (lyricText) {
                    parseLyrics(lyricText);
                } else {
                    // 如果没有歌词，显示暂无歌词
                    lyricsContent.innerHTML = '<p class="lyric-placeholder">暂无歌词</p>';
                }
                
                // 设置音频源
                if (songInfo.url) {
                    audioPlayer.src = songInfo.url;
                    audioPlayer.load();
                    
                    // 更新媒体会话元数据
                    updateMediaSessionMetadata();
                    
                    // 如果启用了自动播放，则播放音频
                    if (isAutoPlayEnabled) {
                        playAudio();
                    }
                } else {
                    console.error('无法获取歌曲播放链接');
                    songName.textContent = '无法播放';
                }
            } else {
                console.error('加载歌曲详情失败:', data.msg);
                songName.textContent = '加载失败';
            }
        })
        .catch(error => {
            console.error('加载歌曲详情出错:', error);
            songName.textContent = '加载出错';
        });
}

// 解析歌词
function parseLyrics(lyricText) {
    // 移除占位符
    if (lyricPlaceholder) {
        lyricPlaceholder.remove();
    }
    
    lyricsContent.innerHTML = '';
    lyricsArray = [];
    
    if (!lyricText) {
        lyricsContent.innerHTML = '<p class="lyric-placeholder">暂无歌词</p>';
        // 禁用下载歌词按钮
        downloadLyricBtn.disabled = true;
        downloadLyricBtn.style.opacity = '0.5';
        return;
    }
    
    const lines = lyricText.split('\n');
    
    lines.forEach(line => {
        const timeMatch = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/);
        if (timeMatch) {
            const minute = parseInt(timeMatch[1]);
            const second = parseInt(timeMatch[2]);
            const millisecond = parseInt(timeMatch[3]);
            const time = minute * 60 + second + millisecond / 1000;
            
            const text = line.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
            
            if (text) {
                lyricsArray.push({ time, text });
                
                const p = document.createElement('p');
                p.className = 'lyric-line';
                p.dataset.time = time;
                p.textContent = text;
                lyricsContent.appendChild(p);
            }
        }
    });
    
    // 如果没有解析到歌词
    if (lyricsArray.length === 0) {
        lyricsContent.innerHTML = '<p class="lyric-placeholder">暂无歌词</p>';
        // 禁用下载歌词按钮
        downloadLyricBtn.disabled = true;
        downloadLyricBtn.style.opacity = '0.5';
    } else {
        // 启用下载歌词按钮
        downloadLyricBtn.disabled = false;
        downloadLyricBtn.style.opacity = '1';
    }
}

// 切换歌词展开/收起
function toggleLyrics() {
    lyricsContainer.classList.toggle('collapsed');
    const icon = toggleLyricsBtn.querySelector('i');
    if (lyricsContainer.classList.contains('collapsed')) {
        toggleLyricsBtn.innerHTML = '展开 <i class="fas fa-chevron-down"></i>';
    } else {
        toggleLyricsBtn.innerHTML = '收起 <i class="fas fa-chevron-up"></i>';
    }
}

// 更新歌词高亮
function updateLyricsHighlight() {
    const currentTime = audioPlayer.currentTime;
    
    // 移除所有高亮和状态类
    document.querySelectorAll('.lyric-line').forEach(line => {
        line.classList.remove('active', 'prev', 'next');
    });
    
    // 找到当前应该高亮的歌词
    let currentIndex = -1;
    for (let i = lyricsArray.length - 1; i >= 0; i--) {
        if (currentTime >= lyricsArray[i].time) {
            currentIndex = i;
            break;
        }
    }
    
    // 高亮当前歌词并设置前后歌词的状态
    if (currentIndex >= 0) {
        const activeLine = document.querySelector(`.lyric-line[data-time="${lyricsArray[currentIndex].time}"]`);
        if (activeLine) {
            activeLine.classList.add('active');
            
            // 设置前一行歌词状态
            if (currentIndex > 0) {
                const prevLine = document.querySelector(`.lyric-line[data-time="${lyricsArray[currentIndex-1].time}"]`);
                if (prevLine) {
                    prevLine.classList.add('prev');
                }
            }
            
            // 设置后一行歌词状态
            if (currentIndex < lyricsArray.length - 1) {
                const nextLine = document.querySelector(`.lyric-line[data-time="${lyricsArray[currentIndex+1].time}"]`);
                if (nextLine) {
                    nextLine.classList.add('next');
                }
            }
            
            // 检查歌词容器是否可见
            const lyricsRect = lyricsContainer.getBoundingClientRect();
            const isVisible = lyricsRect.top < window.innerHeight && lyricsRect.bottom >= 0;
            
            if (isVisible) {
                // 计算歌词行在歌词容器中的位置
                const containerRect = lyricsContainer.getBoundingClientRect();
                const lineRect = activeLine.getBoundingClientRect();
                
                // 计算需要滚动的距离
                const container = lyricsContainer;
                const scrollTop = container.scrollTop;
                const containerHeight = container.clientHeight;
                const lineTop = lineRect.top - containerRect.top + scrollTop;
                const lineHeight = activeLine.offsetHeight;
                
                // 滚动到中间位置
                container.scrollTop = lineTop - containerHeight / 2 + lineHeight / 2;
            }
        }
    }
}

// 播放音频
function playAudio() {
    // 恢复音频上下文（如果被暂停）
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    audioPlayer.play()
        .then(() => {
            isPlaying = true;
            updatePlayButton();
            
            // 更新媒体会话播放状态
            if (mediaSession) {
                mediaSession.playbackState = 'playing';
                updateMediaSessionPositionState();
            }
        })
        .catch(error => {
            console.error('播放出错:', error);
            isPlaying = false;
            updatePlayButton();
        });
}

// 暂停音频
function pauseAudio() {
    audioPlayer.pause();
    isPlaying = false;
    updatePlayButton();
    
    // 更新媒体会话播放状态
    if (mediaSession) {
        mediaSession.playbackState = 'paused';
    }
}

// 更新播放按钮图标
function updatePlayButton() {
    const icon = playBtn.querySelector('i');
    if (isPlaying) {
        icon.className = 'fas fa-pause';
    } else {
        icon.className = 'fas fa-play';
    }
}

// 检查是否有歌曲可以播放
function hasSongsToPlay() {
    return currentSongList.length > 0;
}

// 切换播放/暂停
function togglePlay() {
    if (!hasSongsToPlay()) return;
    
    if (isPlaying) {
        pauseAudio();
    } else {
        if (!audioPlayer.src) {
            playSong(currentSongIndex);
        } else {
            playAudio();
        }
    }
}

// 播放上一首
function playPrev() {
    if (!hasSongsToPlay()) return;
    
    currentSongIndex = (currentSongIndex - 1 + currentSongList.length) % currentSongList.length;
    playSong(currentSongIndex);
    
    // 更新媒体会话元数据
    updateMediaSessionMetadata();
}

// 播放下一首
function playNext() {
    if (!hasSongsToPlay()) return;
    
    // 如果启用了单曲循环，重新播放当前歌曲
    if (isRepeatMode) {
        playSong(currentSongIndex);
        return;
    }
    
    currentSongIndex = (currentSongIndex + 1) % currentSongList.length;
    playSong(currentSongIndex);
    
    // 更新媒体会话元数据
    updateMediaSessionMetadata();
}

// 重置按钮样式
function resetButtonStyle(button) {
    button.style.background = '';
    button.style.boxShadow = '';
    // 确保过渡效果平滑
    button.style.transition = 'all 0.3s ease';
}

// 使用通用重置按钮函数替代单独的重置函数
// 重置分享按钮样式
function resetShareButton() {
    resetButton(shareBtn, 'fas fa-share-alt');
}

// 重置下载歌词按钮样式
function resetDownloadLyricButton() {
    resetButton(downloadLyricBtn, 'fas fa-download');
}

// 重置下载歌曲按钮样式
function resetDownloadSongButton() {
    resetButton(downloadSongBtn, 'fas fa-music');
}

// 通用重置按钮函数
function resetButton(btn, iconClass, iconElement) {
    if (iconElement) {
        const icon = btn.querySelector('i');
        icon.className = iconClass;
    }
    resetButtonStyle(btn);
    // 3秒后恢复默认状态
    setTimeout(() => {
        btn.style.background = '';
        btn.style.boxShadow = '';
    }, 3000);
}

// 通用按钮反馈函数
function showButtonFeedback(button, iconClass, startColor, endColor, resetIconClass, resetTime = 1000) {
    const icon = button.querySelector('i');
    icon.className = iconClass;
    button.style.background = `linear-gradient(90deg, ${startColor}, ${endColor})`;
    button.style.boxShadow = `0 6px 15px rgba(${getColorRGBA(startColor)}, 0.3)`;
    
    if (resetIconClass) {
        setTimeout(() => resetButton(button, resetIconClass), resetTime);
    }
}

// 将十六进制颜色转换为RGBA值
function getColorRGBA(hexColor) {
    // 移除#号
    const hex = hexColor.replace('#', '');
    
    // 解析RGB值
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
}

// 切换单曲循环模式
function toggleRepeat() {
    isRepeatMode = !isRepeatMode;
    
    // 更新按钮图标
    const icon = repeatBtn.querySelector('i');
    if (isRepeatMode) {
        // 单曲循环时显示旋转图标，但不添加旋转动画
        icon.className = 'fas fa-redo';
        icon.style.color = '#ffffff'; // 使用白色高亮
        icon.style.animation = 'none'; // 确保没有旋转动画
        repeatBtn.title = '关闭单曲循环';
    } else {
        // 关闭单曲循环时显示普通重复图标，使用默认颜色
        icon.className = 'fas fa-repeat';
        icon.style.color = '#a0a0c0'; // 非激活状态使用较暗的颜色
        icon.style.animation = 'none'; // 确保没有旋转动画
        repeatBtn.title = '开启单曲循环';
    }
    
    // 重置按钮样式，使其与播放/暂停按钮保持一致
    resetButtonStyle(repeatBtn);
}

// 处理歌曲播放结束
function handleSongEnd() {
    // 如果启用了单曲循环，重新播放当前歌曲
    if (isRepeatMode) {
        playSong(currentSongIndex);
        return;
    }
    
    // 如果启用了自动播放，播放下一首
    if (isAutoPlayEnabled) {
        playNext();
        return;
    }
    
    // 否则停止播放
    isPlaying = false;
    updatePlayButton();
    
    // 更新媒体会话播放状态
    if (mediaSession) {
        mediaSession.playbackState = 'none';
    }
}

// 更新播放进度
function updateProgress() {
    const currentTime = audioPlayer.currentTime;
    const duration = audioPlayer.duration || 1;
    
    // 更新进度条
    progressBar.value = (currentTime / duration) * 100;
    
    // 更新时间显示
    currentTimeElement.textContent = formatTime(currentTime);
    
    // 更新歌词高亮
    updateLyricsHighlight();
    
    // 更新媒体会话位置状态
    updateMediaSessionPositionState();
}

// 设置播放进度
function setProgress() {
    const duration = audioPlayer.duration || 1;
    const newTime = (progressBar.value / 100) * duration;
    audioPlayer.currentTime = newTime;
}

// 格式化时间
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

// 初始化MediaSession API
function initMediaSession() {
    if ('mediaSession' in navigator) {
        mediaSession = navigator.mediaSession;
        
        // 设置媒体会话的默认元数据（空的）
        mediaSession.metadata = new MediaMetadata({
            title: '网易音乐榜',
            artist: '请选择歌曲',
            album: '网易音乐',
            artwork: [
                { src: 'https://placehold.co/96x96/1a1a2e/ffffff?text=网', sizes: '96x96', type: 'image/png' },
                { src: 'https://placehold.co/128x128/1a1a2e/ffffff?text=网易', sizes: '128x128', type: 'image/png' },
                { src: 'https://placehold.co/192x192/1a1a2e/ffffff?text=网易音乐', sizes: '192x192', type: 'image/png' },
                { src: 'https://placehold.co/256x256/1a1a2e/ffffff?text=网易音乐榜', sizes: '256x256', type: 'image/png' }
            ]
        });
        
        // 设置媒体会话的动作处理程序
        mediaSession.setActionHandler('play', () => {
            if (!isPlaying) {
                playAudio();
            }
        });
        
        mediaSession.setActionHandler('pause', () => {
            if (isPlaying) {
                pauseAudio();
            }
        });
        
        mediaSession.setActionHandler('previoustrack', () => {
            playPrev();
        });
        
        mediaSession.setActionHandler('nexttrack', () => {
            playNext();
        });
        
        mediaSession.setActionHandler('seekbackward', (details) => {
            const seekOffset = details.seekOffset || 10;
            audioPlayer.currentTime = Math.max(audioPlayer.currentTime - seekOffset, 0);
        });
        
        mediaSession.setActionHandler('seekforward', (details) => {
            const seekOffset = details.seekOffset || 10;
            audioPlayer.currentTime = Math.min(audioPlayer.currentTime + seekOffset, audioPlayer.duration);
        });
        
        mediaSession.setActionHandler('seekto', (details) => {
            if (details.fastSeek && 'fastSeek' in audioPlayer) {
                audioPlayer.fastSeek(details.seekTime);
            } else {
                audioPlayer.currentTime = details.seekTime;
            }
        });
        
        console.log('MediaSession API initialized');
    } else {
        console.log('MediaSession API not supported');
    }
}

// 更新媒体会话元数据
function updateMediaSessionMetadata() {
    if (!mediaSession || currentSongList.length === 0) return;
    
    const currentSong = currentSongList[currentSongIndex];
    
    // 获取当前显示的专辑封面图片URL
    const albumPicUrl = albumPic.src || currentSong.pic || 'https://placehold.co/180x180/1a1a2e/ffffff?text=专辑封面';
    
    // 更新媒体会话元数据
    mediaSession.metadata = new MediaMetadata({
        title: currentSong.name || '未知歌曲',
        artist: currentSong.artistsname || '未知艺术家',
        album: currentSong.album || '未知专辑',
        artwork: [
            { src: albumPicUrl, sizes: '96x96', type: 'image/png' },
            { src: albumPicUrl, sizes: '128x128', type: 'image/png' },
            { src: albumPicUrl, sizes: '192x192', type: 'image/png' },
            { src: albumPicUrl, sizes: '256x256', type: 'image/png' },
            { src: albumPicUrl, sizes: '384x384', type: 'image/png' },
            { src: albumPicUrl, sizes: '512x512', type: 'image/png' }
        ]
    });
}

// 更新媒体会话播放状态
function updateMediaSessionPositionState() {
    if (!mediaSession || !audioPlayer.src) return;
    
    // 更新位置状态
    if ('setPositionState' in mediaSession) {
        mediaSession.setPositionState({
            duration: audioPlayer.duration || 0,
            playbackRate: audioPlayer.playbackRate,
            position: audioPlayer.currentTime
        });
    }
}

// 处理页面可见性变化
function handleVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // 页面隐藏时的操作
            console.log('页面已隐藏');
        } else {
            // 页面显示时的操作
            console.log('页面已显示');
            // 如果之前正在播放，则继续播放
            if (isPlaying && audioPlayer.src) {
                playAudio();
            }
        }
    });
}

// 更新活动歌曲的样式
function updateActiveSongStyle() {
    // 移除所有歌曲项的播放样式
    document.querySelectorAll('.song-item').forEach(item => {
        item.classList.remove('playing');
    });
    
    // 为当前播放的歌曲项添加播放样式
    const currentSongItem = document.querySelector(`.song-item[data-index="${currentSongIndex}"]`);
    if (currentSongItem) {
        currentSongItem.classList.add('playing');
        
        // 自动滚动到列表前3位
        const songList = document.getElementById('song-list');
        if (songList) {
            // 计算需要滚动的位置，确保当前歌曲在前3位显示
            const itemHeight = currentSongItem.offsetHeight;
            const scrollTop = Math.max(0, currentSongIndex * itemHeight - itemHeight * 2);
            songList.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
        }
    }
}

// 渲染收藏歌曲列表
function renderFavoriteSongs() {
    // 移除占位符
    if (songPlaceholder) {
        songPlaceholder.remove();
    }
    
    // 清除歌单信息（如果不是歌单模式）
    currentPlaylistInfo = null;
    
    // 隐藏榜单描述
    if (listDescriptionElement) {
        listDescriptionElement.style.display = 'none';
    }
    
    // 取消榜单按钮的激活状态
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    songListElement.innerHTML = '';
    
    if (favoriteSongs.length === 0) {
        // 如果没有收藏的歌曲，显示提示信息
        const li = document.createElement('li');
        li.className = 'song-item';
        li.innerHTML = `
            <div class="song-info">
                <div class="song-title">暂无收藏歌曲</div>
                <div class="song-artist">请先收藏一些歌曲</div>
            </div>
        `;
        songListElement.appendChild(li);
        return;
    }
    
    favoriteSongs.forEach((song, index) => {
        const li = createSongListItem(song, index, true);
        
        li.addEventListener('click', function() {
            // 创建一个临时的歌曲列表用于播放
            currentSongList = favoriteSongs;
            const index = parseInt(this.dataset.index);
            playSong(index);
        });
        
        songListElement.appendChild(li);
    });
}

// 收藏歌曲功能
function favoriteSong() {
    if (!hasSongsToPlay()) return;
    
    const currentSong = currentSongList[currentSongIndex];
    
    // 检查歌曲是否已经收藏
    const isAlreadyFavorited = favoriteSongs.some(song => song.id === currentSong.id);
    
    if (isAlreadyFavorited) {
        // 如果已经收藏，则取消收藏
        favoriteSongs = favoriteSongs.filter(song => song.id !== currentSong.id);
        // 移除alert弹窗，仅通过按钮状态变化提示用户
        
        // 更新按钮图标，不添加背景色和边框
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i> 收藏';
        resetButtonStyle(favoriteBtn);
    } else {
        // 如果未收藏，则添加到收藏列表
        favoriteSongs.push(currentSong);
        // 移除alert弹窗，仅通过按钮状态变化提示用户
        
        // 更新按钮图标，不添加背景色和边框
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> 收藏';
        resetButtonStyle(favoriteBtn);
    }
    
    // 保存到本地存储
    localStorage.setItem('favoriteSongs', JSON.stringify(favoriteSongs));
}

// 分享歌曲
function shareSong() {
    if (!hasSongsToPlay()) return;
    
    const currentSong = currentSongList[currentSongIndex];
    // 创建包含歌曲信息的URL
    const shareUrl = `${window.location.origin}${window.location.pathname}?songId=${encodeURIComponent(currentSong.id)}&songName=${encodeURIComponent(currentSong.name)}&artist=${encodeURIComponent(currentSong.artistsname)}`;
    const shareText = `【Ajeo提示】请前往浏览器粘贴<链接>收听！\n${currentSong.name} - ${currentSong.artistsname}\n【链接】：\n${shareUrl}`;
    
    // 滚动到当前播放的歌曲项
    const currentSongItem = document.querySelector(`.song-item[data-index="${currentSongIndex}"]`);
    if (currentSongItem) {
        currentSongItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // 添加视觉反馈，突出显示当前分享的歌曲
    if (currentSongItem) {
        currentSongItem.style.background = 'rgba(79, 172, 254, 0.3)';
        setTimeout(() => {
            currentSongItem.style.background = '';
        }, 2000);
    }
    
    // 无论是否支持Web Share API，都直接复制到剪贴板
    // 这样可以确保在所有情况下都有明确的用户反馈
    copyToClipboard(shareText);
}

// 复制文本到剪贴板
function copyToClipboard(text) {
    // 首先尝试使用现代剪贴板API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => {
                // 复制成功
                showCopySuccess();
            })
            .catch(err => {
                console.error('现代剪贴板API复制失败:', err);
                // 降级到传统方法
                fallbackCopyTextToClipboard(text);
            });
    } else {
        // 不支持现代剪贴板API，直接使用传统方法
        fallbackCopyTextToClipboard(text);
    }
}

// 显示复制成功提示
function showCopySuccess() {
    alert('已复制请到微信粘贴分享');
    // 添加视觉反馈
    showButtonFeedback(shareBtn, 'fas fa-check', '#51cf66', '#8ce99a', 'fas fa-share-alt');
}

// 传统复制方法
function fallbackCopyTextToClipboard(text) {
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            console.log('传统方法复制成功');
            showCopySuccess();
        } else {
            console.error('传统方法复制失败');
            // 即使复制失败，也显示提示信息
            alert('已复制请到微信粘贴分享');
            showButtonFeedback(shareBtn, 'fas fa-check', '#51cf66', '#8ce99a', 'fas fa-share-alt');
        }
    } catch (err) {
        document.body.removeChild(textArea);
        console.error('传统方法出现异常:', err);
        // 出现异常时，仍然显示提示信息
        alert('已复制请到微信粘贴分享');
        showButtonFeedback(shareBtn, 'fas fa-check', '#51cf66', '#8ce99a', 'fas fa-share-alt');
    }
}

// 下载歌词
function downloadLyrics() {
    if (!hasSongsToPlay()) return;
    
    const currentSong = currentSongList[currentSongIndex];
    const lyricsElements = document.querySelectorAll('.lyric-line');
    
    console.log('歌词元素数量:', lyricsElements.length);
    
    if (lyricsElements.length === 0) {
        alert('暂无歌词可下载');
        return;
    }
    
    const lyrics = Array.from(lyricsElements)
        .map(line => line.textContent)
        .join('\n');
    
    console.log('歌词内容:', lyrics);
    
    const blob = new Blob([lyrics], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSong.name}-歌词.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // 添加视觉反馈
    showButtonFeedback(downloadLyricBtn, 'fas fa-check', '#51cf66', '#8ce99a', 'fas fa-download');
}

// 下载歌曲
function downloadSong() {
    if (!hasSongsToPlay()) return;
    
    const currentSong = currentSongList[currentSongIndex];
    
    // 使用真实的播放链接下载歌曲
    if (currentSongUrl) {
        const a = document.createElement('a');
        a.href = currentSongUrl;
        a.download = `${currentSong.name}.mp3`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // 添加视觉反馈
        showButtonFeedback(downloadSongBtn, 'fas fa-check', '#51cf66', '#8ce99a', 'fas fa-music');
    } else {
        alert('暂无下载链接');
    }
}

// 显示加载状态的通用函数
function showLoadingState(message) {
    if (songPlaceholder) {
        songPlaceholder.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> ${message}</p>`;
    }
}

// 显示错误状态的通用函数
function showErrorState(message) {
    if (songPlaceholder) {
        songPlaceholder.innerHTML = `<p><i class="fas fa-exclamation-circle"></i> ${message}</p>`;
    }
}

// 搜索歌曲
function searchSongs() {
    const keyword = searchInput.value.trim();
    
    if (!keyword) {
        alert('请输入搜索关键字');
        return;
    }
    
    // 保存当前搜索关键字
    currentSearchKeyword = keyword;
    
    // 显示加载状态
    showLoadingState('正在搜索...');
    
    // 清除歌单信息（如果不是歌单模式）
    currentPlaylistInfo = null;
    
    // 取消榜单按钮的激活状态
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const apiUrl = `https://node.api.xfabe.com/api/wangyi/search?search=${encodeURIComponent(keyword)}&limit=100`;
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                // 更新歌曲列表标题和计数
                playlistTitle.innerHTML = `搜索列表 <span id="song-count">(${data.data.songs.length}首)</span>`;
                
                // 显示搜索关键字信息
                if (listDescriptionElement) {
                    listDescriptionElement.innerHTML = `<div class='search-description'>搜索关键字: ${keyword}</div>`;
                    listDescriptionElement.style.display = 'block';
                }
                
                // 更新歌曲列表
                currentSongList = data.data.songs;
                renderSongList();
                
                // 如果启用了自动播放且列表不为空，自动播放第一首
                if (isAutoPlayEnabled && currentSongList.length > 0) {
                    playSong(0);
                }
            } else {
                console.error('搜索失败:', data.msg);
                showErrorState('搜索失败');
            }
        })
        .catch(error => {
            console.error('搜索出错:', error);
            showErrorState('网络错误，请稍后重试');
        });
}

// 播放自定义歌单
function playCustomPlaylist() {
    const playlistId = playlistInput.value.trim();
    
    if (!playlistId) {
        alert('请输入歌单ID');
        return;
    }
    
    // 显示加载状态
    showLoadingState('正在加载歌单...');
    
    // 取消榜单按钮的激活状态
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const apiUrl = `https://node.api.xfabe.com/api/wangyi/userSongs?uid=${playlistId}&limit=100`;
    
    fetch(apiUrl)
        .then(response => {
            // 检查响应状态
            if (!response.ok) {
                throw new Error(`网络响应错误: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.code === 200) {
                // 保存歌单信息
                currentPlaylistInfo = {
                    songPic: data.data.songPic,
                    songName: data.data.songName,
                    userName: data.data.userName,
                    userSignature: data.data.userSignature  // 添加用户签名信息
                };
                
                // 更新歌曲列表标题和计数
                playlistTitle.innerHTML = `歌单列表 <span id="song-count">(${data.data.songs.length}首)</span>`;
                
                // 显示歌单信息
                if (listDescriptionElement) {
                    let playlistInfoHTML = `
                        <div class="playlist-info">
                            <img src="${data.data.songPic}" alt="歌单封面" class="playlist-pic">
                            <div class="playlist-details">
                                <strong>歌单名称:</strong> ${data.data.songName}<br>
                                <strong>创建者:</strong> ${data.data.userName}
                                <br><strong>个性签名:</strong> <span class="song-artist signature">${data.data.userSignature || ''}</span>
                    `;
                    
                    playlistInfoHTML += `
                            </div>
                        </div>
                    `;
                    
                    listDescriptionElement.innerHTML = playlistInfoHTML;
                    listDescriptionElement.style.display = 'block';
                }
                
                // 更新歌曲列表
                currentSongList = data.data.songs;
                renderSongList();
                
                // 如果启用了自动播放且列表不为空，自动播放第一首
                if (isAutoPlayEnabled && currentSongList.length > 0) {
                    playSong(0);
                } else if (currentSongList.length === 0) {
                    // 如果歌单为空
                    showErrorState('该歌单为空');
                }
            } else {
                console.error('加载歌单失败:', data.msg);
                showErrorState(`加载歌单失败: ${data.msg || '未知错误'}`);
                // 显示更明确的错误消息
                alert(`加载歌单失败: ${data.msg || '歌单不存在或无法访问'}`);
            }
        })
        .catch(error => {
            console.error('加载歌单出错:', error);
            showErrorState('网络错误，请稍后重试');
            // 显示更明确的错误消息
            alert(`加载歌单出错: ${error.message || '网络连接失败，请检查网络设置'}`);
        });
}

// 更新收藏按钮状态
function updateFavoriteButtonState() {
    if (!hasSongsToPlay()) return;
    
    const currentSong = currentSongList[currentSongIndex];
    const isAlreadyFavorited = favoriteSongs.some(song => song.id === currentSong.id);
    
    // 更新按钮图标和样式
    if (isAlreadyFavorited) {
        // 如果已收藏，显示实心心形图标
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> 收藏';
        favoriteBtn.style.background = 'linear-gradient(90deg, #ff7eee, #4facfe)';
    } else {
        // 如果未收藏，显示空心心形图标
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i> 收藏';
        favoriteBtn.style.background = '';
    }
    
    resetButtonStyle(favoriteBtn);
}

// 添加函数确保输入框按钮正确定位
function positionInputButtons() {
    // 获取所有输入框按钮
    const inputButtons = document.querySelectorAll('.input-button');
    
    // 为每个按钮设置定位样式
    inputButtons.forEach(button => {
        button.style.position = 'absolute';
        button.style.right = '5px';
        button.style.top = '50%';
        button.style.transform = 'translateY(-50%)';
        button.style.width = '40px';
        button.style.height = '40px';
        button.style.borderRadius = '50%';
        button.style.border = 'none';
        button.style.background = 'transparent';
        button.style.color = '#f0f0f0';
        button.style.fontSize = '1.5rem';
        button.style.cursor = 'pointer';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.zIndex = '9999';
        button.style.margin = '0';
        button.style.padding = '0';
        button.style.boxShadow = 'none';
    });
}
