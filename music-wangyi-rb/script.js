// 全局变量
let currentSongList = []; // 当前播放列表
let currentSongIndex = 0; // 当前播放歌曲索引
let isPlaying = false; // 播放状态
let lyricsArray = []; // 歌词数组
let currentSongUrl = ''; // 当前歌曲播放链接
let audioContext = null; // 音频上下文
let currentChartName = '热歌榜'; // 当前榜单名称
let isAutoPlayEnabled = true; // 自动播放开关
let isLyricsDarkMode = false; // 歌词深色模式
let lyricsScrollMode = 'smooth'; // 歌词滚动模式
let isRepeatMode = false; // 单曲循环模式
let isMuted = false; // 静音状态
let lastVolume = 1; // 上次音量
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
const lyricsModeBtn = document.getElementById('lyrics-mode-btn');

// 选项按钮（移动到歌词区域的按钮）
const favoriteBtn = document.getElementById('favorite-btn');
const shareBtn = document.getElementById('share-btn');
const downloadLyricBtn = document.getElementById('download-lyric-btn');
const downloadSongBtn = document.getElementById('download-song-btn');

// 新增按钮
const repeatBtn = document.getElementById('repeat-btn');
const muteBtn = document.getElementById('mute-btn');

// 新增播放歌单和搜索元素
const playlistInput = document.getElementById('playlist-input');
const playPlaylistBtn = document.getElementById('play-playlist-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

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
    // 从本地存储加载收藏的歌曲
    const savedFavorites = localStorage.getItem('favoriteSongs');
    if (savedFavorites) {
        favoriteSongs = JSON.parse(savedFavorites);
    }
    
    // 初始化MediaSession API
    initMediaSession();
    
    // 监听页面可见性变化
    handleVisibilityChange();
    
    // 默认加载热歌榜
    loadChartSongs('热歌榜');
    
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
    
    // 为输入框添加自动全选功能
    playlistInput.addEventListener('focus', function() {
        setTimeout(() => {
            this.select();
        }, 100);
    });
    
    searchInput.addEventListener('focus', function() {
        setTimeout(() => {
            this.select();
        }, 100);
    });
    
    // 绑定播放控制事件
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrev);
    nextBtn.addEventListener('click', playNext);
    
    // 绑定新增按钮事件
    repeatBtn.addEventListener('click', toggleRepeat);
    muteBtn.addEventListener('click', toggleMute);
    
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
    
    // 绑定歌词模式切换事件
    lyricsModeBtn.addEventListener('click', toggleLyricsMode);
    
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
});

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
    
    if (e.code === 'ArrowDown') {
        toggleLyricsMode();
        return;
    }
    
    // R键切换单曲循环，M键切换静音
    if (e.code === 'KeyR') {
        toggleRepeat();
        return;
    }
    
    if (e.code === 'KeyM') {
        toggleMute();
        return;
    }
}

// 更新歌曲列表标题
function updatePlaylistTitle(chartName) {
    playlistTitle.innerHTML = `${chartName}列表 <span id="song-count">(0首)</span>`;
    // 更新计数元素引用
    songCountElement.innerHTML = '(0首)';
}

// 加载榜单歌曲
function loadChartSongs(listName) {
    // 显示加载状态
    if (songPlaceholder) {
        songPlaceholder.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 正在加载榜单...</p>';
    }
    
    // 清除歌单信息（如果不是歌单模式）
    currentPlaylistInfo = null;
    
    const apiUrl = `https://node.api.xfabe.com/api/wangyi/musicChart?list=${encodeURIComponent(listName)}`;
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                // 更新歌曲列表标题和计数
                playlistTitle.innerHTML = `${listName}列表 <span id="song-count">(${data.data.songs.length}首)</span>`;
                
                // 显示榜单描述信息
                if (data.data.listDesc && listDescriptionElement) {
                    listDescriptionElement.innerHTML = `<div class='chart-description'>${data.data.listDesc}</div>`;
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
                if (songPlaceholder) {
                    songPlaceholder.innerHTML = '<p><i class="fas fa-exclamation-circle"></i> 加载榜单失败</p>';
                }
            }
        })
        .catch(error => {
            console.error('加载榜单出错:', error);
            if (songPlaceholder) {
                songPlaceholder.innerHTML = '<p><i class="fas fa-exclamation-circle"></i> 网络错误，请稍后重试</p>';
            }
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
    } else if (!isPlaylistMode && listDescriptionElement) {
        // 如果不是歌单模式，隐藏歌单信息
        listDescriptionElement.style.display = 'none';
    }
    
    currentSongList.forEach((song, index) => {
        const li = document.createElement('li');
        li.className = 'song-item';
        li.dataset.index = index;
        
        // 获取歌曲时长信息（如果存在duration字段）
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
        
        // 根据不同的模式决定显示什么内容
        let payElement = '';
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
        
        li.innerHTML = `
            <div class="song-index">${index + 1}</div>
            <div class="song-info">
                <div class="song-title">${song.name}</div>
                <div class="song-artist">${song.artistsname}</div>
            </div>
            ${payElement}
        `;
        
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

// 切换歌词显示模式（深色/浅色）
function toggleLyricsMode() {
    isLyricsDarkMode = !isLyricsDarkMode;
    lyricsContainer.classList.toggle('dark-mode', isLyricsDarkMode);
    
    const icon = lyricsModeBtn.querySelector('i');
    if (isLyricsDarkMode) {
        icon.className = 'fas fa-sun';
        lyricsModeBtn.title = '切换到浅色模式';
    } else {
        icon.className = 'fas fa-moon';
        lyricsModeBtn.title = '切换到深色模式';
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

// 重置分享按钮样式
function resetShareButton() {
    const icon = shareBtn.querySelector('i');
    icon.className = 'fas fa-share-alt';
    resetButtonStyle(shareBtn);
    // 3秒后恢复默认状态
    setTimeout(() => {
        shareBtn.style.background = '';
        shareBtn.style.boxShadow = '';
    }, 3000);
}

// 重置下载歌词按钮样式
function resetDownloadLyricButton() {
    const icon = downloadLyricBtn.querySelector('i');
    icon.className = 'fas fa-download';
    resetButtonStyle(downloadLyricBtn);
    // 3秒后恢复默认状态
    setTimeout(() => {
        downloadLyricBtn.style.background = '';
        downloadLyricBtn.style.boxShadow = '';
    }, 3000);
}

// 重置下载歌曲按钮样式
function resetDownloadSongButton() {
    const icon = downloadSongBtn.querySelector('i');
    icon.className = 'fas fa-music';
    resetButtonStyle(downloadSongBtn);
    // 3秒后恢复默认状态
    setTimeout(() => {
        downloadSongBtn.style.background = '';
        downloadSongBtn.style.boxShadow = '';
    }, 3000);
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

// 切换单曲循环模式
function toggleRepeat() {
    isRepeatMode = !isRepeatMode;
    
    if (isRepeatMode) {
        repeatBtn.style.background = 'linear-gradient(90deg, #ff7eee, #4facfe)';
        repeatBtn.style.boxShadow = '0 8px 25px rgba(79, 172, 254, 0.4)';
        repeatBtn.title = '关闭单曲循环';
    } else {
        resetButtonStyle(repeatBtn);
        repeatBtn.title = '开启单曲循环';
    }
    
    // 更新按钮图标
    const icon = repeatBtn.querySelector('i');
    if (isRepeatMode) {
        icon.className = 'fas fa-repeat';
        icon.style.color = '#ffffff';
    } else {
        icon.className = 'fas fa-repeat';
        icon.style.color = '#a0a0c0'; // 非激活状态使用较暗的颜色
    }
}

// 切换静音状态
function toggleMute() {
    isMuted = !isMuted;
    
    if (isMuted) {
        // 保存当前音量并静音
        lastVolume = audioPlayer.volume;
        audioPlayer.volume = 0;
        muteBtn.title = '取消静音';
        
        // 更新按钮图标
        const icon = muteBtn.querySelector('i');
        icon.className = 'fas fa-volume-mute';
    } else {
        // 恢复音量
        audioPlayer.volume = lastVolume;
        muteBtn.title = '静音';
        
        // 更新按钮图标
        const icon = muteBtn.querySelector('i');
        icon.className = 'fas fa-volume-up';
    }
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
    
    // 更新媒体会话元数据
    mediaSession.metadata = new MediaMetadata({
        title: currentSong.name || '未知歌曲',
        artist: currentSong.artistsname || '未知艺术家',
        album: currentSong.album || '未知专辑',
        artwork: [
            { src: currentSong.pic || 'https://placehold.co/96x96/1a1a2e/ffffff?text=网', sizes: '96x96', type: 'image/png' },
            { src: currentSong.pic || 'https://placehold.co/128x128/1a1a2e/ffffff?text=网易', sizes: '128x128', type: 'image/png' },
            { src: currentSong.pic || 'https://placehold.co/192x192/1a1a2e/ffffff?text=网易音乐', sizes: '192x192', type: 'image/png' },
            { src: currentSong.pic || 'https://placehold.co/256x256/1a1a2e/ffffff?text=网易音乐榜', sizes: '256x256', type: 'image/png' },
            { src: currentSong.pic || 'https://placehold.co/384x384/1a1a2e/ffffff?text=网易音乐榜', sizes: '384x384', type: 'image/png' },
            { src: currentSong.pic || 'https://placehold.co/512x512/1a1a2e/ffffff?text=网易音乐榜', sizes: '512x512', type: 'image/png' }
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
        const li = document.createElement('li');
        li.className = 'song-item';
        li.dataset.index = index;
        
        // 根据付费状态设置不同颜色
        let payClass = '';
        let payText = '';
        if (song.pay === '付费音乐') {
            payClass = 'pay-song';
            payText = '付费';
        } else if (song.pay === '免费音乐') {
            payClass = 'free-song';
            payText = '免费';
        }
        
        li.innerHTML = `
            <div class="song-index">${index + 1}</div>
            <div class="song-info">
                <div class="song-title">${song.name}</div>
                <div class="song-artist">${song.artistsname}</div>
            </div>
            <div class="song-pay ${payClass}">${payText}</div>
        `;
        
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
        alert(`已取消收藏歌曲: ${currentSong.name}`);
        
        // 更新按钮图标
        resetButton(favoriteBtn, 'fas fa-heart');
    } else {
        // 如果未收藏，则添加到收藏列表
        favoriteSongs.push(currentSong);
        alert(`已收藏歌曲: ${currentSong.name}`);
        
        // 添加视觉反馈
        const icon = favoriteBtn.querySelector('i');
        icon.className = 'fas fa-heart';
        favoriteBtn.style.background = 'linear-gradient(90deg, #ff7eee, #4facfe)';
        favoriteBtn.style.boxShadow = '0 6px 15px rgba(79, 172, 254, 0.3)';
    }
    
    // 保存到本地存储
    localStorage.setItem('favoriteSongs', JSON.stringify(favoriteSongs));
    
    // 3秒后恢复按钮样式
    setTimeout(() => {
        if (!favoriteSongs.some(song => song.id === currentSong.id)) {
            // 如果未收藏，恢复默认样式
            resetButtonStyle(favoriteBtn);
        }
    }, 3000);
}

// 分享歌曲
function shareSong() {
    if (!hasSongsToPlay()) return;
    
    const currentSong = currentSongList[currentSongIndex];
    const shareText = `我正在听 ${currentSong.name} - ${currentSong.artistsname}，快来一起欣赏吧！`;
    
    if (navigator.share) {
        navigator.share({
            title: '分享歌曲',
            text: shareText,
            url: window.location.href
        }).catch(error => console.log('分享取消或失败:', error));
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            alert('分享链接已复制到剪贴板');
            
            // 添加视觉反馈
            const icon = shareBtn.querySelector('i');
            icon.className = 'fas fa-check';
            shareBtn.style.background = 'linear-gradient(90deg, #51cf66, #8ce99a)';
            shareBtn.style.boxShadow = '0 6px 15px rgba(81, 207, 102, 0.3)';
            
            setTimeout(() => resetButton(shareBtn, 'fas fa-share-alt'), 1000);
        });
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
    const icon = downloadLyricBtn.querySelector('i');
    icon.className = 'fas fa-check';
    downloadLyricBtn.style.background = 'linear-gradient(90deg, #51cf66, #8ce99a)';
    downloadLyricBtn.style.boxShadow = '0 6px 15px rgba(81, 207, 102, 0.3)';
    
    setTimeout(() => resetButton(downloadLyricBtn, 'fas fa-download'), 1000);
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
        const icon = downloadSongBtn.querySelector('i');
        icon.className = 'fas fa-check';
        downloadSongBtn.style.background = 'linear-gradient(90deg, #51cf66, #8ce99a)';
        downloadSongBtn.style.boxShadow = '0 6px 15px rgba(81, 207, 102, 0.3)';
        
        setTimeout(() => resetButton(downloadSongBtn, 'fas fa-music'), 1000);
    } else {
        alert('暂无下载链接');
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
    if (songPlaceholder) {
        songPlaceholder.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 正在搜索...</p>';
    }
    
    // 清除歌单信息（如果不是歌单模式）
    currentPlaylistInfo = null;
    
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
                if (songPlaceholder) {
                    songPlaceholder.innerHTML = '<p><i class="fas fa-exclamation-circle"></i> 搜索失败</p>';
                }
            }
        })
        .catch(error => {
            console.error('搜索出错:', error);
            if (songPlaceholder) {
                songPlaceholder.innerHTML = '<p><i class="fas fa-exclamation-circle"></i> 网络错误，请稍后重试</p>';
            }
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
    if (songPlaceholder) {
        songPlaceholder.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 正在加载歌单...</p>';
    }
    
    const apiUrl = `https://node.api.xfabe.com/api/wangyi/userSongs?uid=${playlistId}&limit=100`;
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                // 保存歌单信息
                currentPlaylistInfo = {
                    songPic: data.data.songPic,
                    songName: data.data.songName,
                    userName: data.data.userName,
                    userSignature: data.data.userSignature  // 添加用户签名信息
                };
                
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
                }
            } else {
                console.error('加载歌单失败:', data.msg);
                if (songPlaceholder) {
                    songPlaceholder.innerHTML = '<p><i class="fas fa-exclamation-circle"></i> 加载歌单失败</p>';
                }
            }
        })
        .catch(error => {
            console.error('加载歌单出错:', error);
            if (songPlaceholder) {
                songPlaceholder.innerHTML = '<p><i class="fas fa-exclamation-circle"></i> 网络错误，请稍后重试</p>';
            }
        });
}
