// script.js
// 热门搜索标签
const hotKeywords = [
 "王佳音", "鱼蛋", "艺凌", "洋澜","任夏", "魏佳艺", "韩小欠", "单依纯","DJ", "王晴",
   "喝茶","古筝", "助眠","热歌","热门", "新歌","飙升","流行",
  "治愈房车","周杰伦", "林俊杰", "邓紫棋", "陈奕迅", "汪苏泷",
  "经典老歌", "薛之谦", "吴亦凡", "刀郎", "跳楼机",
  "窝窝","周深", "王子健", "Beyond",
  "五月天", "伍佰", "王一佳", "王菲", "陶喆",
  "七月上", "于春洋", "搀扶", "周传雄",
  "张杰", "半吨兄弟", "张学友"
];

// DOM元素
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const hotSearchPanel = document.getElementById('hotSearchPanel');
const hotTags = document.getElementById('hotTags');
const albumCover = document.getElementById('albumCover');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const loopBtn = document.getElementById('loopBtn');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const lyricsContainer = document.getElementById('lyricsContainer');
const lyricsContent = document.getElementById('lyricsContent');
const expandLyrics = document.getElementById('expandLyrics');
const resultsList = document.getElementById('resultsList');
const downloadLyricsBtn = document.getElementById('downloadLyricsBtn');
const downloadSongBtn = document.getElementById('downloadSongBtn');
const detailBtn = document.getElementById('detailBtn');
const muteBtn = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider');

// 当前歌曲状态
let currentSong = null;
let currentSearchResults = [];
let lyricsExpanded = false;
let currentLyrics = "";
let loopMode = false;
let isMuted = false;
let lastVolume = 1;
let baseApiUrl = "";
let currentBlobUrl = null; // 存储当前的Blob URL

// 备用图片URL
const FALLBACK_IMAGE = '../mm.jpg';

// 代理服务器列表（优先使用自建代理，然后是公共代理）
const PROXY_SERVERS = [
  'https://api.codetabs.com/v1/proxy?quest=', // 新增代理
  'https://jeotv.dpdns.org/',
  'https://api.allorigins.win/raw?url='
];

// 将任意图片 URL 转换为 HTTPS 代理地址
function getSecureImageUrl(originalUrl) {
  if (!originalUrl) return '';
  if (originalUrl.startsWith('https://')) return originalUrl;
  return `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl.replace(/^https?:\/\//, ''))}`;
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function () {
  // 应用深色主题
  document.documentElement.classList.add('dark-theme');
  
  renderHotTags();
  searchMusic('窝窝');

  // 循环按钮状态更新
  loopBtn.addEventListener('click', () => {
    loopMode = !loopMode;
    loopBtn.classList.toggle('active', loopMode);
  });
  
  // 静音按钮状态更新
  muteBtn.addEventListener('click', toggleMute);
  
  // 初始化按钮状态
  loopBtn.classList.toggle('active', loopMode);
  muteBtn.classList.toggle('muted', isMuted);

  // 事件监听器
  searchInput.addEventListener('focus', () => {
    hotSearchPanel.style.display = 'block';
  });

  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      hotSearchPanel.style.display = 'none';
    }, 200);
  });

  searchBtn.addEventListener('click', () => {
    const keyword = searchInput.value.trim();
    if (keyword) searchMusic(keyword);
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const keyword = searchInput.value.trim();
      if (keyword) searchMusic(keyword);
    }
  });

  expandLyrics.addEventListener('click', () => {
    lyricsExpanded = !lyricsExpanded;
    lyricsContainer.classList.toggle('expanded', lyricsExpanded);
    expandLyrics.textContent = lyricsExpanded ? '收起歌词' : '展开全部歌词';
  });

  // 音频播放器事件
  playBtn.addEventListener('click', () => {
    audioPlayer.play();
    playBtn.style.display = 'none';
    pauseBtn.style.display = 'flex';
  });

  pauseBtn.addEventListener('click', () => {
    audioPlayer.pause();
    pauseBtn.style.display = 'none';
    playBtn.style.display = 'flex';
  });

  audioPlayer.addEventListener('timeupdate', updateProgress);
  audioPlayer.addEventListener('ended', () => {
    if (loopMode) {
      audioPlayer.currentTime = 0;
      audioPlayer.play();
    } else {
      playNextSong();
    }
  });
  
  // 添加错误监听
  audioPlayer.addEventListener('error', (e) => {
    console.error('播放器错误:', e);
    if(e.target.error.code === 4) { // MEDIA_ERR_SRC_NOT_SUPPORTED
      alert('音频加载失败，请尝试其他歌曲');
    }
  });

  progressContainer.addEventListener('click', setProgress);

  detailBtn.addEventListener('click', () => {
    if (currentSong && currentSong.link) {
      window.open(currentSong.link, '_blank');
    } else {
      alert('该歌曲没有详情链接');
    }
  });

  downloadLyricsBtn.addEventListener('click', () => {
    if (currentLyrics) {
      downloadLyrics(currentSong.title, currentSong.singer);
    } else {
      alert('当前没有可下载的歌词');
    }
  });

  downloadSongBtn.addEventListener('click', () => {
    if (currentSong && currentSong.url) {
      window.open(currentSong.url, '_blank');
    } else {
      alert('无法下载歌曲，链接无效');
    }
  });

  muteBtn.addEventListener('click', toggleMute);
  volumeSlider.addEventListener('input', setVolume);

  prevBtn.addEventListener('click', playPrevSong);
  nextBtn.addEventListener('click', playNextSong);

  pauseBtn.style.display = 'none';
});

// 渲染热门搜索标签
function renderHotTags() {
  hotTags.innerHTML = '';
  hotKeywords.forEach(keyword => {
    const tag = document.createElement('div');
    tag.className = 'hot-tag';
    tag.textContent = keyword;
    tag.addEventListener('click', () => {
      searchInput.value = keyword;
      searchMusic(keyword);
    });
    hotTags.appendChild(tag);
  });
}

// 搜索音乐
function searchMusic(keyword) {
  baseApiUrl = `https://www.hhlqilongzhu.cn//api/dg_qishuimusic.php?msg=${encodeURIComponent(keyword)}&type=json&n=`;
  
  resultsList.innerHTML = '<div class="result-item" style="justify-content: center; color: #888;"><i class="fas fa-spinner fa-spin"></i> 搜索中...</div>';

  fetch(baseApiUrl)
    .then(response => response.json())
    .then(data => {
      // 兼容两种JSON结构
      const results = data.data || data; // 新结构直接使用data，旧结构使用data.data
      renderSearchResults(results);
    })
    .catch(error => {
      console.error('搜索错误:', error);
      resultsList.innerHTML = '<div class="result-item" style="justify-content: center; color: #888;"><i class="fas fa-exclamation-triangle"></i> 搜索失败，请稍后重试</div>';
    });
}

// 渲染搜索结果
function renderSearchResults(results) {
  currentSearchResults = results;
  resultsList.innerHTML = '';

  if (!results || results.length === 0) {
    resultsList.innerHTML = '<div class="result-item" style="justify-content: center; color: #888;"><i class="fas fa-music"></i> 未找到相关歌曲</div>';
    return;
  }

  results.forEach(song => {
    const item = document.createElement('div');
    item.className = 'result-item';
    
    // 检查当前歌曲是否匹配
    if (currentSong && currentSong.songid === song.songid) {
      item.classList.add('current-song');
    }

    item.innerHTML = `
      <div class="result-number">${song.n}</div>
      <div class="result-details">
        <div class="result-title">${song.title}</div>
        <div class="result-artist">${song.singer}</div>
      </div>
      <div class="result-songid" data-songid="${song.songid}">ID: ${song.songid}</div>
    `;

    item.addEventListener('click', () => {
      playSong(song);
    });

    resultsList.appendChild(item);
  });
}

// 播放歌曲
function playSong(song) {
  currentSong = song;

  // 更新搜索结果列表中的高亮
  highlightCurrentSong(song);

  songTitle.textContent = song.title;
  songArtist.textContent = song.singer;
  
  // 设置加载状态
  lyricsContent.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 加载中...';
  
  // 使用初始搜索的API URL + 歌曲序号
  const detailUrl = `${baseApiUrl}${song.n}`;

  fetch(detailUrl)
    .then(response => response.json())
    .then(data => {
      // 兼容两种JSON结构
      const songDetail = data.data || data; // 新结构直接使用data，旧结构使用data.data
      
      // 处理字段名称变化
      if (songDetail) {
        // 统一处理音频URL字段
        songDetail.url = songDetail.music || songDetail.url;
        // 统一处理歌词字段
        songDetail.lyric = songDetail.lrc || songDetail.lyric;
        
        updatePlayer(songDetail);
      } else {
        console.error('歌曲详情获取失败');
        lyricsContent.textContent = "无法获取歌曲详情";
      }
    })
    .catch(error => {
      console.error('歌曲详情错误:', error);
      lyricsContent.textContent = "加载歌曲详情失败";
    });
}

// 高亮当前播放的歌曲并滚动到视图
function highlightCurrentSong(song) {
  // 移除所有高亮
  document.querySelectorAll('.result-item').forEach(item => {
    item.classList.remove('current-song');
  });
  
  // 找到当前歌曲的元素并添加高亮
  const items = document.querySelectorAll('.result-item');
  let currentItem = null;
  
  items.forEach(item => {
    const songId = item.querySelector('.result-songid').dataset.songid;
    if (songId == song.songid) {
      item.classList.add('current-song');
      currentItem = item;
    }
  });
  
  // 滚动到当前歌曲
  if (currentItem) {
    currentItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// 更新播放器
async function updatePlayer(songDetail) {
  // 更新专辑封面
  if (songDetail.cover) {
    const secureImageUrl = getSecureImageUrl(songDetail.cover);
    albumCover.innerHTML = `
      <div class="album-image-container">
        <img 
          src="${secureImageUrl}" 
          alt="${songDetail.title}" 
          onerror="this.onerror=null; this.src='${FALLBACK_IMAGE}';"
        >
      </div>
    `;
  } else {
    // 没有封面时显示原始的音乐图标
    albumCover.innerHTML = `<i class="fas fa-music"></i>`;
  }

  // 更新音频源 - 针对抖音链接特殊处理
  if (songDetail.url) {
    // 释放之前的Blob URL
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = null;
    }
    
    // 抖音链接特殊处理
    if (songDetail.url.includes('douyinvod.com')) {
      // 显示加载状态
      lyricsContent.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在加载抖音音频...';
      
      try {
        // 尝试通过代理服务器获取音频
        const proxyUrl = await getAudioThroughProxy(songDetail.url);
        audioPlayer.src = proxyUrl;
        audioPlayer.load();
        
        // 播放处理
        playBtn.style.display = 'flex';
        pauseBtn.style.display = 'none';
        
        setTimeout(() => {
          audioPlayer.play().catch(e => console.error('播放失败:', e));
          playBtn.style.display = 'none';
          pauseBtn.style.display = 'flex';
        }, 300);
      } catch (error) {
        console.error('获取抖音音频失败:', error);
        // 尝试直接播放
        audioPlayer.src = songDetail.url;
        audioPlayer.load();
        audioPlayer.play().catch(e => console.error('直接播放失败:', e));
        
        // 显示错误信息
        lyricsContent.innerHTML = `<span style="color: #ff6b6b">抖音音频加载失败，尝试直接播放</span>`;
      }
    } else {
      // 非抖音链接直接播放
      audioPlayer.src = songDetail.url;
      audioPlayer.load();
      
      playBtn.style.display = 'flex';
      pauseBtn.style.display = 'none';
      
      setTimeout(() => {
        audioPlayer.play().catch(e => console.error('播放失败:', e));
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'flex';
      }, 300);
    }
  }

  // 更新歌词显示 - 只设置原始歌词（含时间戳）
  if (songDetail.lyric) {
    currentLyrics = songDetail.lyric;
    lyricsContent.textContent = currentLyrics; // 显示原始歌词（含时间戳）
  } else {
    lyricsContent.textContent = "暂无歌词";
    currentLyrics = "";
  }

  // 更新歌曲信息
  currentSong.url = songDetail.url;
  currentSong.link = songDetail.link || null;

  // 更新按钮状态
  detailBtn.disabled = !currentSong.link;
  downloadLyricsBtn.disabled = !currentLyrics;
  downloadSongBtn.disabled = !currentSong.url;

  // 重置歌词展开状态
  lyricsExpanded = false;
  lyricsContainer.classList.remove('expanded');
  expandLyrics.textContent = '展开全部歌词';
}

// 通过代理获取音频
async function getAudioThroughProxy(originalUrl) {
  // 尝试每个代理服务器
  for (const proxy of PROXY_SERVERS) {
    const proxyUrl = proxy + encodeURIComponent(originalUrl);
    
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`代理请求失败: ${response.status}`);
      
      const blob = await response.blob();
      currentBlobUrl = URL.createObjectURL(blob);
      return currentBlobUrl;
    } catch (error) {
      console.error(`代理 ${proxy} 失败:`, error);
      // 继续尝试下一个代理
    }
  }
  
  // 所有代理都失败，抛出错误
  throw new Error('所有代理服务器均失败');
}

// 下载歌词
function downloadLyrics(title, artist) {
  if (!currentLyrics) {
    alert('当前没有可下载的歌词');
    return;
  }

  const blob = new Blob([currentLyrics], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${title} - ${artist}.lrc`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }, 100);
}

// 更新进度条
function updateProgress() {
  const { currentTime, duration } = audioPlayer;
  const progressPercent = (currentTime / duration) * 100;
  progressBar.style.width = `${progressPercent}%`;

  currentTimeEl.textContent = formatTime(currentTime);
  durationEl.textContent = formatTime(duration);

  syncLyrics(currentTime);
}

// 设置进度
function setProgress(e) {
  const width = this.clientWidth;
  const clickX = e.offsetX;
  const duration = audioPlayer.duration;
  audioPlayer.currentTime = (clickX / width) * duration;
}

// 格式化时间
function formatTime(seconds) {
  if (isNaN(seconds)) return "00:00";
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 歌词同步（修复时间戳问题）
function syncLyrics(currentTime) {
  if (!currentLyrics) return;

  const lines = currentLyrics.split('\n');
  let activeLine = "";
  let activeLineIndex = -1;

  // 改进的正则表达式，支持各种时间戳格式
  const timeRegex = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const timeMatch = line.match(timeRegex);

    if (timeMatch) {
      const minutes = parseInt(timeMatch[1]);
      const seconds = parseInt(timeMatch[2]);
      const milliseconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
      
      // 处理百分秒（如20.97）和毫秒（如2097）
      const msValue = milliseconds < 100 ? milliseconds * 10 : milliseconds;
      const lineTime = minutes * 60 + seconds + msValue / 1000;

      if (lineTime <= currentTime) {
        // 移除时间戳后存储歌词文本
        activeLine = line.replace(timeRegex, '').trim();
        activeLineIndex = i;
      } else {
        break;
      }
    }
  }

  // 生成清理后的歌词（移除所有时间戳）
  const cleanedLyrics = currentLyrics.replace(/\[\d{1,2}:\d{1,2}(?:\.\d{1,3})?\]/g, '');
  const lyricsLines = cleanedLyrics.split('\n');

  // 创建带高亮的歌词
  const highlightedLyrics = lyricsLines.map((line, index) => {
    if (index === activeLineIndex) {
      return `<span class="current-lyric">${line}</span>`;
    }
    return line;
  }).join('\n');

  // 更新歌词显示
  lyricsContent.innerHTML = highlightedLyrics;

  // 自动滚动到当前歌词
  if (activeLineIndex >= 0 && !lyricsExpanded) {
    const lineHeight = parseInt(getComputedStyle(lyricsContent).lineHeight) || 24;
    const scrollPosition = (activeLineIndex - 0) * lineHeight;
    lyricsContent.scrollTop = Math.max(0, scrollPosition);
  }
}

// 静音切换
function toggleMute() {
  if (isMuted) {
    audioPlayer.volume = lastVolume;
    volumeSlider.value = lastVolume;
    muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
  } else {
    lastVolume = audioPlayer.volume;
    audioPlayer.volume = 0;
    volumeSlider.value = 0;
    muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
  }
  isMuted = !isMuted;
  muteBtn.classList.toggle('muted', isMuted);
}

// 设置音量
function setVolume() {
  audioPlayer.volume = volumeSlider.value;

  if (audioPlayer.volume === 0) {
    isMuted = true;
    muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
  } else {
    isMuted = false;
    muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    lastVolume = audioPlayer.volume;
  }
  muteBtn.classList.toggle('muted', isMuted);
}

// 播放下一首
function playNextSong() {
  if (!currentSearchResults || currentSearchResults.length === 0) return;

  const currentIndex = currentSearchResults.findIndex(song =>
    currentSong && song.songid === currentSong.songid
  );

  if (currentIndex === -1) return;

  let nextIndex = currentIndex + 1;
  if (nextIndex >= currentSearchResults.length) {
    nextIndex = 0;
  }

  const nextSong = currentSearchResults[nextIndex];
  playSong(nextSong);
}

// 播放上一首
function playPrevSong() {
  if (!currentSearchResults || currentSearchResults.length === 0) return;

  const currentIndex = currentSearchResults.findIndex(song =>
    currentSong && song.songid === currentSong.songid
  );

  if (currentIndex === -1) return;

  let prevIndex = currentIndex - 1;
  if (prevIndex < 0) {
    prevIndex = currentSearchResults.length - 1;
  }

  const prevSong = currentSearchResults[prevIndex];
  playSong(prevSong);
}