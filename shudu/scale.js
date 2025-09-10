// 动态缩放功能以确保整个页面完整显示在可视区域内
function scaleSudokuContainer() {
    const gameContainer = document.querySelector('.game-container');
    const sudokuWrapper = document.querySelector('.sudoku-wrapper');
    const sudokuContainer = document.querySelector('.sudoku-container');
    
    if (!gameContainer) return;
    
    // 获取可视区域尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 检查是否为移动端（屏幕宽度小于等于480px）
    const isMobile = window.innerWidth <= 480;
    
    // 重置所有变换
    gameContainer.style.transform = '';
    if (sudokuWrapper) sudokuWrapper.style.transform = '';
    
    if (isMobile) {
        // 在移动端，将整个游戏容器缩放到填满可视区域
        // 强制重排以获取准确尺寸
        gameContainer.offsetHeight;
        
        // 获取游戏容器的实际尺寸
        const gameContainerRect = gameContainer.getBoundingClientRect();
        const gameContainerWidth = gameContainerRect.width || viewportWidth;
        const gameContainerHeight = gameContainerRect.height || viewportHeight;
        
        // 计算缩放比例，确保整个游戏容器能填满可视区域
        const scaleX = viewportWidth / gameContainerWidth;
        const scaleY = viewportHeight / gameContainerHeight;
        const scaleRatio = Math.min(scaleX, scaleY);
        
        // 应用缩放到游戏容器
        gameContainer.style.transform = `scale(${scaleRatio})`;
        gameContainer.style.transformOrigin = 'top left';
    } else {
        // 在大屏模式下，保持原有的缩放逻辑
        if (!sudokuWrapper || !sudokuContainer) return;
        
        const leftColumn = document.querySelector('.left-column');
        if (!leftColumn) return;
        
        // 获取可视区域高度
        const viewportHeight = window.innerHeight;
        // 获取可视区域宽度
        const viewportWidth = window.innerWidth;
        
        // 计算左列其他元素的高度
        const gameInfo = document.querySelector('.game-info');
        const infoContainer = document.querySelector('.info-container');
        const header = document.querySelector('.header');
        
        let otherElementsHeight = 40; // 默认边距
        
        if (header) {
            otherElementsHeight += header.offsetHeight;
        }
        
        if (gameInfo) {
            otherElementsHeight += gameInfo.offsetHeight;
        }
        
        if (infoContainer) {
            otherElementsHeight += infoContainer.offsetHeight;
        }
        
        // 计算可用于九宫格的最大高度和宽度
        const availableHeight = viewportHeight - otherElementsHeight - 50; // 额外边距
        const availableWidth = viewportWidth - 40; // 减少边距以适应大屏
        
        // 获取九宫格容器当前尺寸
        const sudokuHeight = sudokuContainer.offsetHeight;
        const sudokuWidth = sudokuContainer.offsetWidth;
        
        // 计算最大可用尺寸（考虑容器的实际可用空间）
        const maxSize = Math.min(availableHeight, availableWidth);
        
        // 如果九宫格尺寸超过可用尺寸，则进行缩放
        if ((sudokuHeight > availableHeight || sudokuWidth > availableWidth) && sudokuHeight > 0) {
            const scaleRatio = Math.min(maxSize / Math.max(sudokuHeight, sudokuWidth), 1); // 确保不超过原始大小
            
            // 应用缩放到九宫格包装容器
            sudokuWrapper.style.transform = `scale(${scaleRatio})`;
            sudokuWrapper.style.transformOrigin = 'top center';
        } else {
            // 如果不需要缩放，则移除缩放样式
            sudokuWrapper.style.transform = '';
        }
    }
}

// 页面加载完成后执行缩放
document.addEventListener('DOMContentLoaded', () => {
    // 初始化完成后执行缩放
    setTimeout(scaleSudokuContainer, 100);
    
    // 窗口大小改变时重新执行缩放
    window.addEventListener('resize', scaleSudokuContainer);
});

// 在游戏渲染完成后也执行缩放
function onGameRendered() {
    setTimeout(scaleSudokuContainer, 50);
}

// 提供一个全局函数供其他脚本调用
window.onGameRendered = onGameRendered;