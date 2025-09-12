document.addEventListener('DOMContentLoaded', () => {
    // 数独状态变量
    let board = Array(9).fill().map(() => Array(9).fill(0));
    let solution = Array(9).fill().map(() => Array(9).fill(0));
    let userBoard = Array(9).fill().map(() => Array(9).fill(0));
    let givenCells = Array(9).fill().map(() => Array(9).fill(false));
    let notes = Array(9).fill().map(() => Array(9).fill().map(() => Array(9).fill(false)));
    let selectedCell = { row: -1, col: -1 };
    let notesMode = false;
    let gameStarted = false;
    let startTime = 0;
    let timerInterval = null;
    let moveHistory = [];
    let currentDatabase = 'recommended';
    let currentDifficulty = 'easy';
    let errorCount = 0;
    let activeNumber = 1;
    let hasMouse = true;
    let isBoardHovered = false;
    
    // DOM 元素
    const sudokuBoard = document.getElementById('sudoku-board');
    const numberPad = document.getElementById('number-pad');
    const timeDisplay = document.getElementById('time');
    const messageDisplay = document.getElementById('message');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const databaseBtn = document.getElementById('database-btn');
    const databaseDropdown = document.getElementById('database-dropdown');
    const fireworksContainer = document.getElementById('fireworks-container');
    const customCursor = document.getElementById('custom-cursor');
    
    // 初始化数独板
    function initializeBoard() {
        sudokuBoard.innerHTML = '';
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => selectCell(row, col));
                sudokuBoard.appendChild(cell);
            }
        }
    }
    
    // 初始化数字键盘
    function initializeNumberPad() {
        numberPad.innerHTML = '';
        
        // 创建数字按钮容器
        const numberButtonsContainer = document.createElement('div');
        numberButtonsContainer.className = 'number-buttons-container';
        
        // 数字1-9
        for (let i = 1; i <= 9; i++) {
            const btn = document.createElement('button');
            btn.className = 'number-btn';
            btn.textContent = i;
            btn.dataset.value = i;
            btn.addEventListener('click', () => {
                // 清除之前的选择状态
                clearSelection();
                setActiveNumber(i);
            });
            numberButtonsContainer.appendChild(btn);
        }
        
        // 新增"x"按钮
        const xBtn = document.createElement('button');
        xBtn.className = 'number-btn';
        xBtn.textContent = 'X';
        xBtn.dataset.value = 'X';
        xBtn.style.backgroundColor = '#ff6b6b';
        xBtn.style.color = 'white';
        xBtn.addEventListener('click', () => {
            // 清除之前的选择状态
            clearSelection();
            setActiveNumber(0);
        });
        numberButtonsContainer.appendChild(xBtn);
        
        // 将容器添加到numberPad
        numberPad.appendChild(numberButtonsContainer);
    }
    
    // 清除选择状态
    function clearSelection() {
        if (selectedCell.row !== -1 && selectedCell.col !== -1) {
            const prevCell = document.querySelector(`.cell[data-row="${selectedCell.row}"][data-col="${selectedCell.col}"]`);
            prevCell.classList.remove('selected');
        }
        clearAllHighlights();
        selectedCell = { row: -1, col: -1 };
    }
    
    // 选择格子
    function selectCell(row, col) {
        // 清除之前的高亮
        clearAllHighlights();
        
        // 如果点击的不是同一个格子，取消之前选择的格子
        if (!(selectedCell.row === row && selectedCell.col === col)) {
            if (selectedCell.row !== -1 && selectedCell.col !== -1) {
                const prevCell = document.querySelector(`.cell[data-row="${selectedCell.row}"][data-col="${selectedCell.col}"]`);
                prevCell.classList.remove('selected');
            }
            
            // 选择新格子
            selectedCell = { row, col };
            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('selected');
            
            // 高亮相关格子（行、列、宫）和相同数字
            highlightRelatedCells(row, col);
        }
        
        // 启动计时器
        if (!gameStarted) {
            startGameTimer();
            gameStarted = true;
        }
        
        // 确保笔记显示正确
        if (userBoard[row][col] === 0 && notes[row][col].some(n => n)) {
            updateCellNotes(row, col);
        }
        
        // 获取单元格的值（优先用户输入，其次题目给定）
        const cellValue = userBoard[row][col] || board[row][col];
        // 如果连续输入状态是"X"，且点击的是用户输入的数字，执行删除操作
        if (activeNumber === 0 && userBoard[row][col] !== 0) {
            // 执行删除操作
            deleteNumber();
            return; // 删除后直接返回
        }
        
        // 如果单元格有值，则设置激活数字为该值并返回，不触发输入操作
        if (cellValue !== 0) {
            setActiveNumber(cellValue);
            return;
        }
        
        // 处理输入
        handleCellInput(row, col);
    }
    
    // 处理单元格输入
    function handleCellInput(row, col) {
        if (activeNumber === 0) {
            // 删除操作
            deleteNumber();
        } else {
            // 输入数字
            inputNumber(activeNumber);
        }
    }
    
    // 清除所有高亮状态的函数
    function clearAllHighlights() {
        clearHighlights();
        clearSameNumberHighlights();
        clearConflictHighlights();
    }
    
    // 清除高亮
    function clearHighlights() {
        document.querySelectorAll('.cell.highlighted').forEach(cell => {
            cell.classList.remove('highlighted');
        });
    }
    
    function clearSameNumberHighlights() {
        document.querySelectorAll('.cell.same-number-highlight').forEach(cell => {
            cell.classList.remove('same-number-highlight');
        });
    }

    // 新增：清除所有冲突格子
    function clearConflictHighlights() {
        document.querySelectorAll('.cell.conflict').forEach(cell => cell.classList.remove('conflict'));
    }
    
    // 高亮相关格子（行、列、宫）和相同数字
    function highlightRelatedCells(row, col) {
        // 高亮行
        for (let c = 0; c < 9; c++) {
            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${c}"]`);
            cell.classList.add('highlighted');
        }
        
        // 高亮列
        for (let r = 0; r < 9; r++) {
            const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${col}"]`);
            cell.classList.add('highlighted');
        }
        
        // 高亮宫
        const boxRowStart = Math.floor(row / 3) * 3;
        const boxColStart = Math.floor(col / 3) * 3;
        
        for (let r = boxRowStart; r < boxRowStart + 3; r++) {
            for (let c = boxColStart; c < boxColStart + 3; c++) {
                const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                cell.classList.add('highlighted');
            }
        }
        
        // 高亮相同数字
        const value = userBoard[row][col] || board[row][col];
        if (value !== 0) {
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    const cellValue = userBoard[r][c] || board[r][c];
                    if (cellValue === value) {
                        const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                        cell.classList.add('same-number-highlight');
                    }
                }
            }
        }
    }
    
    // 输入数字
    function inputNumber(num) {
        if (selectedCell.row === -1 || selectedCell.col === -1) return;
        if (givenCells[selectedCell.row][selectedCell.col]) return;

        const row = selectedCell.row;
        const col = selectedCell.col;
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);

        clearConflictHighlights();

        // 检查数字是否有效
        if (!isNumberValid(row, col, num)) {
            // 冲突格子都闪烁
            let conflictCells = [];
            // 行
            for (let c = 0; c < 9; c++) {
                if (c !== col && (userBoard[row][c] === num || board[row][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${row}"][data-col="${c}"]`));
                }
            }
            // 列
            for (let r = 0; r < 9; r++) {
                if (r !== row && (userBoard[r][col] === num || board[r][col] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${col}"]`));
                }
            }
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            for (let r = boxRowStart; r < boxRowStart + 3; r++) {
                for (let c = boxColStart; c < boxColStart + 3; c++) {
                    if ((r !== row || c !== col) && (userBoard[r][c] === num || board[r][c] === num)) {
                        conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                    }
                }
            }
            // 当前格
            conflictCells.push(cell);
            conflictCells.forEach(c => c && c.classList.add('conflict'));
            setTimeout(() => {
                conflictCells.forEach(c => c && c.classList.remove('conflict'));
            }, 1500);
            return;
        }
        
        // 保存历史（包含当前错误计数）
        const prevValue = userBoard[selectedCell.row][selectedCell.col];
        const prevNotes = JSON.parse(JSON.stringify(notes[selectedCell.row][selectedCell.col]));
        moveHistory.push({
            row: selectedCell.row,
            col: selectedCell.col,
            prevValue: prevValue,
            newValue: notesMode ? prevValue : num,
            prevNotes: JSON.parse(JSON.stringify(notes[selectedCell.row][selectedCell.col])),
            prevErrorCount: errorCount // 保存当前错误计数
        });
        
        if (notesMode) {
            // 笔记模式 - 切换笔记状态
            notes[selectedCell.row][selectedCell.col][num - 1] = !notes[selectedCell.row][selectedCell.col][num - 1];
            updateCellNotes(selectedCell.row, selectedCell.col);
        } else {
            // 正常模式 - 设置主数字
            userBoard[selectedCell.row][selectedCell.col] = num;
            
            // 清除该数字的所有笔记
            notes[selectedCell.row][selectedCell.col] = Array(9).fill(false);
            
            // 更新UI
            cell.textContent = num;
            cell.classList.remove('notes');
            
            // 检查数字是否正确
            if (num === solution[selectedCell.row][selectedCell.col]) {
                cell.classList.remove('wrong');
                cell.classList.add('user-input', 'correct');
            } else {
                cell.classList.remove('correct');
                cell.classList.add('user-input', 'wrong');
                // 错误计数增加
                errorCount++;
                updateUndoBadge();
            }
            
            // 检查是否完成
            if (checkCompletion()) {
                return; // 游戏完成时直接返回
            }
        }
        
        // 更新高亮
        highlightRelatedCells(selectedCell.row, selectedCell.col);
        
        // 检查数字按钮状态
        updateNumberButtonsState();
    }
    
    // 检查数字在单元格中是否有效
    function isNumberValid(row, col, num) {
        // 检查行
        for (let c = 0; c < 9; c++) {
            if (c !== col && (userBoard[row][c] === num || board[row][c] === num)) {
                return false;
            }
        }
        
        // 检查列
        for (let r = 0; r < 9; r++) {
            if (r !== row && (userBoard[r][col] === num || board[r][col] === num)) {
                return false;
            }
        }
        
        // 检查宫
        const boxRowStart = Math.floor(row / 3) * 3;
        const boxColStart = Math.floor(col / 3) * 3;
        
        for (let r = boxRowStart; r < boxRowStart + 3; r++) {
            for (let c = boxColStart; c < boxColStart + 3; c++) {
                if (r !== row && c !== col && (userBoard[r][c] === num || board[r][c] === num)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // 删除数字
    function deleteNumber() {
        if (selectedCell.row === -1 || selectedCell.col === -1) return;
        if (givenCells[selectedCell.row][selectedCell.col]) return;
        
        const cell = document.querySelector(`.cell[data-row="${selectedCell.row}"][data-col="${selectedCell.col}"]`);
        
        // 保存历史（包含当前错误计数）
        const prevValue = userBoard[selectedCell.row][selectedCell.col];
        const prevNotes = JSON.parse(JSON.stringify(notes[selectedCell.row][selectedCell.col]));
        moveHistory.push({
            row: selectedCell.row,
            col: selectedCell.col,
            prevValue: prevValue,
            newValue: 0,
            prevNotes: JSON.parse(JSON.stringify(notes[selectedCell.row][selectedCell.col])),
            prevErrorCount: errorCount // 保存当前错误计数
        });
        
        if (notesMode) {
            // 笔记模式 - 清除所有笔记
            notes[selectedCell.row][selectedCell.col] = Array(9).fill(false);
            updateCellNotes(selectedCell.row, selectedCell.col);
        } else {
            // 正常模式 - 如果单元格中有笔记，则清除笔记，否则清除主数字
            if (notes[selectedCell.row][selectedCell.col].some(note => note)) {
                // 清除笔记但保留主数字
                notes[selectedCell.row][selectedCell.col] = Array(9).fill(false);
                updateCellNotes(selectedCell.row, selectedCell.col);
            } else {
                // 清除主数字
                userBoard[selectedCell.row][selectedCell.col] = 0;
                cell.textContent = '';
                cell.classList.remove('user-input', 'correct', 'wrong');
                
                // 如果清除主数字后还有笔记，则显示笔记
                if (notes[selectedCell.row][selectedCell.col].some(note => note)) {
                    cell.classList.add('notes');
                    updateCellNotes(selectedCell.row, selectedCell.col);
                } else {
                    cell.classList.remove('notes');
                }
                
                // 如果清除的是错误输入，减少错误计数
                if (cell.classList.contains('wrong')) {
                    errorCount = Math.max(0, errorCount - 1);
                    updateUndoBadge();
                }
            }
        }
        
        // 更新高亮
        highlightRelatedCells(selectedCell.row, selectedCell.col);
        
        // 检查数字按钮状态
        updateNumberButtonsState();
    }
    
    // 全清除功能
    function clearAllNonGiven() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (!givenCells[row][col]) {
                    userBoard[row][col] = 0;
                    notes[row][col] = Array(9).fill(false);
                }
            }
        }

        const cells = document.querySelectorAll('.cell:not(.given)');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            cell.textContent = '';
            cell.classList.remove('user-input', 'correct', 'wrong', 'notes');
        });

        moveHistory = [];
        errorCount = 0;
        updateUndoBadge();
        clearAllHighlights();
        showMessage('已清除所有用户输入', 'success');
    }
    
    // 检查是否完成
    function checkCompletion() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (userBoard[row][col] === 0 && board[row][col] === 0) {
                    return false;
                }
                if (userBoard[row][col] !== 0 && userBoard[row][col] !== solution[row][col]) {
                    return false;
                }
            }
        }
        
        // 完成游戏
        clearInterval(timerInterval);
        showFireworks();
        showMessage('恭喜你完成了数独！', 'success');
        document.getElementById('hint-btn').disabled = true;
        return true;
    }
    
    // 撤回操作
    function undoMove() {
        if (moveHistory.length === 0) return;
        
        const lastMove = moveHistory.pop();
        const cell = document.querySelector(`.cell[data-row="${lastMove.row}"][data-col="${lastMove.col}"]`);
        
        // 恢复之前的值
        userBoard[lastMove.row][lastMove.col] = lastMove.prevValue;
        
        // 恢复之前的笔记
        notes[lastMove.row][lastMove.col] = lastMove.prevNotes;
        
        // 恢复错误计数
        errorCount = lastMove.prevErrorCount;
        updateUndoBadge();
        
        // 更新UI
        if (lastMove.prevValue === 0 && lastMove.prevNotes.some(note => note)) {
            // 如果之前是笔记模式且有笔记
            cell.classList.add('notes');
            updateCellNotes(lastMove.row, lastMove.col);
        } else if (lastMove.prevValue === 0) {
            // 如果之前是空的
            cell.textContent = '';
            cell.classList.remove('user-input', 'correct', 'wrong', 'notes');
        } else {
            // 如果之前有数字
            cell.textContent = lastMove.prevValue;
            cell.classList.remove('notes');
            if (lastMove.prevValue === solution[lastMove.row][lastMove.col]) {
                cell.classList.add('user-input', 'correct');
                cell.classList.remove('wrong');
            } else {
                cell.classList.add('user-input', 'wrong');
                cell.classList.remove('correct');
            }
        }
        
        // 更新高亮
        highlightRelatedCells(lastMove.row, lastMove.col);
        
        // 检查数字按钮状态
        updateNumberButtonsState();
        
        showMessage('已撤回上一步操作', 'info');
    }
    
    // 切换笔记模式
    function toggleNotesMode() {
        notesMode = !notesMode;
        const notesBtn = document.getElementById('notes-btn');
        const notesBadge = notesBtn.querySelector('.notes-badge');
        
        if (notesMode) {
            notesBtn.classList.add('active');
            notesBadge.textContent = '开';
            showMessage('已进入笔记模式，点击数字按钮添加/删除笔记', 'info');
        } else {
            notesBtn.classList.remove('active');
            notesBadge.textContent = '关';
            showMessage('已退出笔记模式', 'info');
        }
    }
    
    // 给提示
    function giveHint() {
        const hintBtn = document.getElementById('hint-btn');
        const hintBadge = hintBtn.querySelector('.hint-badge');
        let hintsLeft = parseInt(hintBadge.textContent);
        
        if (hintsLeft <= 0) {
            showMessage('提示次数已用完', 'warning');
            return;
        }
        
        // 找到一个空的单元格
        const emptyCells = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (userBoard[row][col] === 0 && board[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length === 0) {
            showMessage('数独已完成，无需提示', 'info');
            return;
        }
        
        // 随机选择一个空单元格
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const { row, col } = emptyCells[randomIndex];
        
        // 填入正确答案
        userBoard[row][col] = solution[row][col];
        
        // 更新UI
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = solution[row][col];
        cell.classList.add('user-input', 'correct');
        cell.classList.remove('wrong');
        
        // 减少提示次数
        hintsLeft--;
        hintBadge.textContent = hintsLeft;
        
        if (hintsLeft === 0) {
            hintBtn.disabled = true;
            hintBtn.style.opacity = '0.5';
        }
        
        // 保存到历史记录
        moveHistory.push({
            row,
            col,
            prevValue: 0,
            newValue: solution[row][col],
            prevNotes: Array(9).fill(false),
            prevErrorCount: errorCount
        });
        
        // 更新高亮
        highlightRelatedCells(row, col);
        
        // 检查数字按钮状态
        updateNumberButtonsState();
        
        // 检查是否完成
        if (checkCompletion()) {
            return;
        }
        
        showMessage(`已给出提示：第${row+1}行第${col+1}列应填入${solution[row][col]}`, 'success');
    }
    
    // 更新单元格笔记显示
    function updateCellNotes(row, col) {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cell.innerHTML = '';
        
        if (notes[row][col].some(note => note)) {
            cell.classList.add('notes');
            
            // 创建3x3网格显示笔记
            const noteGrid = document.createElement('div');
            noteGrid.className = 'note-grid';
            
            for (let i = 0; i < 9; i++) {
                const noteCell = document.createElement('div');
                noteCell.className = 'note-cell';
                if (notes[row][col][i]) {
                    noteCell.textContent = i + 1;
                }
                noteGrid.appendChild(noteCell);
            }
            
            cell.appendChild(noteGrid);
        } else {
            cell.classList.remove('notes');
        }
    }
    
    // 分享游戏
    function shareGame() {
        const gameState = {
            board: board,
            solution: solution,
            userBoard: userBoard,
            givenCells: givenCells,
            notes: notes,
            elapsedTime: Date.now() - startTime
        };
        
        const jsonStr = JSON.stringify(gameState);
        const compressed = pako.gzip(jsonStr);
        const base64Encoded = btoa(String.fromCharCode.apply(null, new Uint8Array(compressed)));
        const shareLink = `${window.location.origin}${window.location.pathname}?game=${encodeURIComponent(base64Encoded)}`;
        
        showMessage('分享链接已复制到剪贴板', 'success');
        navigator.clipboard.writeText(shareLink).then(() => {
            console.log('分享链接已复制');
        }).catch(err => {
            console.error('复制失败:', err);
            // 如果复制失败，显示链接
            showMessage('复制失败，请手动复制链接: ' + shareLink, 'info');
        });
    }
    
    // 启动游戏计时器
    function startGameTimer() {
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
    }
    
    // 更新计时器显示
    function updateTimer() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        timeDisplay.textContent = `${minutes}:${seconds}`;
    }
    
    // 重置计时器
    function resetTimer() {
        clearInterval(timerInterval);
        timeDisplay.textContent = '00:00';
        gameStarted = false;
    }
    
    // 显示消息
    function showMessage(text, type = 'info') {
        messageDisplay.textContent = text;
        messageDisplay.className = 'message';
        messageDisplay.classList.add(type);
    }
    
    // 从URL加载游戏
    function loadGameFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const gameParam = urlParams.get('game');
        
        if (gameParam) {
            try {
                const base64Decoded = atob(decodeURIComponent(gameParam));
                const binaryArray = new Uint8Array(base64Decoded.split('').map(char => char.charCodeAt(0)));
                const decompressed = pako.ungzip(binaryArray, { to: 'string' });
                const gameState = JSON.parse(decompressed);
                
                board = gameState.board;
                solution = gameState.solution;
                userBoard = gameState.userBoard;
                givenCells = gameState.givenCells;
                notes = gameState.notes;
                
                renderGame();
                startTime = Date.now() - gameState.elapsedTime;
                startGameTimer();
                gameStarted = true;
                
                showMessage('已加载分享的数独', 'success');
                return true;
            } catch (e) {
                console.error('加载数独失败:', e);
                showMessage('加载分享数独失败', 'error');
            }
        }
        return false;
    }
    
    // 从本地题库加载数独
    async function fetchNewGame(difficulty = 'easy') {
        try {
            showMessage('加载题目中，请稍候...', 'info');

            let boardData, solutionData;
            currentDifficulty = difficulty;

            if (currentDatabase === 'recommended') {
                try {
                    const boardResponse = await fetchWithTimeout(
                        `https://sugoku.onrender.com/board?difficulty=${difficulty}`,
                        { timeout: 5000 }
                    );

                    if (!boardResponse.ok) {
                        throw new Error('数独API请求失败');
                    }

                    boardData = await boardResponse.json();

                    const solutionResponse = await fetchWithTimeout(
                        'https://sugoku.onrender.com/solve',
                        {
                            method: 'POST',
                            body: encodeParams({ board: boardData.board }),
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            timeout: 5000
                        }
                    );

                    if (!solutionResponse.ok) {
                        throw new Error('题解API请求失败');
                    }

                    solutionData = await solutionResponse.json();
                } catch (error) {
                    console.error('加载推荐数独时出错:', error);
                    throw new Error(`加载推荐数独失败: ${error.message}`);
                }
            } else if (currentDatabase === 'backup') {
                // 修改后的收藏数独加载逻辑，与自用数独保持一致
                try {
                    console.log('开始加载收藏题库 SCduku.json');
                    let data;
                    
                    try {
                        // 首先尝试直接fetch
                        const response = await fetchWithTimeout('./SCduku.json', { timeout: 5000 });
                        console.log('收藏题库响应状态:', response.status);
                        
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        
                        data = await response.json();
                    } catch (fetchError) {
                        console.log('Fetch方式加载失败，尝试备选方案:', fetchError.message);
                        
                        // 如果fetch失败，尝试通过XMLHttpRequest加载
                        data = await new Promise((resolve, reject) => {
                            const xhr = new XMLHttpRequest();
                            xhr.open('GET', './SCduku.json', true);
                            xhr.timeout = 5000;
                            
                            xhr.onload = function() {
                                if (xhr.status === 200) {
                                    try {
                                        const jsonData = JSON.parse(xhr.responseText);
                                        resolve(jsonData);
                                    } catch (parseError) {
                                        reject(new Error('JSON解析失败: ' + parseError.message));
                                    }
                                } else {
                                    reject(new Error('HTTP error! status: ' + xhr.status));
                                }
                            };
                            
                            xhr.onerror = function() {
                                reject(new Error('网络错误'));
                            };
                            
                            xhr.ontimeout = function() {
                                reject(new Error('请求超时'));
                            };
                            
                            xhr.send();
                        });
                    }
                    
                    console.log('收藏题库数据加载成功:', data);

                    if (!Array.isArray(data.examplePuzzles)) {
                        throw new Error('examplePuzzles is not an array');
                    }

                    const filteredPuzzles = data.examplePuzzles.filter(puzzle => puzzle.difficulty === difficulty);
                    const puzzlesToUse = filteredPuzzles.length > 0 ? filteredPuzzles : data.examplePuzzles;
                    
                    if (puzzlesToUse.length === 0) {
                        throw new Error(`没有找到难度为 ${difficulty} 的题目`);
                    }
                    
                    const randomIndex = Math.floor(Math.random() * puzzlesToUse.length);
                    boardData = puzzlesToUse[randomIndex];
                    solutionData = { solution: boardData.solution };
                    
                    console.log('选中的题目:', boardData);
                } catch (error) {
                    console.error('加载收藏题库时出错:', error);
                    // 直接报错，不回退到推荐数独
                    throw new Error(`加载收藏数独失败: ${error.message}`);
                }
            } else if (currentDatabase === 'local') {
                try {
                    console.log('开始加载本地题库 BDsuduku.json');
                    let data;
                    
                    try {
                        // 首先尝试直接fetch
                        const response = await fetchWithTimeout('./BDsuduku.json', { timeout: 5000 });
                        console.log('本地题库响应状态:', response.status);
                        
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        
                        data = await response.json();
                    } catch (fetchError) {
                        console.log('Fetch方式加载失败，尝试备选方案:', fetchError.message);
                        
                        // 如果fetch失败，尝试通过XMLHttpRequest加载
                        data = await new Promise((resolve, reject) => {
                            const xhr = new XMLHttpRequest();
                            xhr.open('GET', './BDsuduku.json', true);
                            xhr.timeout = 5000;
                            
                            xhr.onload = function() {
                                if (xhr.status === 200) {
                                    try {
                                        const jsonData = JSON.parse(xhr.responseText);
                                        resolve(jsonData);
                                    } catch (parseError) {
                                        reject(new Error('JSON解析失败: ' + parseError.message));
                                    }
                                } else {
                                    reject(new Error('HTTP error! status: ' + xhr.status));
                                }
                            };
                            
                            xhr.onerror = function() {
                                reject(new Error('网络错误'));
                            };
                            
                            xhr.ontimeout = function() {
                                reject(new Error('请求超时'));
                            };
                            
                            xhr.send();
                        });
                    }
                    
                    console.log('本地题库数据加载成功:', data);

                    if (!Array.isArray(data.examplePuzzles)) {
                        throw new Error('examplePuzzles is not an array');
                    }

                    const filteredPuzzles = data.examplePuzzles.filter(puzzle => puzzle.difficulty === difficulty);
                    const puzzlesToUse = filteredPuzzles.length > 0 ? filteredPuzzles : data.examplePuzzles;
                    
                    if (puzzlesToUse.length === 0) {
                        throw new Error(`没有找到难度为 ${difficulty} 的题目`);
                    }
                    
                    const randomIndex = Math.floor(Math.random() * puzzlesToUse.length);
                    boardData = puzzlesToUse[randomIndex];
                    solutionData = { solution: boardData.solution };
                    
                    console.log('选中的题目:', boardData);
                } catch (error) {
                    console.error('加载本地题库时出错:', error);
                    // 直接报错，不回退到推荐数独
                    throw new Error(`加载自用数独失败: ${error.message}`);
                }
            }

            if (currentDatabase === 'recommended') {
                board = boardData.board;
                solution = solutionData.solution;
            } else if (currentDatabase === 'backup' || currentDatabase === 'local') {
                board = boardData.puzzle;
                solution = boardData.solution;
            }

            userBoard = Array(9).fill().map(() => Array(9).fill(0));
            notes = Array(9).fill().map(() => Array(9).fill().map(() => Array(9).fill(false)));
            moveHistory = [];
            errorCount = 0;
            updateUndoBadge();
            selectedCell = { row: -1, col: -1 };
            givenCells = board.map(row => row.map(cell => cell !== 0));
            renderGame();
            resetTimer();
            clearAllHighlights();
            clearSelection(); // 清除选择状态

            const hintBtn = document.getElementById('hint-btn');
            const hintBadge = hintBtn.querySelector('.hint-badge');
            hintBadge.textContent = '10';
            hintBtn.disabled = false;
            hintBtn.style.opacity = '1';

            let puzzleId = '未知ID';
            if (currentDatabase === 'local' || currentDatabase === 'backup') {
                puzzleId = boardData.id || '未知ID';
            }

            showMessage(`新数独已加载！难度: ${getDifficultyName(difficulty)}，题目ID: ${puzzleId}`, 'success');
            setActiveNumber(1);
        } catch (error) {
            console.error('获取数独失败:', error);
            showMessage(`加载失败: ${error.message}`, 'error');
        }
    }
            
    // 辅助函数：编码参数
    function encodeParams(params) {
        return Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(params[key]))}`)
            .join('&');
    }
    
    // 更新撤回按钮角标
    function updateUndoBadge() {
        const undoBadge = document.querySelector('.undo-badge');
        if (undoBadge) {
            undoBadge.textContent = errorCount;
        }
    }
    
    // 更新数字按钮状态
    function updateNumberButtonsState() {
        const counts = Array(10).fill(0);
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = userBoard[row][col] || board[row][col];
                if (value > 0 && value <= 9) {
                    counts[value]++;
                }
            }
        }
        
        for (let i = 1; i <= 9; i++) {
            const btn = document.querySelector(`.number-btn[data-value="${i}"]`);
            if (btn) {
                if (counts[i] >= 9) {
                    btn.classList.add('disabled');
                    btn.disabled = true;
                } else {
                    btn.classList.remove('disabled');
                    btn.disabled = false;
                }
            }
        }
    }
    
    // 显示烟花效果
    function showFireworks() {
        fireworksContainer.style.display = 'block';
        fireworksContainer.innerHTML = '';
        
        for (let i = 0; i < 100; i++) {
            const firework = document.createElement('div');
            firework.className = 'firework';
            
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            firework.style.left = `${left}%`;
            firework.style.top = `${top}%`;
            
            const colors = ['#FF5252', '#FFD740', '#64FFDA', '#448AFF', '#E040FB'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            firework.style.backgroundColor = color;
            
            const size = Math.random() * 100 + 2;
            firework.style.width = `${size}px`;
            firework.style.height = `${size}px`;
            
            firework.animate([
                { transform: 'scale(0)', opacity: 1 },
                { transform: 'scale(2)', opacity: 0 }
            ], {
                duration: Math.random() * 2000 + 1000,
                easing: 'cubic-bezier(0, 0.9, 0.57, 1)'
            });
            
            fireworksContainer.appendChild(firework);
        }
        
        setTimeout(() => {
            fireworksContainer.style.display = 'none';
            fireworksContainer.innerHTML = '';
        }, 3000);
    }
    
    // 设置激活的数字
    function setActiveNumber(num) {
        activeNumber = num;
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        if (num === 0) {
            const xBtn = document.querySelector('.number-btn[data-value="X"]');
            if (xBtn) xBtn.classList.add('active');
            customCursor.textContent = 'X';
            customCursor.style.background = 'rgba(255, 107, 107, 0.9)';
        } else {
            const nBtn = document.querySelector(`.number-btn[data-value="${num}"]`);
            if (nBtn) nBtn.classList.add('active');
            customCursor.textContent = num;
            customCursor.style.background = 'rgba(0, 0, 0, 0.9)';
        }
        highlightSameNumber();
    }
    
    // 高亮当前激活数字的相同数字
    function highlightSameNumber() {
        clearSameNumberHighlights();
        
        if (activeNumber === 0) return;
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = userBoard[row][col] || board[row][col];
                if (value === activeNumber) {
                    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                    cell.classList.add('same-number-highlight');
                }
            }
        }
    }
    
    // 设置难度按钮事件
    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            fetchNewGame(btn.dataset.difficulty);
        });
    });
    
    // 设置按钮事件
    document.getElementById('clear-btn').addEventListener('click', clearAllNonGiven);
    document.getElementById('trash-btn').addEventListener('click', deleteNumber);
    document.getElementById('undo-btn').addEventListener('click', undoMove);
    document.getElementById('notes-btn').addEventListener('click', toggleNotesMode);
    document.getElementById('hint-btn').addEventListener('click', giveHint);
    
    // 添加分享按钮事件监听器
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareGame);
    }
    
    // 数独线路下拉菜单功能添加
    document.getElementById('recommended-database').addEventListener('click', (e) => {
        e.preventDefault();
        currentDatabase = 'recommended';
        document.getElementById('database-name').textContent = '推荐数独';
        databaseDropdown.style.display = 'none';
        databaseBtn.classList.add('active');
        fetchNewGame(currentDifficulty);
    });
    
    document.getElementById('backup-database').addEventListener('click', (e) => {
        e.preventDefault();
        currentDatabase = 'backup';
        document.getElementById('database-name').textContent = '收藏数独';
        databaseDropdown.style.display = 'none';
        databaseBtn.classList.add('active');
        fetchNewGame(currentDifficulty);
    });
    
    document.getElementById('local-database').addEventListener('click', (e) => {
        e.preventDefault();
        currentDatabase = 'local';
        document.getElementById('database-name').textContent = '自用数独';
        databaseDropdown.style.display = 'none';
        databaseBtn.classList.add('active');
        fetchNewGame(currentDifficulty);
    });
    
    // 修复下拉菜单在移动端的问题
    function toggleDropdown() {
        if (databaseDropdown.style.display === 'block') {
            databaseDropdown.style.display = 'none';
            databaseBtn.classList.remove('dropdown-open');
        } else {
            databaseDropdown.style.display = 'block';
            databaseBtn.classList.add('dropdown-open');
        }
    }

    // 点击按钮显示/隐藏下拉菜单
    databaseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });

    // 触摸设备支持
    databaseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleDropdown();
    });

    // 点击页面其他位置关闭下拉菜单
    document.addEventListener('click', (e) => {
        if (!databaseBtn.contains(e.target)) {
            databaseDropdown.style.display = 'none';
            databaseBtn.classList.remove('dropdown-open');
        }
    });

    // 触摸设备关闭下拉菜单
    document.addEventListener('touchstart', (e) => {
        if (!databaseBtn.contains(e.target)) {
            databaseDropdown.style.display = 'none';
            databaseBtn.classList.remove('dropdown-open');
        }
    });

    // 阻止下拉菜单内的点击事件冒泡
    databaseDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // 触摸设备阻止下拉菜单内的触摸事件冒泡
    databaseDropdown.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    });
    
    // 带超时的fetch函数
    function fetchWithTimeout(url, options = {}) {
        const { timeout = 5000 } = options;
        
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('请求超时'));
            }, timeout);
            
            fetch(url, options)
                .then(response => {
                    clearTimeout(timer);
                    resolve(response);
                })
                .catch(err => {
                    clearTimeout(timer);
                    reject(err);
                });
        });
    }
    
    // 渲染数独
    function renderGame() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                cell.innerHTML = '';
                
                if (givenCells[row][col]) {
                    cell.textContent = board[row][col];
                    cell.classList.add('given');
                    cell.classList.remove('user-input', 'correct', 'wrong', 'notes');
                } else if (userBoard[row][col] !== 0) {
                    cell.textContent = userBoard[row][col];
                    
                    if (userBoard[row][col] === solution[row][col]) {
                        cell.classList.add('user-input', 'correct');
                    } else {
                        cell.classList.add('user-input', 'wrong');
                    }
                    
                    cell.classList.remove('given', 'notes');
                } else if (notes[row][col].some(note => note)) {
                    updateCellNotes(row, col);
                } else {
                    cell.textContent = '';
                    cell.classList.remove('given', 'user-input', 'correct', 'wrong', 'notes');
                }
            }
        }
        
        updateNumberButtonsState();
    }
    
    // 获取难度名称
    function getDifficultyName(difficulty) {
        const names = {
            'easy': '简单',
            'medium': '中等',
            'hard': '困难',
            'random': '随机'
        };
        return names[difficulty] || difficulty;
    }
    
    // 检测鼠标环境
    function detectMouseEnvironment() {
        try {
            new MouseEvent('test');
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // 初始化自定义光标
    function initCustomCursor() {
        hasMouse = detectMouseEnvironment();
        if (!hasMouse) {
            customCursor.style.display = 'none';
            return;
        }
        
        document.addEventListener('mousemove', (e) => {
            customCursor.style.left = `${e.clientX}px`;
            customCursor.style.top = `${e.clientY}px`;
            
            const boardRect = sudokuBoard.getBoundingClientRect();
            isBoardHovered = (
                e.clientX >= boardRect.left &&
                e.clientX <= boardRect.right &&
                e.clientY >= boardRect.top &&
                e.clientY <= boardRect.bottom
            );
            
            if (isBoardHovered) {
                customCursor.style.display = 'flex';
                document.body.style.cursor = 'none';
            } else {
                customCursor.style.display = 'none';
                document.body.style.cursor = 'default';
            }
        });
        
        sudokuBoard.addEventListener('wheel', (e) => {
            if (!isBoardHovered) return;
            
            e.preventDefault();
            
            // 清除之前的选择状态
            clearSelection();
            
            // 计算新的激活数字
            if (e.deltaY > 0) {
                activeNumber = activeNumber === 0 ? 1 : (activeNumber % 9) + 1;
            } else {
                activeNumber = activeNumber === 1 ? 0 : Math.max(0, activeNumber - 1);
            }
            
            setActiveNumber(activeNumber);
        });
    }
    
    // 检查初始鼠标位置
    function checkInitialMousePosition() {
        const event = new MouseEvent('mousemove', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }

    // 初始时隐藏下拉框
    databaseDropdown.style.display = 'none';
    
    // 初始化
    initializeBoard();
    initializeNumberPad();
    updateUndoBadge();
    initCustomCursor();
    
    // 检查初始鼠标位置
    setTimeout(checkInitialMousePosition, 100);
    
    // 尝试从URL加载数独，否则加载新数独
    if (!loadGameFromURL()) {
        fetchNewGame();
    }
});
