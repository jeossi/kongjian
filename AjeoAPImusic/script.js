// 完整修复版 script.js
const hotKeywords = [
  "王佳音","鱼蛋","窝窝","艺凌","洋澜","任夏","魏佳艺","韩小欠","单依纯","DJ","林宥嘉",
  "喝茶","古筝","助眠","热歌","热门","新歌","飙升","流行",
  "治愈房车","周杰伦","林俊杰","邓紫棋","陈奕迅","汪苏泷",
  "经典老歌","薛之谦","吴亦凡","刀郎","跳楼机",
  "周深","王子健","Beyond","五月天","伍佰","王一佳","王菲","陶喆",
  "七月上","于春洋","搀扶","周传雄","张杰","半吨兄弟","张学友"
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

let currentSong = null;
let currentSearchResults = [];
let lyricsExpanded = false;
let currentLyrics = "";
let loopMode = false;
let isMuted = false;
let lastVolume = 1;
let baseApiUrl = "";
let currentBlobUrl = null;

const PROXY_SERVER = 'https://ajeo.cc/';
const FALLBACK_IMAGE = '../mm.jpg';

function getSecureImageUrl(originalUrl) {
  if (!originalUrl) return '';
  if (originalUrl.startsWith('https://')) return originalUrl;
  return `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl.replace(/^https?:\/\//, ''))}`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('dark-theme');
  renderHotTags();
  searchMusic('窝窝');

  loopBtn.addEventListener('click', () => {
    loopMode = !loopMode;
    loopBtn.classList.toggle('active', loopMode);
  });

  muteBtn.addEventListener('click', toggleMute);
  loopBtn.classList.toggle('active', loopMode);
  muteBtn.classList.toggle('muted', isMuted);

  searchInput.addEventListener('focus', () => hotSearchPanel.style.display = 'block');
  searchInput.addEventListener('blur', () => setTimeout(() => hotSearchPanel.style.display = 'none', 200));

  searchBtn.addEventListener('click', () => { const k = searchInput.value.trim(); if (k) searchMusic(k); });
  searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { const k = searchInput.value.trim(); if (k) searchMusic(k); } });

  expandLyrics.addEventListener('click', () => {
    lyricsExpanded = !lyricsExpanded;
    lyricsContainer.classList.toggle('expanded', lyricsExpanded);
    expandLyrics.textContent = lyricsExpanded ? '收起歌词' : '展开全部歌词';
  });

  playBtn.addEventListener('click', () => audioPlayer.play());
  pauseBtn.addEventListener('click', () => audioPlayer.pause());
  audioPlayer.addEventListener('timeupdate', updateProgress);
  audioPlayer.addEventListener('ended', () => loopMode ? (audioPlayer.currentTime = 0, audioPlayer.play()) : playNextSong());
audioPlayer.addEventListener('error', (e) => {
  console.error('播放器错误:', e);
  if (e.target.error.code === 4) {
    setTimeout(() => {
      if (audioPlayer.error && audioPlayer.error.code === 4 && audioPlayer.readyState < 2) {
        console.warn('音频加载失败，请尝试其他歌曲');
      }
    }, 180000);
  }
});

  progressContainer.addEventListener('click', setProgress);
  detailBtn.addEventListener('click', () => {
    currentSong && currentSong.link ? window.open(currentSong.link, '_blank') : alert('该歌曲没有详情链接');
  });
  downloadLyricsBtn.addEventListener('click', () => {
    currentLyrics ? downloadLyrics(currentSong.title, currentSong.singer) : alert('当前没有可下载的歌词');
  });
  downloadSongBtn.addEventListener('click', () => {
    currentSong && currentSong.url ? window.open(currentSong.url, '_blank') : alert('无法下载歌曲，链接无效');
  });

  volumeSlider.addEventListener('input', setVolume);
  prevBtn.addEventListener('click', playPrevSong);
  nextBtn.addEventListener('click', playNextSong);

  pauseBtn.style.display = 'none';
});

function renderHotTags() {
  hotTags.innerHTML = '';
  hotKeywords.forEach(kw => {
    const tag = document.createElement('div');
    tag.className = 'hot-tag';
    tag.textContent = kw;
    tag.addEventListener('click', () => { searchInput.value = kw; searchMusic(kw); });
    hotTags.appendChild(tag);
  });
}

function searchMusic(keyword) {
  baseApiUrl = `https://www.hhlqilongzhu.cn/api/joox/juhe_music.php?msg=${encodeURIComponent(keyword)}&type=json&n=`;
  resultsList.innerHTML = '<div class="result-item" style="justify-content:center;color:#888"><i class="fas fa-spinner fa-spin"></i> 搜索中...</div>';
  fetch(baseApiUrl)
    .then(r => r.json())
    .then(data => {
      renderSearchResults(data);
      if (data && data.length > 0) playSong(data[0]);
    })
    .catch(() => {
      resultsList.innerHTML = '<div class="result-item" style="justify-content:center;color:#888"><i class="fas fa-exclamation-triangle"></i> 搜索失败，请稍后重试</div>';
    });
}

function renderSearchResults(results) {
  currentSearchResults = results || [];
  resultsList.innerHTML = '';
  if (!currentSearchResults.length) {
    resultsList.innerHTML = '<div class="result-item" style="justify-content:center;color:#888"><i class="fas fa-music"></i> 未找到相关歌曲</div>';
    return;
  }
  
  currentSearchResults.forEach((song, index) => {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.dataset.n = song.n; // 使用歌曲的 n 字段作为唯一标识符
    
    // 如果当前歌曲存在且匹配，添加高亮类
    if (currentSong && currentSong.n === song.n) {
      item.classList.add('current-song');
    }
    
    item.innerHTML = `
      <div class="result-number">${index + 1}</div>
      <div class="result-details">
        <div class="result-title">${song.title}</div>
        <div class="result-artist">${song.singer}</div>
      </div>
      <div class="result-songid">ID:${song.n}</div>`;
    item.addEventListener('click', () => playSong(song));
    resultsList.appendChild(item);
  });
  
  // 渲染完成后再次尝试高亮当前歌曲
  if (currentSong) {
    highlightCurrentSong(currentSong);
  }
}

function playSong(song) {
  currentSong = song;
  highlightCurrentSong(song);

  if (audioPlayer.src) {
    audioPlayer.pause();
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = null;
    }
  }

  audioPlayer.src = '';
  songTitle.textContent = song.title;
  songArtist.textContent = song.singer;
  lyricsContent.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 加载中...';

  fetch(`${baseApiUrl}${song.n}`)
    .then(r => r.json())
    .then(data => { if (data && data.data) updatePlayer(data.data); })
    .catch(() => { lyricsContent.textContent = "加载歌曲详情失败"; });
}

function highlightCurrentSong(song) {
  document.querySelectorAll('.result-item').forEach(i => i.classList.remove('current-song'));
  
  const items = document.querySelectorAll('.result-item');
  let found = false;
  
  items.forEach(item => {
    if (parseInt(item.dataset.n) === song.n) {
      item.classList.add('current-song');
      found = true;
      // 使用scrollIntoView确保元素在可视区域内
      item.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  });
  
  // 如果未找到匹配项，延迟重试
  if (!found) {
    setTimeout(() => highlightCurrentSong(song), 100);
  }
}

async function updatePlayer(songDetail) {
  if (songDetail.cover) {
    const url = getSecureImageUrl(songDetail.cover);
    albumCover.innerHTML = `<div class="album-image-container"><img src="${url}" alt="${songDetail.title}" onerror="this.src='${FALLBACK_IMAGE}'"></div>`;
  } else {
    albumCover.innerHTML = '<i class="fas fa-music"></i>';
  }

  if (songDetail.url) {
    try {
      let audioUrl = songDetail.url;
      if (songDetail.url.includes('douyinvod.com')) {
        lyricsContent.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在加载抖音音频...';
        const resp = await fetch(PROXY_SERVER + encodeURIComponent(songDetail.url));
        if (!resp.ok) throw new Error('代理失败');
        const blob = await resp.blob();
        currentBlobUrl = URL.createObjectURL(blob);
        audioUrl = currentBlobUrl;
      }
      audioPlayer.src = audioUrl;
      audioPlayer.load();
      await audioPlayer.play();
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'flex';
    } catch (e) {
      console.error('加载音频失败:', e);
      lyricsContent.innerHTML = '<span style="color:#ff6b6b">音频加载失败，请尝试其他歌曲</span>';
    }
  }

  if (songDetail.lyric) {
    currentLyrics = songDetail.lyric;
    lyricsContent.textContent = currentLyrics;
  } else {
    lyricsContent.textContent = '暂无歌词';
    currentLyrics = '';
  }

  currentSong.url = songDetail.url;
  currentSong.link = songDetail.link || null;

  detailBtn.disabled = !currentSong.link;
  downloadLyricsBtn.disabled = !currentLyrics;
  downloadSongBtn.disabled = !currentSong.url;

  lyricsExpanded = false;
  lyricsContainer.classList.remove('expanded');
  expandLyrics.textContent = '展开全部歌词';
}

function downloadLyrics(title, artist) {
  if (!currentLyrics) return alert('当前没有可下载的歌词');
  const blob = new Blob([currentLyrics], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${title} - ${artist}.lrc`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 100);
}

function updateProgress() {
  const { currentTime, duration } = audioPlayer;
  progressBar.style.width = (currentTime / duration * 100 || 0) + '%';
  currentTimeEl.textContent = formatTime(currentTime);
  durationEl.textContent = formatTime(duration);
  syncLyrics(currentTime);
}
function setProgress(e) {
  const width = this.clientWidth;
  const clickX = e.offsetX;
  const duration = audioPlayer.duration;
  audioPlayer.currentTime = (clickX / width) * duration;
}
function formatTime(sec) {
  if (isNaN(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function syncLyrics(currentTime) {
  if (!currentLyrics) return;
  const lines = currentLyrics.split('\n');
  let activeIndex = -1;
  const regex = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(regex);
    if (match) {
      const m = +match[1], s = +match[2], ms = +(match[3] || 0);
      const t = m * 60 + s + (ms < 100 ? ms * 10 : ms) / 1000;
      if (t <= currentTime) activeIndex = i; else break;
    }
  }
  const cleaned = currentLyrics.replace(/\[\d{1,2}:\d{1,2}(?:\.\d{1,3})?\]/g, '');
  const cleanedLines = cleaned.split('\n');
  const html = cleanedLines.map((l, i) => i === activeIndex ? `<span class="current-lyric">${l}</span>` : l).join('\n');
  lyricsContent.innerHTML = html;
  if (activeIndex >= 0 && !lyricsExpanded) {
    const lh = parseInt(getComputedStyle(lyricsContent).lineHeight) || 24;
    lyricsContent.scrollTop = Math.max(0, (activeIndex - 1) * lh);
  }
}

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
function setVolume() {
  audioPlayer.volume = volumeSlider.value;
  isMuted = audioPlayer.volume === 0;
  muteBtn.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
  lastVolume = isMuted ? lastVolume : audioPlayer.volume;
  muteBtn.classList.toggle('muted', isMuted);
}

function playNextSong() {
  if (!currentSearchResults.length) return;
  const idx = currentSearchResults.findIndex(s => currentSong && s.n === currentSong.n);
  if (idx === -1) return;
  const next = currentSearchResults[(idx + 1) % currentSearchResults.length];
  playSong(next);
}
function playPrevSong() {
  if (!currentSearchResults.length) return;
  const idx = currentSearchResults.findIndex(s => currentSong && s.n === currentSong.n);
  if (idx === -1) return;
  const prev = currentSearchResults[(idx - 1 + currentSearchResults.length) % currentSearchResults.length];
  playSong(prev);
}
