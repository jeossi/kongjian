// 播放列表数据源
const PLAYLIST_URL = 'https://d.kstore.dev/download/8043/ys/SCjieko.txt';

// 当前状态
let currentChannel = null;
let currentCategory = null;
let channelsData = [];
let currentEntries = [];
let currentChannelCategories = {};

// DOM 元素
let channelList;
let categoryGrid;
let entriesGrid;

// 初始化播放列表
function initPlaylist() {
    // 获取 DOM 元素
    channelList = document.getElementById('channel-list');
    categoryGrid = document.getElementById('category-grid');
    entriesGrid = document.getElementById('entries-grid');
    
    // 确保元素存在
    if (!channelList || !categoryGrid || !entriesGrid) {
        console.error('无法找到必要的 DOM 元素');
        return;
    }
    
    loadChannels();
}

// 加载线路数据
async function loadChannels() {
    try {
        const response = await fetch(PLAYLIST_URL);
        if (!response.ok) throw new Error('网络响应错误');
        
        const textData = await response.text();
        
        if (textData.startsWith('#EXTM3U')) {
            channelsData = [{
                name: "默认线路",
                url: PLAYLIST_URL,
                content: textData
            }];
        } else if (textData.includes(',#genre#')) {
            channelsData = [{
                name: "默认线路",
                url: PLAYLIST_URL,
                content: textData
            }];
        } else {
            try {
                const data = JSON.parse(textData);
                if (!Array.isArray(data)) throw new Error('无效的数据格式');
                channelsData = data;
            } catch (jsonError) {
                throw new Error('无法识别的数据格式');
            }
        }
        
        renderChannels(channelsData);
        
        if (channelsData.length > 0) {
            selectChannel(channelsData[0]);
        }
    } catch (error) {
        console.error('加载线路数据失败:', error);
        if (channelList) {
            channelList.innerHTML = '<li class="channel-item">数据加载失败，请刷新重试</li>';
        }
    }
}

// 渲染线路列表
function renderChannels(channels) {
    if (!channelList) return;
    
    channelList.innerHTML = '';
    
    channels.forEach((channel, index) => {
        const li = document.createElement('li');
        li.className = 'channel-item';
        if (index === 0) li.classList.add('active');
        li.textContent = channel.name;
        
        li.addEventListener('click', () => {
            selectChannel(channel);
        });
        
        channelList.appendChild(li);
    });
}

// 选择频道
async function selectChannel(channel) {
    currentChannel = channel;
    
    document.querySelectorAll('.channel-item').forEach((item, index) => {
        if (channelsData[index].name === channel.name) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    try {
        if (categoryGrid) {
            categoryGrid.innerHTML = '<div class="loading"><div class="loading-spinner"></div><span>加载分类中...</span></div>';
        }
        if (entriesGrid) {
            entriesGrid.innerHTML = '<div class="loading"><div class="loading-spinner"></div><span>加载内容中...</span></div>';
        }
        
        let content = '';
        
        if (channel.content) {
            content = channel.content;
        } else {
            const response = await fetch(channel.url);
            if (!response.ok) throw new Error('网络响应错误');
            content = await response.text();
        }
        
        let categories = {};
        
        if (content.includes(',#genre#')) {
            categories = parseTextFormat(content);
        } else if (content.startsWith('#EXTM3U')) {
            categories = parseM3UFormat(content);
        } else {
            throw new Error('未知的格式');
        }
        
        currentChannelCategories = categories;
        renderCategories(categories);
        
        const firstCategory = Object.keys(categories)[0];
        if (firstCategory) {
            selectCategory(firstCategory, categories[firstCategory]);
        }
    } catch (error) {
        console.error('加载分类数据失败:', error);
        if (categoryGrid) {
            categoryGrid.innerHTML = '<div class="category-item-container">数据加载失败</div>';
        }
        if (entriesGrid) {
            entriesGrid.innerHTML = '<div class="loading">数据加载失败，请刷新重试</div>';
        }
    }
}

// 解析文本格式数据
function parseTextFormat(content) {
    const lines = content.trim().split('\n');
    const categories = {};
    let currentCategory = null;
    
    for (const line of lines) {
        if (line.trim() === '') continue;
        
        if (line.includes(',#genre#')) {
            const parts = line.split(',#genre#');
            if (parts.length > 0) {
                currentCategory = parts[0].trim();
                if (currentCategory) {
                    categories[currentCategory] = [];
                }
            }
            continue;
        }
        
        const parts = line.split(',');
        if (parts.length >= 2 && currentCategory) {
            const channelName = parts[0].trim();
            const channelUrl = parts.slice(1).join(',').trim();
            if (channelName && channelUrl) {
                categories[currentCategory].push({ 
                    name: channelName, 
                    url: channelUrl 
                });
            }
        }
    }
    
    return categories;
}

// 解析M3U格式数据
function parseM3UFormat(content) {
    const lines = content.trim().split('\n');
    const categories = {};
    let currentCategory = "直播频道";
    categories[currentCategory] = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXTINF:')) {
            const parts = line.split(',');
            if (parts.length > 1) {
                const channelName = parts[parts.length - 1].trim();
                if (i + 1 < lines.length) {
                    const channelUrl = lines[i + 1].trim();
                    if (channelUrl && !channelUrl.startsWith('#')) {
                        categories[currentCategory].push({ 
                            name: channelName, 
                            url: channelUrl 
                        });
                        i++;
                    }
                }
            }
        }
    }
    
    return categories;
}

// 渲染分类列表
function renderCategories(categories) {
    if (!categoryGrid) return;
    
    categoryGrid.innerHTML = '';
    
    Object.keys(categories).forEach(category => {
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'category-item-container';
        categoryContainer.textContent = category;
        
        categoryContainer.addEventListener('click', () => {
            selectCategory(category, categories[category]);
        });
        
        categoryGrid.appendChild(categoryContainer);
    });
    
    if (categoryGrid.firstChild) {
        categoryGrid.firstChild.classList.add('active');
    }
}

// 选择分类
function selectCategory(category, entries) {
    currentCategory = category;
    currentEntries = entries;
    
    document.querySelectorAll('.category-item-container').forEach(item => {
        if (item.textContent === category) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    renderEntries(entries);
}

// 渲染条目列表
function renderEntries(entries) {
    if (!entriesGrid) return;
    
    entriesGrid.innerHTML = '';
    
    if (entries.length === 0) {
        entriesGrid.innerHTML = '<div class="entry-item">该分类下没有内容</div>';
        return;
    }
    
    entries.forEach((entry, index) => {
        const entryItem = document.createElement('div');
        entryItem.className = 'entry-item';
        entryItem.dataset.url = entry.url;
        entryItem.innerHTML = `<div class="entry-name">${entry.name}</div>`;
        
        entryItem.addEventListener('click', () => {
            // 移除之前选中的条目
            document.querySelectorAll('.entry-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // 高亮当前选中的条目
            entryItem.classList.add('active');
            
            // 播放选中的媒体
            playSelectedMedia(entry.url);
        });
        
        entriesGrid.appendChild(entryItem);
    });
}

// 播放选中的媒体
function playSelectedMedia(url) {
    // 更新URL输入框
    document.getElementById('url_box').value = url;
    
    // 触发播放按钮点击事件
    document.getElementById('url_btn').click();
}

// 初始化播放列表
document.addEventListener('DOMContentLoaded', initPlaylist);