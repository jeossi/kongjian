// API配置
const API_BASE = 'https://sdkapi.hhlqilongzhu.cn/api/qimao_duanju/';
const API_KEY = 'Dragon9430124081FEABFA626884BD28AF1BDF';

// 热门搜索关键词
const HOT_SEARCH_KEYWORDS = [
    "家里家外", "江南时节", "好一个乖乖女", "她偏要抢", "双面权臣暗恋我",
    "深情诱引", "念念有词", "占有蔷薇", "春夜沉溺", "只为占有你",
    "错爱契约", "玫瑰冠冕", "一品布衣", "横刀夺爱", "执他之手",
    "当爱抵达时", "南音再许", "正义之刃", "心动还请告诉我", "伤心最是关山月",
    "嫁给喻先生", "十八岁太奶奶驾到，重整家族荣耀", "新剧", "逆袭", "霸总",
    "现代言情", "打脸虐渣", "豪门恩怨", "神豪", "马甲", "都市日常",
    "战神归来", "小人物", "女性成长", "大女主", "穿越", "都市修仙",
    "强者回归", "亲情", "古装", "重生", "闪婚", "赘婿逆袭", "虐恋",
    "追妻", "天下无敌", "家庭伦理", "萌宝", "古风权谋", "职场", "奇幻脑洞",
    "异能", "无敌神医", "古风言情", "传承觉醒", "现言甜宠", "奇幻爱情",
    "乡村", "历史古代", "王妃", "高手下山", "娱乐圈", "强强联合", "破镜重圆",
    "暗恋成真", "民国", "欢喜冤家", "系统", "真假千金", "龙王", "校园",
    "穿书", "女帝", "团宠", "年代爱情", "玄幻仙侠", "青梅竹马", "悬疑推理",
    "皇后", "替身", "大叔", "喜剧", "剧情"
];

// 全局变量
let currentPage = 1;
let currentDramaId = null;
let dramaList = [];
let episodeList = [];
let hls = null; // HLS实例
let currentQuality = 'hd'; // 当前线路质量，默认超清
let lastPlayedEpisode = {}; // 记录最后播放的集数
let favorites = []; // 收藏列表
let autoPlay = true; // 自动播放开关

// DOM元素
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const myFavoritesBtn = document.getElementById('myFavoritesBtn');
const dramaListContainer = document.getElementById('dramaList');
const playerSection = document.getElementById('playerSection');
const dramaTitle = document.getElementById('dramaTitle');
const dramaDescription = document.getElementById('dramaDescription');
const videoPlayer = document.getElementById('videoPlayer');
const episodeListContainer = document.getElementById('episodeList');
const paginationContainer = document.getElementById('pagination');
const backToTopBtn = document.getElementById('backToTop');
const hotSearchPanel = document.getElementById('hotSearchPanel');
const favoritesPanel = document.getElementById('favoritesPanel');
const hotSearchTags = document.getElementById('hotSearchTags');
const favoritesContent = document.getElementById('favoritesContent');

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 绑定搜索事件
    searchBtn.addEventListener('click', searchDramas);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchDramas();
        }
    });
    
    // 绑定我的收藏按钮事件
    myFavoritesBtn.addEventListener('click', toggleFavoritesPanel);
    
    // 搜索框焦点事件
    searchInput.addEventListener('focus', function() {
        renderHotSearchTags();
        hotSearchPanel.classList.add('show');
        favoritesPanel.classList.remove('show');
    });
    
    // 点击其他地方隐藏面板
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && 
            !hotSearchPanel.contains(e.target) && 
            !favoritesPanel.contains(e.target) &&
            !myFavoritesBtn.contains(e.target)) {
            hotSearchPanel.classList.remove('show');
            favoritesPanel.classList.remove('show');
        }
    });
    
    // 绑定回到顶部按钮事件
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // 监听视频播放结束事件，用于自动播放下一集
    videoPlayer.addEventListener('ended', function() {
        if (autoPlay) {
            playNextEpisode();
        }
    });
    
    // 监听视频播放状态变化
    videoPlayer.addEventListener('playing', function() {
        hidePlaybackStatus();
    });
    
    videoPlayer.addEventListener('pause', function() {
        showPlaybackStatus('已暂停');
    });
    
    videoPlayer.addEventListener('waiting', function() {
        showPlaybackStatus('加载中...');
    });
    
    // 监听滚动事件，控制回到顶部按钮的显示/隐藏
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    
    // 设置默认关键词并自动搜索
    searchInput.value = '都市';
    searchDramas();
    
    // 加载保存的播放记录和收藏
    loadLastPlayedEpisode();
    loadFavorites();
});

// 显示播放状态
function showPlaybackStatus(message) {
    let statusElement = document.querySelector('.video-player .playback-status');
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.className = 'playback-status';
        document.querySelector('.video-player').appendChild(statusElement);
    }
    statusElement.textContent = message;
    statusElement.style.display = 'block';
}

// 隐藏播放状态
function hidePlaybackStatus() {
    const statusElement = document.querySelector('.video-player .playback-status');
    if (statusElement) {
        statusElement.style.display = 'none';
    }
}

// 关闭热门搜索面板
function closeHotSearchPanel() {
    hotSearchPanel.classList.remove('show');
}

// 切换我的收藏面板
function toggleFavoritesPanel() {
    if (favoritesPanel.classList.contains('show')) {
        favoritesPanel.classList.remove('show');
    } else {
        renderFavorites();
        favoritesPanel.classList.add('show');
        hotSearchPanel.classList.remove('show');
    }
}

// 关闭我的收藏面板
function closeFavoritesPanel() {
    favoritesPanel.classList.remove('show');
}

// 渲染热门搜索标签
function renderHotSearchTags() {
    let html = '';
    HOT_SEARCH_KEYWORDS.forEach(keyword => {
        html += `<div class="hot-search-tag" onclick="searchByKeyword('${keyword}'); closeHotSearchPanel();">${keyword}</div>`;
    });
    hotSearchTags.innerHTML = html;
}

// 通过关键词搜索
function searchByKeyword(keyword) {
    searchInput.value = keyword;
    searchDramas();
}

// 搜索短剧
function searchDramas() {
    const keyword = searchInput.value.trim();
    if (!keyword) {
        alert('请输入搜索关键词');
        return;
    }
    
    // 隐藏面板
    hotSearchPanel.classList.remove('show');
    favoritesPanel.classList.remove('show');
    
    // 获取搜索结果
    fetch(`${API_BASE}?key=${API_KEY}&name=${encodeURIComponent(keyword)}&page=${currentPage}`)
        .then(response => response.json())
        .then(data => {
            if (data.data && data.data.list) {
                dramaList = data.data.list;
                renderDramaList(dramaList);
                // 从meta中获取分页信息
                const totalPages = data.data.meta ? data.data.meta.total_pages : 1;
                renderPagination(totalPages, currentPage);
            } else {
                showError(dramaListContainer, '搜索失败：未找到相关数据');
            }
        })
        .catch(error => {
            console.error('搜索出错:', error);
            showError(dramaListContainer, '搜索出错，请稍后重试');
        });
}

// 渲染短剧列表
function renderDramaList(list) {
    if (!list || list.length === 0) {
        dramaListContainer.innerHTML = '<div style="text-align: center; padding: 30px; font-size: 1.2em; color: #7f8c8d;">未找到相关短剧</div>';
        return;
    }
    
    let html = '';
    list.forEach(drama => {
        // 检查是否已收藏
        const isFavorite = favorites.some(fav => fav.id == drama.id);
        
        html += `
            <div class="drama-item">
                <img src="${drama.image_link || 'https://via.placeholder.com/250x200?text=暂无封面'}" alt="${drama.title}" class="drama-cover">
                <div class="drama-info">
                    <div class="drama-title">${drama.title}</div>
                    <div class="drama-author">集数：${drama.total_num || '未知'}</div>
                    ${drama.hot_value ? `<div class="drama-hot">热度：${drama.hot_value}</div>` : ''}
                    <div class="drama-desc">${drama.sub_title || '暂无简介'}</div>
                    <div class="drama-actions">
                        <button class="action-btn play-btn" onclick="playDrama('${drama.id}')">播放</button>
                        <button class="action-btn favorite-btn" onclick="toggleFavorite('${drama.id}', '${drama.title}', '${drama.image_link || ''}')">${isFavorite ? '已收藏' : '收藏'}</button>
                        <button class="action-btn share-btn" onclick="shareDrama('${drama.id}', '${drama.title}')">分享</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    dramaListContainer.innerHTML = html;
}

// 播放短剧
function playDrama(dramaId) {
    showDramaDetails(dramaId);
}

// 收藏功能
function toggleFavorite(dramaId, title, imageLink) {
    const index = favorites.findIndex(fav => fav.id == dramaId);
    if (index !== -1) {
        // 取消收藏
        favorites.splice(index, 1);
    } else {
        // 添加收藏
        favorites.push({
            id: dramaId,
            title: title,
            imageLink: imageLink
        });
    }
    
    // 保存到本地存储（使用专用名称）
    saveFavorites();
    
    // 重新渲染搜索结果以更新按钮文本
    renderDramaList(dramaList);
    
    // 如果收藏面板打开，更新面板内容
    if (favoritesPanel.classList.contains('show')) {
        renderFavorites();
    }
}

// 渲染收藏内容
function renderFavorites() {
    if (favorites.length === 0) {
        favoritesContent.innerHTML = '<div style="text-align: center; padding: 20px; color: #7f8c8d;">暂无收藏内容</div>';
        return;
    }
    
    let html = '';
    favorites.forEach(fav => {
        html += `
            <div class="favorite-item">
                <img src="${fav.imageLink || 'https://via.placeholder.com/60x80?text=封面'}" alt="${fav.title}" class="favorite-cover">
                <div class="favorite-info">
                    <div class="favorite-title">${fav.title}</div>
                    <div class="favorite-actions">
                        <button class="favorite-play-btn" onclick="playDrama('${fav.id}'); closeFavoritesPanel();">播放</button>
                        <button class="favorite-remove-btn" onclick="toggleFavorite('${fav.id}', '${fav.title}', '${fav.imageLink}'); renderFavorites();">取消收藏</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    favoritesContent.innerHTML = html;
}

// 分享功能
function shareDrama(dramaId, title) {
    // 这里可以实现分享逻辑
    const shareText = `Ajeo分享短剧：${title},复制链接到浏览器观看!`;
    if (navigator.share) {
        navigator.share({
            title: '短剧分享',
            text: shareText,
            url: window.location.href
        }).catch(error => console.log('分享失败:', error));
    } else {
        // 复制到剪贴板
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('分享链接已复制到剪贴板');
    }
}

// 显示短剧详情和播放列表
function showDramaDetails(dramaId) {
    currentDramaId = dramaId;
    
    // 获取短剧详情
    fetch(`${API_BASE}?key=${API_KEY}&id=${dramaId}`)
        .then(response => response.json())
        .then(data => {
            if (data.data) {
                const drama = data.data;
                // 显示播放器区域
                playerSection.style.display = 'block';
                
                // 设置短剧信息
                dramaTitle.textContent = drama.title;
                dramaDescription.textContent = drama.intro || '暂无简介';
                
                // 保存剧集列表
                episodeList = drama.play_list || [];
                
                // 渲染剧集列表
                renderEpisodeList(episodeList);
                
                // 如果有剧集，播放最后观看的集数或默认第一集
                if (episodeList.length > 0) {
                    // 过滤出有效的播放链接
                    const validEpisodes = episodeList.filter(ep => ep.video_url && ep.status === 1);
                    if (validEpisodes.length > 0) {
                        let episodeToPlay = 0;
                        
                        // 检查是否有保存的播放记录
                        if (lastPlayedEpisode[dramaId]) {
                            const savedEpisodeIndex = validEpisodes.findIndex(ep => 
                                ep.sort == lastPlayedEpisode[dramaId].sort);
                            if (savedEpisodeIndex !== -1) {
                                episodeToPlay = savedEpisodeIndex;
                            }
                        }
                        
                        const selectedEpisode = validEpisodes[episodeToPlay];
                        // 根据当前线路质量选择播放链接
                        const playUrl = currentQuality === 'hd' && selectedEpisode.video_h265_url ? 
                            selectedEpisode.video_h265_url : selectedEpisode.video_url;
                        playEpisode(playUrl, episodeToPlay, selectedEpisode.video_h265_url, selectedEpisode.video_url, selectedEpisode.sort);
                    }
                }
                
                // 滚动到播放器区域并居中显示
                setTimeout(() => {
                    // 定位到视频播放器区域
                    const videoPlayer = document.getElementById('videoPlayer');
                    if (videoPlayer) {
                        const rect = videoPlayer.getBoundingClientRect();
                        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                        const centerY = rect.top + scrollTop - window.innerHeight / 2 + videoPlayer.offsetHeight / 2;
                        
                        window.scrollTo({
                            top: centerY,
                            behavior: 'smooth'
                        });
                    }
                }, 100);
            } else {
                showError(dramaListContainer, '获取短剧详情失败：未找到相关数据');
            }
        })
        .catch(error => {
            console.error('获取短剧详情出错:', error);
            showError(dramaListContainer, '获取短剧详情出错，请稍后重试');
        });
}

// 渲染剧集列表
function renderEpisodeList(list) {
    if (!list || list.length === 0) {
        episodeListContainer.innerHTML = '<p>暂无播放列表</p>';
        return;
    }
    
    // 过滤出有效的剧集（有播放链接且状态为1）
    const validEpisodes = list.filter(ep => ep.video_url && ep.status === 1);
    
    if (validEpisodes.length === 0) {
        episodeListContainer.innerHTML = '<p>暂无可用的播放资源</p>';
        return;
    }
    
    // 添加返回按钮和线路选择
    let html = `
        <div class="player-controls">
            <button class="back-button" onclick="backToSearch()">返回</button>
            <button class="control-btn" onclick="playPrevEpisode()">上一集</button>
            <button class="control-btn" onclick="playNextEpisode()">下一集</button>
            <button class="control-btn" onclick="togglePictureInPicture()">画中画</button>
            <button class="control-btn auto-play-toggle ${autoPlay ? 'active' : ''}" onclick="toggleAutoPlay()">
                ${autoPlay ? '自动播放: 开' : '自动播放: 关'}
            </button>
        </div>
        <div class="episode-header">
            <h3 class="episode-title">剧集列表</h3>
            <div class="quality-selector">
                <button class="quality-btn hd-btn ${currentQuality === 'hd' ? 'active' : ''}" onclick="switchQuality('hd')">超清线路</button>
                <button class="quality-btn sd-btn ${currentQuality === 'sd' ? 'active' : ''}" onclick="switchQuality('sd')">高清线路</button>
            </div>
        </div>
        <div class="episode-grid">
    `;
    
    // 遍历所有剧集，不仅仅是有效剧集
    list.forEach((episode, index) => {
        // 检查剧集是否有效（有播放链接且状态为1）
        const isValid = episode.video_url && episode.status === 1;
        
        // 为无效剧集添加特殊类名
        const episodeClass = isValid ? 'episode-item' : 'episode-item disabled';
        
        html += `
            <div class="episode-item-container">
                <div class="${episodeClass}" ${isValid ? `onclick="playEpisodeByIndex(${index})"` : ''}>
                    第${episode.sort || index + 1}集
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    episodeListContainer.innerHTML = html;
}

// 根据索引播放剧集
function playEpisodeByIndex(index) {
    if (episodeList && episodeList.length > index) {
        const episode = episodeList[index];
        // 检查剧集是否有效
        if (episode && episode.status === 1 && episode.video_url) {
            // 根据当前线路质量选择播放链接
            const playUrl = currentQuality === 'hd' && episode.video_h265_url ? 
                episode.video_h265_url : episode.video_url;
            playEpisode(playUrl, index, episode.video_h265_url, episode.video_url, episode.sort);
            
            // 定位到视频播放器区域
            setTimeout(() => {
                const videoPlayer = document.getElementById('videoPlayer');
                if (videoPlayer) {
                    const rect = videoPlayer.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const centerY = rect.top + scrollTop - window.innerHeight / 2 + videoPlayer.offsetHeight / 2;
                    
                    window.scrollTo({
                        top: centerY,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        } else {
            // 剧集无效时给出提示
            alert('该集暂无播放资源');
        }
    }
}

// 播放上一集
function playPrevEpisode() {
    const activeEpisode = document.querySelector('.episode-item.active');
    if (activeEpisode) {
        const index = Array.from(document.querySelectorAll('.episode-item')).indexOf(activeEpisode);
        if (index > 0) {
            // 查找上一个有效的剧集
            let prevIndex = index - 1;
            while (prevIndex >= 0) {
                const episode = episodeList[prevIndex];
                if (episode && episode.status === 1 && episode.video_url) {
                    playEpisodeByIndex(prevIndex);
                    return;
                }
                prevIndex--;
            }
            alert('没有上一集了');
        }
    }
}

// 播放下一集
function playNextEpisode() {
    const activeEpisode = document.querySelector('.episode-item.active');
    if (activeEpisode) {
        const index = Array.from(document.querySelectorAll('.episode-item')).indexOf(activeEpisode);
        if (index < episodeList.length - 1) {
            // 查找下一个有效的剧集
            let nextIndex = index + 1;
            while (nextIndex < episodeList.length) {
                const episode = episodeList[nextIndex];
                if (episode && episode.status === 1 && episode.video_url) {
                    playEpisodeByIndex(nextIndex);
                    return;
                }
                nextIndex++;
            }
            alert('没有下一集了');
        }
    }
}

// 切换画中画模式
function togglePictureInPicture() {
    if (videoPlayer.readyState >= 1) { // 确保视频已加载
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(error => {
                console.error('退出画中画模式失败:', error);
            });
        } else {
            videoPlayer.requestPictureInPicture().catch(error => {
                console.error('进入画中画模式失败:', error);
                alert('您的浏览器不支持画中画功能');
            });
        }
    } else {
        alert('请先播放视频');
    }
}

// 切换自动播放
function toggleAutoPlay() {
    autoPlay = !autoPlay;
    // 更新按钮状态
    const autoPlayBtn = document.querySelector('.auto-play-toggle');
    if (autoPlayBtn) {
        autoPlayBtn.classList.toggle('active', autoPlay);
        autoPlayBtn.textContent = autoPlay ? '自动播放: 开' : '自动播放: 关';
    }
}

// 切换线路质量
function switchQuality(quality) {
    currentQuality = quality;
    // 重新渲染剧集列表以更新按钮状态
    renderEpisodeList(episodeList);
    
    // 如果当前有播放的剧集，切换到对应质量的线路
    const activeEpisode = document.querySelector('.episode-item.active');
    if (activeEpisode) {
        const index = Array.from(document.querySelectorAll('.episode-item')).indexOf(activeEpisode);
        if (index !== -1 && episodeList && episodeList.length > index) {
            playEpisodeByIndex(index);
        }
    }
}

// 播放指定剧集
function playEpisode(playUrl, index, hdUrl = '', sdUrl = '', sort = '') {
    if (!playUrl) {
        alert('播放地址无效');
        return;
    }
    
    // 检查视频URL格式并尝试优化
    const optimizedUrl = optimizeVideoUrl(playUrl);
    
    // 显示正在播放的集数
    showEpisodeNumber(sort || (index + 1));
    
    // 销毁之前的HLS实例
    if (hls) {
        hls.destroy();
        hls = null;
    }
    
    // 重置视频源
    videoPlayer.src = '';
    
    // 添加播放状态检查
    let playAttempted = false;
    let playStartTime = Date.now();
    
    // 检查视频格式并选择最佳播放方式
    const videoFormat = getVideoFormat(optimizedUrl);
    
    // 检查是否支持原生HLS播放
    if (videoFormat === 'hls' && videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari支持原生HLS
        console.log('使用原生HLS播放');
        videoPlayer.src = optimizedUrl;
        videoPlayer.load();
        
        // 添加更多错误处理
        videoPlayer.addEventListener('error', function(e) {
            console.error('视频播放错误:', e);
            showPlaybackStatus('视频播放出错，请检查设备兼容性');
        });
        
        // 添加播放状态监控
        const checkPlayStatus = () => {
            const elapsed = Date.now() - playStartTime;
            if (!playAttempted && videoPlayer.paused && videoPlayer.currentTime === 0 && elapsed > 3000) {
                // 如果视频3秒后仍未播放，显示状态
                showPlaybackStatus('正在尝试播放...');
                // 尝试重新播放
                videoPlayer.play().catch(error => {
                    console.error('重新播放失败:', error);
                    showPlaybackStatus('播放失败，请检查网络或设备兼容性');
                });
            } else if (!videoPlayer.paused && videoPlayer.currentTime > 0) {
                // 正在播放
                hidePlaybackStatus();
            }
        };
        
        videoPlayer.play().then(() => {
            playAttempted = true;
            hidePlaybackStatus();
        }).catch(error => {
            console.error('播放失败:', error);
            showPlaybackStatus('播放失败，正在重试...');
            // 在某些设备上（如投影仪），可能需要延迟播放
            setTimeout(() => {
                videoPlayer.play().then(() => {
                    playAttempted = true;
                    hidePlaybackStatus();
                }).catch(error => {
                    console.error('延迟播放也失败:', error);
                    showPlaybackStatus('播放失败，请稍后重试');
                });
            }, 1000);
        });
        
        // 定期检查播放状态
        const statusCheckInterval = setInterval(checkPlayStatus, 1000);
        // 10秒后清除检查
        setTimeout(() => {
            clearInterval(statusCheckInterval);
        }, 10000);
    } else if (videoFormat === 'hls' && Hls.isSupported()) {
        // 其他浏览器使用hls.js
        console.log('使用hls.js播放');
        hls = new Hls({
            // 添加更多配置选项以提高兼容性
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
        });
        hls.loadSource(optimizedUrl);
        hls.attachMedia(videoPlayer);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            videoPlayer.play().then(() => {
                playAttempted = true;
                hidePlaybackStatus();
            }).catch(error => {
                console.error('播放失败:', error);
                showPlaybackStatus('播放失败，正在重试...');
                // 在某些设备上（如投影仪），可能需要延迟播放
                setTimeout(() => {
                    videoPlayer.play().then(() => {
                        playAttempted = true;
                        hidePlaybackStatus();
                    }).catch(error => {
                        console.error('延迟播放也失败:', error);
                        showPlaybackStatus('播放失败，请稍后重试');
                    });
                }, 1000);
            });
        });
        hls.on(Hls.Events.ERROR, function(event, data) {
            console.error('HLS错误:', data);
            if (data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.error('网络错误:', data.details);
                        showPlaybackStatus('网络错误，无法加载视频');
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.error('媒体错误:', data.details);
                        showPlaybackStatus('媒体错误，无法播放视频');
                        // 尝试恢复
                        if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
                            hls.recoverMediaError();
                        }
                        break;
                    default:
                        console.error('播放错误:', data.details);
                        showPlaybackStatus('播放出错，请稍后重试');
                        break;
                }
            }
        });
    } else {
        // 不支持HLS或直接播放其他格式
        console.log('使用直接播放');
        videoPlayer.src = optimizedUrl;
        videoPlayer.load();
        
        // 添加更多错误处理
        videoPlayer.addEventListener('error', function(e) {
            console.error('视频播放错误:', e);
            showPlaybackStatus('视频播放出错，请检查设备兼容性');
        });
        
        // 添加播放状态监控
        const checkPlayStatus = () => {
            const elapsed = Date.now() - playStartTime;
            if (!playAttempted && videoPlayer.paused && videoPlayer.currentTime === 0 && elapsed > 3000) {
                // 如果视频3秒后仍未播放，显示状态
                showPlaybackStatus('正在尝试播放...');
            } else if (!videoPlayer.paused && videoPlayer.currentTime > 0) {
                // 正在播放
                hidePlaybackStatus();
            }
        };
        
        videoPlayer.play().then(() => {
            playAttempted = true;
            hidePlaybackStatus();
        }).catch(error => {
            console.error('播放失败:', error);
            showPlaybackStatus('播放失败，正在重试...');
            // 在某些设备上（如投影仪），可能需要延迟播放
            setTimeout(() => {
                videoPlayer.play().then(() => {
                    playAttempted = true;
                    hidePlaybackStatus();
                }).catch(error => {
                    console.error('延迟播放也失败:', error);
                    showPlaybackStatus('播放失败，请稍后重试');
                });
            }, 1000);
        });
        
        // 定期检查播放状态
        const statusCheckInterval = setInterval(checkPlayStatus, 1000);
        // 10秒后清除检查
        setTimeout(() => {
            clearInterval(statusCheckInterval);
        }, 10000);
    }
    
    // 更新选中的剧集样式
    const episodeItems = document.querySelectorAll('.episode-item');
    episodeItems.forEach((item, i) => {
        if (i === index) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // 保存最后播放的集数
    if (currentDramaId && sort) {
        lastPlayedEpisode[currentDramaId] = { sort: sort, index: index };
        saveLastPlayedEpisode();
    }
    
    // 播放时将画面定位到屏幕中心
    setTimeout(() => {
        // 定位到视频播放器区域
        const videoPlayer = document.getElementById('videoPlayer');
        if (videoPlayer) {
            const rect = videoPlayer.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const centerY = rect.top + scrollTop - window.innerHeight / 2 + videoPlayer.offsetHeight / 2;
            
            window.scrollTo({
                top: centerY,
                behavior: 'smooth'
            });
        }
    }, 100);
}

// 优化视频URL以提高兼容性
function optimizeVideoUrl(url) {
    // 如果URL表现为下载状态，尝试添加参数或修改URL
    if (url.includes('download') || url.includes('attachment')) {
        // 尝试移除可能导致下载的参数
        let optimizedUrl = url.replace(/[?&]download=true/g, '');
        optimizedUrl = optimizedUrl.replace(/[?&]disposition=attachment/g, '');
        return optimizedUrl;
    }
    return url;
}

// 获取视频格式
function getVideoFormat(url) {
    if (url.includes('.m3u8')) {
        return 'hls';
    } else if (url.includes('.mp4')) {
        return 'mp4';
    } else if (url.includes('.webm')) {
        return 'webm';
    } else if (url.includes('.ogg')) {
        return 'ogg';
    }
    // 默认返回hls
    return 'hls';
}

// 显示正在播放的集数
function showEpisodeNumber(episodeNumber) {
    // 创建或获取集数显示元素
    let episodeDisplay = document.getElementById('episodeNumberDisplay');
    if (!episodeDisplay) {
        episodeDisplay = document.createElement('div');
        episodeDisplay.id = 'episodeNumberDisplay';
        episodeDisplay.className = 'episode-number-display';
        document.querySelector('.video-player').appendChild(episodeDisplay);
    }
    
    // 显示集数
    episodeDisplay.textContent = `正在播放：第${episodeNumber}集`;
    episodeDisplay.style.display = 'block';
    
    // 10秒后隐藏
    setTimeout(() => {
        episodeDisplay.style.display = 'none';
    }, 10000);
}

// 保存最后播放的集数到本地存储（使用专用名称）
function saveLastPlayedEpisode() {
    try {
        localStorage.setItem('shortDramaLastPlayedEpisode', JSON.stringify(lastPlayedEpisode));
    } catch (e) {
        console.error('保存播放记录失败:', e);
    }
}

// 加载最后播放的集数
function loadLastPlayedEpisode() {
    try {
        const saved = localStorage.getItem('shortDramaLastPlayedEpisode');
        if (saved) {
            lastPlayedEpisode = JSON.parse(saved);
        }
    } catch (e) {
        console.error('加载播放记录失败:', e);
    }
}

// 保存收藏到本地存储（使用专用名称）
function saveFavorites() {
    try {
        localStorage.setItem('shortDramaFavorites', JSON.stringify(favorites));
    } catch (e) {
        console.error('保存收藏失败:', e);
    }
}

// 加载收藏
function loadFavorites() {
    try {
        const saved = localStorage.getItem('shortDramaFavorites');
        if (saved) {
            favorites = JSON.parse(saved);
        }
    } catch (e) {
        console.error('加载收藏失败:', e);
    }
}

// 返回搜索结果界面
function backToSearch() {
    // 暂停视频播放
    const videoPlayer = document.getElementById('videoPlayer');
    if (videoPlayer) {
        videoPlayer.pause();
    }
    
    // 销毁HLS实例（如果存在）
    if (hls) {
        hls.destroy();
        hls = null;
    }
    
    // 隐藏播放器区域
    playerSection.style.display = 'none';
    
    // 重新渲染搜索结果以确保显示
    renderDramaList(dramaList);
    
    // 滚动到搜索结果区域
    setTimeout(() => {
        const searchSection = document.querySelector('.search-section');
        if (searchSection) {
            const rect = searchSection.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const centerY = rect.top + scrollTop - window.innerHeight / 2 + searchSection.offsetHeight / 2;
            
            window.scrollTo({
                top: centerY,
                behavior: 'smooth'
            });
        }
    }, 100);
}

// 渲染分页控件
function renderPagination(totalPages, currentPage) {
    let html = '';
    
    // 上一页按钮
    html += `<button onclick="changePage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>上一页</button>`;
    
    // 页码按钮 (只显示前几页和后几页，避免过多按钮)
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<button class="active">${i}</button>`;
        } else {
            html += `<button onclick="goToPage(${i})">${i}</button>`;
        }
    }
    
    // 下一页按钮
    html += `<button onclick="changePage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>下一页</button>`;
    
    paginationContainer.innerHTML = html;
}

// 切换页面
function changePage(page) {
    if (page < 1) return;
    currentPage = page;
    searchDramas();
}

// 跳转到指定页面
function goToPage(page) {
    currentPage = page;
    searchDramas();
}

// 显示错误信息
function showError(container, message) {
    container.innerHTML = `<div class="error">${message}</div>`;
}

// 页面卸载时销毁HLS实例
window.addEventListener('beforeunload', function() {
    if (hls) {
        hls.destroy();
        hls = null;
    }
});
