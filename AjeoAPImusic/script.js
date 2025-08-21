// 修复版 script.js（修复分享链接播放问题 + 循环请求问题 + 保持其他功能）
const hotKeywords = [
 "王佳音","鱼蛋","窝窝","艺凌","洋澜","任夏","魏佳艺","韩小欠","单依纯","DJ","喝茶","古筝","助眠", 
  "经典老歌","70后","80后","热歌","热门","新歌","飙升","流行",
  "治愈房车","周杰伦","林俊杰","邓紫棋","陈奕迅","汪苏泷","林宥嘉",
  "薛之谦","吴亦凡","刀郎","跳楼机","搀扶",
  "周深","王子健","Beyond","五月天","伍佰","王一佳","王菲","陶喆",
  "七月上","于春洋","周传雄","张杰","半吨兄弟","张学友"
];

const searchInput       = document.getElementById('searchInput');
const searchBtn         = document.getElementById('searchBtn');
const hotSearchPanel    = document.getElementById('hotSearchPanel');
const hotTags           = document.getElementById('hotTags');
const albumCover        = document.getElementById('albumCover');
const songTitle         = document.getElementById('songTitle');
const songArtist        = document.getElementById('songArtist');
const audioPlayer       = document.getElementById('audioPlayer');
const playBtn           = document.getElementById('playBtn');
const pauseBtn          = document.getElementById('pauseBtn');
const prevBtn           = document.getElementById('prevBtn');
const nextBtn           = document.getElementById('nextBtn');
const loopBtn           = document.getElementById('loopBtn');
const progressBar       = document.getElementById('progressBar');
const bufferBar         = document.getElementById('bufferBar');
const progressContainer = document.getElementById('progressContainer');
const currentTimeEl     = document.getElementById('currentTime');
const durationEl        = document.getElementById('duration');
const lyricsContainer   = document.getElementById('lyricsContainer');
const lyricsContent     = document.getElementById('lyricsContent');
const expandLyrics      = document.getElementById('expandLyrics');
const resultsList       = document.getElementById('resultsList');
const downloadLyricsBtn = document.getElementById('downloadLyricsBtn');
const downloadSongBtn   = document.getElementById('downloadSongBtn');
const detailBtn         = document.getElementById('detailBtn');
const muteBtn           = document.getElementById('muteBtn');
const volumeSlider      = document.getElementById('volumeSlider');
const collectionBtn     = document.getElementById('collectionBtn');
const collectionPanel   = document.getElementById('collectionPanel');
const closeCollectionPanel = document.getElementById('closeCollectionPanel');
const collectionList    = document.getElementById('collectionList');
const resultCountEl     = document.getElementById('resultCount'); // 新增结果计数元素

let currentSong = null;
let currentSearchResults = [];
let lyricsExpanded = false;
let currentLyrics = "";
let loopMode = false;
let isMuted = false;
let lastVolume = 1;
let baseApiUrl = "";
let currentBlobUrl = null;
let favorites = JSON.parse(localStorage.getItem('musicFavorites')) || [];
let isFromShareLink = false;
let currentSearchKeyword = "";
let isHandlingShareLink = false; // 新增标志：是否正在处理分享链接

const PROXY_SERVER = 'https://ajeo.cc/';

/* ---------- 通用工具 ---------- */
function getSecureImageUrl(originalUrl) {
  if (!originalUrl) return '';
  if (originalUrl.startsWith('https://')) return originalUrl;
  return `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl.replace(/^https?:\/\//, ''))}`;
}

function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function generateShareUrl(song) {
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  params.append('keyword', encodeURIComponent(currentSearchKeyword));
  params.append('songId', song.n);
  return `${baseUrl}?${params.toString()}`;
}

/* ---------- 收藏相关 ---------- */
function getFavoriteKey(song, keyword) {
  return `${song.title}::${song.singer}::${keyword || currentSearchKeyword}`;
}

function isFavorited(song, keyword) {
  return favorites.some(f => getFavoriteKey(f, f.keyword) === getFavoriteKey(song, keyword));
}

function addFavorite(song, keyword) {
  if (isFavorited(song, keyword)) return false;
  favorites.push({ title: song.title, singer: song.singer, keyword: keyword || currentSearchKeyword });
  saveFavorites();
  return true;
}

function removeFavorite(song, keyword) {
  const key = getFavoriteKey(song, keyword);
  favorites = favorites.filter(f => getFavoriteKey(f, f.keyword) !== key);
  saveFavorites();
}

function saveFavorites() {
  localStorage.setItem('musicFavorites', JSON.stringify(favorites));
  updateSearchResultsFavStatus();
  renderFavorites();
}

function updateSearchResultsFavStatus() {
  document.querySelectorAll('.result-item').forEach(item => {
    const n = parseInt(item.dataset.n, 10);
    const song = currentSearchResults.find(s => s.n === n);
    if (!song) return;
    const favorited = isFavorited(song, currentSearchKeyword);
    const btn = item.querySelector('.fav-btn');
    btn.classList.toggle('favorited', favorited);
    btn.title = favorited ? '取消收藏' : '收藏';
    btn.innerHTML = `<i class="${favorited ? 'fas' : 'far'} fa-star"></i>`;
  });
}

function renderFavorites() {
  collectionList.innerHTML = '';
  if (!favorites.length) {
    collectionList.innerHTML = '<div class="empty-collection">暂无收藏歌曲</div>';
    return;
  }
  favorites.forEach(fav => {
    const item = document.createElement('div');
    item.className = 'fav-item';
    item.dataset.key = getFavoriteKey(fav, fav.keyword);
    item.innerHTML = `
      <div class="fav-title">${fav.title}</div>
      <div class="fav-artist">${fav.singer}</div>
      <div class="fav-remove" title="删除收藏"><i class="fas fa-trash"></i></div>`;
    item.addEventListener('click', e => {
      if (e.target.closest('.fav-remove')) {
        e.stopPropagation();
        removeFavorite(fav, fav.keyword);
      } else {
        searchInput.value = fav.keyword || fav.title;
        searchMusic(fav.keyword || fav.title, () => {
          const target = currentSearchResults.find(s => s.title === fav.title && s.singer === fav.singer);
          if (target) playSong(target);
          else if (currentSearchResults.length) playSong(currentSearchResults[0]);
          collectionPanel.style.display = 'none';
        });
      }
    });
    collectionList.appendChild(item);
  });
}

/* ---------- 搜索 & 渲染 ---------- */
function renderHotTags() {
  hotTags.innerHTML = '';

  // 创建关闭按钮
  const closeBtn = document.createElement('div');
  closeBtn.className = 'hot-search-close';
  closeBtn.innerHTML = '<i class="fas fa-times"></i>';
  closeBtn.addEventListener('click', () => {
    hotSearchPanel.style.display = 'none';
  });
  hotTags.appendChild(closeBtn);

  // 渲染热门关键词
  hotKeywords.forEach(kw => {
    const tag = document.createElement('div');
    tag.className = 'hot-tag';
    tag.textContent = kw;
    tag.addEventListener('click', () => {
      searchInput.value = kw;
      searchMusic(kw);
    });
    hotTags.appendChild(tag);
  });
}

function searchMusic(keyword, callback = null) {
  currentSearchKeyword = keyword;
  baseApiUrl = `https://www.hhlqilongzhu.cn/api/joox/juhe_music.php?msg=${encodeURIComponent(keyword)}&type=json&n=`;
  
  // 更新结果计数为"搜索中"
  resultCountEl.textContent = '搜索中...';
  
  resultsList.innerHTML = '<div class="result-item" style="justify-content:center;color:#888"><i class="fas fa-spinner fa-spin"></i> 搜索中...</div>';
  fetch(baseApiUrl)
    .then(r => r.json())
    .then(data => {
      renderSearchResults(data);
      // 只有在不是处理分享链接时才自动播放第一首
      if (!isHandlingShareLink && data && data.length) playSong(data[0]);
      if (callback) callback();
      isHandlingShareLink = false;
    })
    .catch(() => {
      // 搜索失败时更新计数
      resultCountEl.textContent = '共0条';
      resultsList.innerHTML = '<div class="result-item" style="justify-content:center;color:#888"><i class="fas fa-exclamation-triangle"></i> 搜索失败，请稍后重试</div>';
      isHandlingShareLink = false;
    });
}

function renderSearchResults(results) {
  currentSearchResults = results || [];
  
  // 更新结果计数
  resultCountEl.textContent = `共${currentSearchResults.length}条`;
  
  resultsList.innerHTML = '';
  if (!currentSearchResults.length) {
    resultsList.innerHTML = '<div class="result-item" style="justify-content:center;color:#888"><i class="fas fa-music"></i> 未找到相关歌曲</div>';
    return;
  }
  currentSearchResults.forEach((song, idx) => {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.dataset.n = song.n;
    item.innerHTML = `
      <div class="result-number">${idx + 1}</div>
      <div class="result-actions">
        <button class="fav-btn" title="收藏"><i class="far fa-star"></i></button>
        <button class="share-btn" title="分享"><i class="fas fa-share-alt"></i></button>
      </div>
      <div class="result-details">
        <div class="result-title">${song.title}</div>
        <div class="result-artist">${song.singer}</div>
      </div>`;
    resultsList.appendChild(item);
  });
  updateSearchResultsFavStatus();
  if (currentSong) highlightCurrentSong(currentSong);
}

/* ---------- 播放控制 ---------- */
function playSong(song) {
  resetMediaSession(); // ✅ 新增：重置锁屏界面状态
  
  // 暂停当前播放
  audioPlayer.pause();
  
  // 清除之前的blob URL
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
  
  // 更新当前歌曲信息
  currentSong = song;
  songTitle.textContent = song.title;
  songArtist.textContent = song.singer;
  lyricsContent.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 加载中...';
  
  // 更新MediaSession元数据（即使音频还未加载）
  updateMediaSessionMetadata(song);
  
  // 高亮当前歌曲
  highlightCurrentSong(song);
  
  // 加载歌曲详情
  fetch(`${baseApiUrl}${song.n}`)
    .then(r => r.json())
    .then(data => data && data.data && updatePlayer(data.data))
    .catch(() => { lyricsContent.textContent = '加载歌曲详情失败'; });
}

function highlightCurrentSong(song) {
  document.querySelectorAll('.result-item').forEach(i => i.classList.remove('current-song'));
  const item = document.querySelector(`.result-item[data-n="${song.n}"]`);
  if (item) {
    item.classList.add('current-song');
    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

async function updatePlayer(detail) {
  // 更新专辑封面
  if (detail.cover) {
    albumCover.innerHTML = `<div class="album-image-container"><img src="${getSecureImageUrl(detail.cover)}"></div>`;
  } else {
    albumCover.innerHTML = '<i class="fas fa-music"></i>';
  }
  
  // 处理音频URL
  let audioUrl = detail.url;
  if (detail.url && detail.url.includes('douyinvod.com')) {
    try {
      const resp = await fetch(PROXY_SERVER + encodeURIComponent(detail.url));
      const blob = await resp.blob();
      currentBlobUrl = URL.createObjectURL(blob);
      audioUrl = currentBlobUrl;
    } catch { /* ignore */ }
  }
  
  // 设置音频源并播放
  audioPlayer.src = audioUrl || '';
  audioPlayer.load();
  
  try { 
    await audioPlayer.play(); 
    // 更新播放状态
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = "playing";
    }
  } catch { /* ignore */ }
  
  playBtn.style.display = 'none';
  pauseBtn.style.display = 'flex';
  
  // 更新歌词
  currentLyrics = detail.lyric || '';
  lyricsContent.textContent = currentLyrics || '暂无歌词';
  
  // 更新歌曲信息
  currentSong.url = detail.url;
  currentSong.link = detail.link || null;
  
  // 更新MediaSession元数据（包含封面）
  updateMediaSessionMetadata(currentSong, detail.cover);
}

function playNextSong() {
  if (!currentSearchResults.length) return;
  const idx = currentSearchResults.findIndex(s => currentSong && s.n === currentSong.n);
  const next = currentSearchResults[(idx + 1) % currentSearchResults.length];
  playSong(next);
}

function playPrevSong() {
  if (!currentSearchResults.length) return;
  const idx = currentSearchResults.findIndex(s => currentSong && s.n === currentSong.n);
  const prev = currentSearchResults[(idx - 1 + currentSearchResults.length) % currentSearchResults.length];
  playSong(prev);
}

/* ---------- MediaSession API ---------- */
function updateMediaSessionMetadata(song, coverUrl) {
  if (!('mediaSession' in navigator)) return;
  
  const artwork = [];
  if (coverUrl) {
    artwork.push({
      src: getSecureImageUrl(coverUrl),
      sizes: '160x160',
      type: 'image/jpeg'
    });
  }
  
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.singer,
    artwork: artwork
  });
}

function setupMediaSession() {
  if (!('mediaSession' in navigator)) return;
  
  // 设置动作处理函数
  navigator.mediaSession.setActionHandler('play', () => {
    audioPlayer.play();
  });
  
  navigator.mediaSession.setActionHandler('pause', () => {
    audioPlayer.pause();
  });
  
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    playPrevSong();
  });
  
  navigator.mediaSession.setActionHandler('nexttrack', () => {
    playNextSong();
  });
  
  // 设置位置状态处理
  navigator.mediaSession.setPositionState({
    duration: audioPlayer.duration || 0,
    playbackRate: audioPlayer.playbackRate,
    position: audioPlayer.currentTime || 0
  });
}
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

/* ---------- 进度更新函数 ---------- */
function updatePlayerProgress() {
  const { currentTime, duration } = audioPlayer;

  // 更新进度条宽度
  progressBar.style.width = (currentTime / duration * 100 || 0) + '%';

  // 更新时间显示
  currentTimeEl.textContent = formatTime(currentTime);
  durationEl.textContent = formatTime(duration);

  // 同步歌词
  syncLyrics(currentTime);

  // ✅ 更新 MediaSession 位置状态（带 NaN 保护）
  if ('mediaSession' in navigator && !isNaN(duration)) {
    navigator.mediaSession.setPositionState({
      duration: duration,
      playbackRate: audioPlayer.playbackRate,
      position: currentTime
    });
  }
}

// 提取缓冲更新逻辑到单独函数
function updateBufferProgress() {
  if (audioPlayer.buffered.length) {
    const bufferedEnd = audioPlayer.buffered.end(audioPlayer.buffered.length - 1);
    bufferBar.style.width = (bufferedEnd / audioPlayer.duration * 100 || 0) + '%';
  }
}

/* ---------- 事件绑定 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('dark-theme');
  renderHotTags();
  if (!handleShareUrl()) searchMusic('窝窝');
  renderFavorites();
  
  // 初始化MediaSession
  setupMediaSession();

  /* 事件委托：收藏/分享按钮 & 歌曲点击切换 */
  resultsList.addEventListener('click', e => {
    const btn = e.target.closest('.fav-btn');
    if (btn) {
      e.stopPropagation();
      const item = btn.closest('.result-item');
      const n = parseInt(item.dataset.n, 10);
      const song = currentSearchResults.find(s => s.n === n);
      if (!song) return;
      if (isFavorited(song, currentSearchKeyword)) {
        removeFavorite(song, currentSearchKeyword);
      } else {
        addFavorite(song, currentSearchKeyword);
      }
      return;
    }
    const shareBtn = e.target.closest('.share-btn');
    if (shareBtn) {
      e.stopPropagation();
      const item = shareBtn.closest('.result-item');
      const n = parseInt(item.dataset.n, 10);
      const song = currentSearchResults.find(s => s.n === n);
      const shareText = `【Ajeo提示】请前往浏览器粘贴<链接>收听！\n${song.title} - ${song.singer}\n【链接】：\n${generateShareUrl(song)}`;
      navigator.clipboard.writeText(shareText)
        .then(() => alert('已复制请到微信粘贴分享'))
        .catch(() => {
          const ta = document.createElement('textarea');
          ta.value = shareText;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          alert('已复制请到微信粘贴分享');
        });
      return;
    }
    // 歌曲切换
    const item = e.target.closest('.result-item');
    if (item) {
      const n = parseInt(item.dataset.n, 10);
      const song = currentSearchResults.find(s => s.n === n);
      if (song) playSong(song);
    }
  });

  /* 其余绑定 */
  searchInput.addEventListener('focus', () => hotSearchPanel.style.display = 'block');
  searchInput.addEventListener('blur', () => setTimeout(() => hotSearchPanel.style.display = 'none', 200));
  searchBtn.addEventListener('click', () => { const k = searchInput.value.trim(); if (k) searchMusic(k); });
  searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') { const k = searchInput.value.trim(); if (k) searchMusic(k); } });
  expandLyrics.addEventListener('click', () => {
    lyricsExpanded = !lyricsExpanded;
    lyricsContainer.classList.toggle('expanded', lyricsExpanded);
    expandLyrics.textContent = lyricsExpanded ? '收起歌词' : '展开全部歌词';
  });
  collectionBtn.addEventListener('click', () => collectionPanel.style.display = 'block');
  closeCollectionPanel.addEventListener('click', () => collectionPanel.style.display = 'none');
  playBtn.addEventListener('click', () => audioPlayer.play());
  pauseBtn.addEventListener('click', () => audioPlayer.pause());
  audioPlayer.addEventListener('play', () => { 
    playBtn.style.display = 'none'; 
    pauseBtn.style.display = 'flex'; 
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = "playing";
    }
  });
  audioPlayer.addEventListener('pause', () => { 
    playBtn.style.display = 'flex'; 
    pauseBtn.style.display = 'none'; 
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
  });
  
  // 使用提取的进度更新函数
  audioPlayer.addEventListener('timeupdate', updatePlayerProgress);
  
  // 使用提取的缓冲更新函数
  audioPlayer.addEventListener('progress', updateBufferProgress);
  
  audioPlayer.addEventListener('ended', () => loopMode ? audioPlayer.play() : playNextSong());
  progressContainer.addEventListener('click', e => {
    const width = progressContainer.clientWidth;
    audioPlayer.currentTime = (e.offsetX / width) * audioPlayer.duration;
  });
  detailBtn.addEventListener('click', () => currentSong && currentSong.link ? window.open(currentSong.link, '_blank') : alert('该歌曲没有详情链接'));
  downloadLyricsBtn.addEventListener('click', () => {
    if (!currentLyrics) return alert('当前没有可下载的歌词');
    const blob = new Blob([currentLyrics], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${currentSong.title} - ${currentSong.singer}.lrc`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  downloadSongBtn.addEventListener('click', () => currentSong && currentSong.url ? window.open(currentSong.url, '_blank') : alert('无法下载歌曲，链接无效'));
  volumeSlider.addEventListener('input', () => {
    audioPlayer.volume = volumeSlider.value;
    isMuted = audioPlayer.volume === 0;
    muteBtn.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    muteBtn.classList.toggle('muted', isMuted);
  });
  muteBtn.addEventListener('click', () => {
    if (isMuted) {
      audioPlayer.volume = lastVolume || 1;
      volumeSlider.value = lastVolume || 1;
    } else {
      lastVolume = audioPlayer.volume;
      audioPlayer.volume = 0;
      volumeSlider.value = 0;
    }
    isMuted = !isMuted;
    muteBtn.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    muteBtn.classList.toggle('muted', isMuted);
  });
  loopBtn.addEventListener('click', () => { 
    loopMode = !loopMode; 
    loopBtn.classList.toggle('active', loopMode); 
  });
  prevBtn.addEventListener('click', playPrevSong);
  nextBtn.addEventListener('click', playNextSong);
  
  // 添加页面可见性监听器 - 修复熄屏不同步问题
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // 页面重新可见时强制更新进度
      updatePlayerProgress();
      updateBufferProgress();
    }
  });
});

/* ---------- 其他工具 ---------- */
function formatTime(sec) {
  if (isNaN(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function syncLyrics(time) {
  if (!currentLyrics) return;
  const lines = currentLyrics.split('\n');
  let active = -1;
  const regex = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(regex);
    if (m) {
      const t = (+m[1]) * 60 + (+m[2]) + ((+m[3] || 0) < 100 ? (+m[3] || 0) * 10 : (+m[3] || 0)) / 1000;
      if (t <= time) active = i; else break;
    }
  }
  const cleaned = currentLyrics.replace(/\[\d{1,2}:\d{1,2}(?:\.\d{1,3})?\]/g, '');
  const cleanedLines = cleaned.split('\n');
  lyricsContent.innerHTML = cleanedLines.map((l, i) => i === active ? `<span class="current-lyric">${l}</span>` : l).join('\n');
  if (active >= 0 && !lyricsExpanded) {
    const lh = parseInt(getComputedStyle(lyricsContent).lineHeight) || 24;
    lyricsContent.scrollTop = Math.max(0, (active - 1) * lh);
  }
}

function handleShareUrl() {
  const keyword = getUrlParameter('keyword');
  const songId = getUrlParameter('songId');
  if (!keyword) return false;
  isHandlingShareLink = true; // 设置标志，表示正在处理分享链接
  searchInput.value = decodeURIComponent(keyword);
  window.history.replaceState({}, document.title, window.location.pathname);
  resultsList.innerHTML = '<div class="result-item" style="justify-content:center;color:#888">正在加载分享歌曲...</div>';
  searchMusic(decodeURIComponent(keyword), () => {
    if (songId) {
      const target = currentSearchResults.find(s => s.n === +songId);
      if (target) {
        playSong(target);
        document.querySelector(`.result-item[data-n="${songId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (currentSearchResults.length) {
        playSong(currentSearchResults[0]);
      }
    } else if (currentSearchResults.length) {
      playSong(currentSearchResults[0]);
    }
  });
  return true;
}
