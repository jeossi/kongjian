// 动态缩放功能以确保整个页面完整显示在可视区域内
function scaleGameContainer() {
    const gameContainer = document.querySelector('.game-container');
    const sudokuWrapper = document.querySelector('.sudoku-wrapper');
    const sudokuContainer = document.querySelector('.sudoku-container');
    
    if (!gameContainer || !sudokuWrapper || !sudokuContainer) return;
    
    // 获取可视区域尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 获取游戏容器的尺寸
    const gameContainerWidth = gameContainer.offsetWidth || 0;
    const gameContainerHeight = gameContainer.offsetHeight || 0;
    
    // 确保我们有有效的尺寸
    if (gameContainerWidth <= 0 || gameContainerHeight <= 0) {
        console.log('游戏容器尺寸无效，跳过缩放');
        return;
    }
    
    // 计算缩放比例，确保整个游戏容器都能显示在可视区域内
    const scaleX = viewportWidth / gameContainerWidth;
    const scaleY = viewportHeight / gameContainerHeight;
    const scaleRatio = Math.min(scaleX, scaleY, 1); // 确保不会放大超过原始尺寸
    
    console.log('缩放计算:', {
        viewportWidth,
        viewportHeight,
        gameContainerWidth,
        gameContainerHeight,
        scaleX,
        scaleY,
        scaleRatio
    });
    
    // 应用缩放
    if (scaleRatio < 1) {
        gameContainer.style.transform = `scale(${scaleRatio})`;
        gameContainer.style.transformOrigin = 'top left';
        console.log('应用缩放，比例:', scaleRatio);
    } else {
        gameContainer.style.transform = '';
        console.log('无需缩放');
    }
}

// 统一的屏幕缩放处理函数
function handleScreenScaling() {
    const sudokuWrapper = document.querySelector('.sudoku-wrapper');
    const sudokuContainer = document.querySelector('.sudoku-container');
    
    if (!sudokuWrapper || !sudokuContainer) return;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 为中等屏幕设置特殊样式
    sudokuWrapper.style.display = 'flex';
    sudokuWrapper.style.justifyContent = 'center';
    sudokuWrapper.style.alignItems = 'center';
    sudokuWrapper.style.maxWidth = '100%';
    sudokuWrapper.style.overflow = 'hidden';
    
    // 计算更精确的尺寸
    const targetSize = Math.min(viewportWidth - 30, viewportHeight - 200);
    const currentSize = Math.min(sudokuContainer.offsetWidth, sudokuContainer.offsetHeight);
    
    console.log('屏幕尺寸计算:', {targetSize, currentSize});
    
    if (currentSize > targetSize && targetSize > 0) {
        const scaleRatio = Math.min(targetSize / currentSize, 1);
        console.log('应用缩放，比例:', scaleRatio);
        sudokuWrapper.style.transform = `scale(${scaleRatio})`;
        sudokuWrapper.style.transformOrigin = 'top center';
    } else {
        console.log('无需缩放');
        sudokuWrapper.style.transform = '';
    }
}

// 页面加载完成后执行缩放
document.addEventListener('DOMContentLoaded', () => {
    // 初始化完成后执行缩放
    setTimeout(scaleGameContainer, 100);
    
    // 窗口大小改变时重新执行缩放
    window.addEventListener('resize', () => {
        // 添加延迟以确保DOM更新完成
        setTimeout(scaleGameContainer, 100);
    });
});

// 在游戏渲染完成后也执行缩放
function onGameRendered() {
    // 添加一个小延迟确保DOM完全更新
    setTimeout(() => {
        scaleGameContainer();
    }, 50);
}

// 提供一个全局函数供其他脚本调用
window.onGameRendered = onGameRendered;
