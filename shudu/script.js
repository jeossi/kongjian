
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
        
        // 创建按钮数组
        const buttons = [];
        
        // 数字1-9按钮
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
            buttons.push(btn);
        }
        
        // X按钮
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
        
        // 按3x4布局排列按钮（标准九宫格顺序）
        // 第一行: 1, 2, 3
        numberButtonsContainer.appendChild(buttons[0]); // 1
        numberButtonsContainer.appendChild(buttons[1]); // 2
        numberButtonsContainer.appendChild(buttons[2]); // 3
        
        // 第二行: 4, 5, 6
        numberButtonsContainer.appendChild(buttons[3]); // 4
        numberButtonsContainer.appendChild(buttons[4]); // 5
        numberButtonsContainer.appendChild(buttons[5]); // 6
        
        // 第三行: 7, X, 9
        numberButtonsContainer.appendChild(buttons[6]); // 7
        numberButtonsContainer.appendChild(xBtn);       // X (在中间)
        numberButtonsContainer.appendChild(buttons[8]); // 9
        
        // 第四行: 8 (在最下面中间)
        numberButtonsContainer.appendChild(buttons[7]); // 8
        
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
    
    // 统一高亮处理函数
    function highlightCells(selector, className) {
        document.querySelectorAll(selector).forEach(cell => {
            cell.classList.add(className);
        });
    }
    
    // 高亮相关格子（行、列、宫）和相同数字
    function highlightRelatedCells(row, col) {
        // 清除之前的高亮
        clearAllHighlights();
        
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
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
    
    // 通用检查函数：检查指定区域是否存在指定数字
    function checkRegionForNumber(startRow, endRow, startCol, endCol, excludeRow, excludeCol, num) {
        const conflictCells = [];
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if ((excludeRow === -1 || r !== excludeRow) && (excludeCol === -1 || c !== excludeCol) && 
                    (userBoard[r][c] === num || board[r][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                }
            }
        }
        return conflictCells;
    }
    
    // 获取指定单元格的可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (isNumberValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        return isNumberValid(row, col, num);
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
            conflictCells = conflictCells.concat(checkRegionForNumber(row, row+1, 0, 9, row, col, num));
            // 列
            conflictCells = conflictCells.concat(checkRegionForNumber(0, 9, col, col+1, row, col, num));
            // 宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            conflictCells = conflictCells.concat(checkRegionForNumber(boxRowStart, boxRowStart+3, boxColStart, boxColStart+3, row, col, num));
            // 当前格
            conflictCells.push(cell);
            conflictCells.forEach(c => c && c.classList.add('conflict'));
            setTimeout(() => {
                conflictCells.forEach(c => c && c.classList.remove('conflict'));
            }, 1500);
            return;
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
            
            if (notes[row][col].some(note => note)) {
                updateCellNotes(row, col);
            }
        });

        errorCount = 0;
        moveHistory = [];
        updateUndoBadge();
        resetTimer();
        clearSelection(); // 清除选择状态

        updateNumberButtonsState();
        const hintBadge = document.querySelector('.hint-badge');
        hintBadge.textContent = '10';
        document.getElementById('hint-btn').disabled = false;
        document.getElementById('hint-btn').style.opacity = '1';
    }
    
    // 更新格子的笔记显示
    function updateCellNotes(row, col) {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cell.innerHTML = '';
        cell.classList.add('notes');
        
        if (!notes[row][col].some(note => note)) {
            cell.classList.remove('notes');
            return;
        }
        
        const notesContainer = document.createElement('div');
        notesContainer.style.display = 'grid';
        notesContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
        notesContainer.style.gridTemplateRows = 'repeat(3, 1fr)';
        notesContainer.style.width = '100%';
        notesContainer.style.height = '100%';
        
        for (let i = 0; i < 9; i++) {
            const note = document.createElement('div');
            note.style.display = 'flex';
            note.style.alignItems = 'center';
            note.style.justifyContent = 'center';
            
            if (notes[row][col][i]) {
                note.textContent = i + 1;
                note.style.fontSize = '0.8rem';
                note.style.fontWeight = 'bold';
                note.style.color = '#3498db';
            } else {
                note.textContent = '';
            }
            
            notesContainer.appendChild(note);
        }
        
        cell.appendChild(notesContainer);
    }
    
    // 切换笔记模式
    function toggleNotesMode() {
        notesMode = !notesMode;
        const notesBtn = document.getElementById('notes-btn');
        if (notesMode) {
            notesBtn.classList.add('active');
        } else {
            notesBtn.classList.remove('active');
        }
        notesBtn.querySelector('.notes-badge').textContent = notesMode ? '开' : '关';
        
        if (selectedCell.row !== -1 && selectedCell.col !== -1) {
            const cell = document.querySelector(`.cell[data-row="${selectedCell.row}"][data-col="${selectedCell.col}"]`);
            
            if (userBoard[selectedCell.row][selectedCell.col] === 0) {
                if (notes[selectedCell.row][selectedCell.col].some(note => note)) {
                    updateCellNotes(selectedCell.row, selectedCell.col);
                } else {
                    cell.textContent = '';
                    cell.classList.remove('notes');
                }
            }
        }
    }
    
    // 撤销操作
    function undoMove() {
        if (moveHistory.length === 0) {
            showMessage("没有可撤回的操作", "info");
            return;
        }

        const lastMove = moveHistory.pop();
        const { row, col, prevValue, prevNotes, prevErrorCount } = lastMove;
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);

        // 恢复错误计数
        errorCount = prevErrorCount;
        
        userBoard[row][col] = prevValue;
        notes[row][col] = [...prevNotes];

        cell.textContent = "";
        cell.classList.remove("user-input", "correct", "wrong", "notes");

        if (prevValue !== 0) {
            cell.textContent = prevValue;
            cell.classList.add("user-input");
            
            if (prevValue === solution[row][col]) {
                cell.classList.add("correct");
            } else {
                cell.classList.add("wrong");
            }
        } else if (prevNotes.some(note => note)) {
            updateCellNotes(row, col);
        }

        updateUndoBadge();
        updateNumberButtonsState();
        
        // 直接选中单元格但不触发输入操作
        clearAllHighlights();
        if (selectedCell.row !== -1 && selectedCell.col !== -1) {
            const prevCell = document.querySelector(`.cell[data-row="${selectedCell.row}"][data-col="${selectedCell.col}"]`);
            prevCell.classList.remove('selected');
        }
        selectedCell = { row, col };
        cell.classList.add('selected');
        highlightRelatedCells(row, col);
    }
    
    // 提供提示
    function giveHint() {
        const hintBtn = document.getElementById('hint-btn');
        const hintBadge = hintBtn.querySelector('.hint-badge');
        let hintCount = parseInt(hintBadge.textContent);

        if (hintCount <= 0) {
            showMessage('没有更多提示了！', 'error');
            return;
        }

        hintCount--;
        hintBadge.textContent = hintCount;

        let found = false;
        let technique = "简单推理";
        let targetRow = -1;
        let targetCol = -1;
        let targetNum = 0;

        // 策略1：寻找唯一可能数字的单元格
        found = findUniquePossibleCell();
        if (found) {
            [targetRow, targetCol, targetNum, technique] = found;
        }

        // 策略2：寻找行中唯一可能数字
        if (!found) {
            found = findUniqueInRow();
            if (found) {
                [targetRow, targetCol, targetNum, technique] = found;
            }
        }

        // 策略3：寻找列中唯一可能数字
        if (!found) {
            found = findUniqueInColumn();
            if (found) {
                [targetRow, targetCol, targetNum, technique] = found;
            }
        }

        // 策略4：寻找宫中唯一可能数字
        if (!found) {
            found = findUniqueInBox();
            if (found) {
                [targetRow, targetCol, targetNum, technique] = found;
            }
        }

        // 策略5：数对法
        if (!found) {
            found = findNakedPairTechnique();
            if (found) {
                [targetRow, targetCol, targetNum, technique] = found;
            }
        }

        // 策略6：区块摒除法
        if (!found) {
            found = findBlockElimination();
            if (found) {
                [targetRow, targetCol, targetNum, technique] = found;
            }
        }

        // 策略7：三链数法
        if (!found) {
            found = findNakedTriple();
            if (found) {
                [targetRow, targetCol, targetNum, technique] = found;
            }
        }

        // 策略8：X-Wing法
        if (!found) {
            found = findXWing();
            if (found) {
                [targetRow, targetCol, targetNum, technique] = found;
            }
        }

        // 策略9：从空白单元格中随机选择
        if (!found) {
            found = findRandomEmptyCell();
            if (found) {
                [targetRow, targetCol, targetNum, technique] = found;
            }
        }

        if (found) {
            // 双重检查目标单元格是否为空
            if (userBoard[targetRow][targetCol] !== 0 || board[targetRow][targetCol] !== 0) {
                console.error('提示错误：目标单元格已被占用', {targetRow, targetCol, userBoard: userBoard[targetRow][targetCol], board: board[targetRow][targetCol]});
                showMessage('提示错误：目标单元格已被占用', 'error');
                // 恢复提示次数
                hintCount++;
                hintBadge.textContent = hintCount;
                return;
            }
            
            // 选择单元格并输入数字
            selectCell(targetRow, targetCol);
            inputNumber(targetNum);
            
            // 高亮提示
            const cell = document.querySelector(`.cell[data-row="${targetRow}"][data-col="${targetCol}"]`);
            cell.classList.add('hint-highlight');
            setTimeout(() => {
                cell.classList.remove('hint-highlight');
            }, 1500);
            
            showMessage(`方法：${technique}，已填入数字 ${targetNum}`, 'success');

            if (hintCount <= 0) {
                hintBtn.disabled = true;
                hintBtn.style.opacity = '0.5';
            }
        } else {
            hintBadge.textContent = hintCount + 1; // 恢复提示次数
            showMessage('无法找到提示！', 'error');
        }
    }
    
    // 策略1：寻找唯一可能数字的单元格
    function findUniquePossibleCell() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                // 确保单元格为空且未被填写
                if (userBoard[row][col] === 0 && board[row][col] === 0) {
                    const possibleNumbers = [];
                    for (let num = 1; num <= 9; num++) {
                        if (isNumberValid(row, col, num)) {
                            possibleNumbers.push(num);
                        }
                    }

                    if (possibleNumbers.length === 1) {
                        return [row, col, possibleNumbers[0], "唯一可能"];
                    }
                }
            }
        }
        return null;
    }
    
    // 策略2：寻找行中唯一可能数字
    function findUniqueInRow() {
        for (let row = 0; row < 9; row++) {
            for (let num = 1; num <= 9; num++) {
                let count = 0;
                let colPos = -1;

                for (let col = 0; col < 9; col++) {
                    // 确保单元格为空且未被填写
                    if (userBoard[row][col] === 0 && board[row][col] === 0) {
                        if (isNumberValid(row, col, num)) {
                            count++;
                            colPos = col;
                        }
                    }
                }

                if (count === 1) {
                    return [row, colPos, num, "行唯一"];
                }
            }
        }
        return null;
    }
    
    // 策略3：寻找列中唯一可能数字
    function findUniqueInColumn() {
        for (let col = 0; col < 9; col++) {
            for (let num = 1; num <= 9; num++) {
                let count = 0;
                let rowPos = -1;

                for (let row = 0; row < 9; row++) {
                    // 确保单元格为空且未被填写
                    if (userBoard[row][col] === 0 && board[row][col] === 0) {
                        if (isNumberValid(row, col, num)) {
                            count++;
                            rowPos = row;
                        }
                    }
                }

                if (count === 1) {
                    return [rowPos, col, num, "列唯一"];
                }
            }
        }
        return null;
    }
    
    // 策略4：寻找宫中唯一可能数字
    function findUniqueInBox() {
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                for (let num = 1; num <= 9; num++) {
                    let count = 0;
                    let rowPos = -1;
                    let colPos = -1;

                    for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
                        for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
                            // 确保单元格为空且未被填写
                            if (userBoard[r][c] === 0 && board[r][c] === 0) {
                                if (isNumberValid(r, c, num)) {
                                    count++;
                                    rowPos = r;
                                    colPos = c;
                                }
                            }
                        }
                    }

                    if (count === 1) {
                        return [rowPos, colPos, num, "宫唯一"];
                    }
                }
            }
        }
        return null;
    }
    
    // 策略5：数对法
    function findNakedPairTechnique() {
        // 这里实现数对法的逻辑
        // 遍历所有单元格，寻找两个单元格只能包含相同的两个数字
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (userBoard[row][col] !== 0 || board[row][col] !== 0) continue;

                const possibleNumbers = getPossibleNumbers(row, col);
                if (possibleNumbers.length !== 2) continue;

                for (let otherCol = col + 1; otherCol < 9; otherCol++) {
                    if (userBoard[row][otherCol] !== 0 || board[row][otherCol] !== 0) continue;

                    const otherPossibleNumbers = getPossibleNumbers(row, otherCol);
                    if (otherPossibleNumbers.length === 2 && 
                        otherPossibleNumbers[0] === possibleNumbers[0] && 
                        otherPossibleNumbers[1] === possibleNumbers[1]) {
                        
                        // 数对法逻辑：在这两列中排除这两个数字
                        for (let c = 0; c < 9; c++) {
                            if (c === col || c === otherCol) continue;
                            if (userBoard[row][c] === 0 && board[row][c] === 0) {
                                for (let num of possibleNumbers) {
                                    if (canPlaceNumber(row, c, num)) {
                                        return [row, c, num, "数对法"];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
    
    // 策略6：区块摒除法
    function findBlockElimination() {
        // 这里实现区块摒除法的逻辑
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                for (let num = 1; num <= 9; num++) {
                    let positions = [];

                    for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
                        for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
                            if (userBoard[r][c] === 0 && board[r][c] === 0 && canPlaceNumber(r, c, num)) {
                                positions.push({row: r, col: c});
                            }
                        }
                    }

                    if (positions.length > 1) {
                        // 检查是否所有位置都在同一行或同一列
                        const sameRow = positions.every(pos => pos.row === positions[0].row);
                        const sameCol = positions.every(pos => pos.col === positions[0].col);

                        if (sameRow || sameCol) {
                            // 在行或列中排除这个数字
                            for (let i = 0; i < 9; i++) {
                                if (sameRow) {
                                    if (i !== positions[0].col && userBoard[positions[0].row][i] === 0 && board[positions[0].row][i] === 0 && canPlaceNumber(positions[0].row, i, num)) {
                                        return [positions[0].row, i, num, "区块摒除法"];
                                    }
                                } else if (sameCol) {
                                    if (i !== positions[0].row && userBoard[i][positions[0].col] === 0 && board[i][positions[0].col] === 0 && canPlaceNumber(i, positions[0].col, num)) {
                                        return [i, positions[0].col, num, "区块摒除法"];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
    
    // 策略7：三链数法
    function findNakedTriple() {
        // 这里实现三链数法的逻辑
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (userBoard[row][col] !== 0 || board[row][col] !== 0) continue;

                const possibleNumbers = getPossibleNumbers(row, col);
                if (possibleNumbers.length < 2 || possibleNumbers.length > 3) continue;

                for (let otherCol1 = col + 1; otherCol1 < 9; otherCol1++) {
                    if (userBoard[row][otherCol1] !== 0 || board[row][otherCol1] !== 0) continue;
                    const otherPossibleNumbers1 = getPossibleNumbers(row, otherCol1);
                    if (otherPossibleNumbers1.length < 2 || otherPossibleNumbers1.length > 3) continue;

                    for (let otherCol2 = otherCol1 + 1; otherCol2 < 9; otherCol2++) {
                        if (userBoard[row][otherCol2] !== 0 || board[row][otherCol2] !== 0) continue;
                        const otherPossibleNumbers2 = getPossibleNumbers(row, otherCol2);
                        if (otherPossibleNumbers2.length < 2 || otherPossibleNumbers2.length > 3) continue;

                        // 检查三个单元格的可能数字是否形成三链数
                        const allPossible = new Set([...possibleNumbers, ...otherPossibleNumbers1, ...otherPossibleNumbers2]);
                        if (allPossible.size === 3) {
                            // 三链数法逻辑：在这三个列中排除这三个数字
                            for (let c = 0; c < 9; c++) {
                                if (c === col || c === otherCol1 || c === otherCol2) continue;
                                if (userBoard[row][c] === 0 && board[row][c] === 0) {
                                    for (let num of allPossible) {
                                        if (canPlaceNumber(row, c, num)) {
                                            return [row, c, num, "三链数法"];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
    
    // 策略8：X-Wing法
    function findXWing() {
        // 这里实现X-Wing法的逻辑
        for (let num = 1; num <= 9; num++) {
            // 行方向的X-Wing
            const rowMap = {};
            for (let row = 0; row < 9; row++) {
                rowMap[row] = [];
                for (let col = 0; col < 9; col++) {
                    if (userBoard[row][col] === 0 && board[row][col] === 0 && canPlaceNumber(row, col, num)) {
                        rowMap[row].push(col);
                    }
                }
            }

            for (let row1 = 0; row1 < 9; row1++) {
                if (rowMap[row1].length !== 2) continue;

                for (let row2 = row1 + 1; row2 < 9; row2++) {
                    if (rowMap[row2].length !== 2) continue;

                    if (rowMap[row1][0] === rowMap[row2][0] && rowMap[row1][1] === rowMap[row2][1]) {
                        // X-Wing模式形成，排除相应列中的数字
                        for (let col = 0; col < 9; col++) {
                            if (col !== rowMap[row1][0] && col !== rowMap[row1][1]) {
                                if (userBoard[0][col] === 0 && board[0][col] === 0 && canPlaceNumber(0, col, num)) {
                                    return [0, col, num, "X-Wing法"];
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
    
    // 策略9：从空白单元格中随机选择
    function findRandomEmptyCell() {
        const emptyCells = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                // 确保单元格为空且未被填写
                if (userBoard[row][col] === 0 && board[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            const randomCell = emptyCells[randomIndex];
            return [randomCell.row, randomCell.col, solution[randomCell.row][randomCell.col], "随机选择"];
        }
        return null;
    }
    
    // 查找数对法
    function findNakedPair() {
        // 检查行
        for (let row = 0; row < 9; row++) {
            const pairs = {};
            for (let col = 0; col < 9; col++) {
                if (userBoard[row][col] !== 0 || givenCells[row][col]) continue;
                
                const possible = getPossibleNumbers(row, col);
                if (possible.length !== 2) continue;
                
                const key = possible.join('');
                if (!pairs[key]) {
                    pairs[key] = [{row, col}];
                } else {
                    pairs[key].push({row, col});
                    
                    if (pairs[key].length === 2) {
                        return {
                            region: `第${row+1}行`,
                            numbers: possible,
                            cells: pairs[key]
                        };
                    }
                }
            }
        }
        
        // 检查列
        for (let col = 0; col < 9; col++) {
            const pairs = {};
            for (let row = 0; row < 9; row++) {
                if (userBoard[row][col] !== 0 || givenCells[row][col]) continue;
                
                const possible = getPossibleNumbers(row, col);
                if (possible.length !== 2) continue;
                
                const key = possible.join('');
                if (!pairs[key]) {
                    pairs[key] = [{row, col}];
                } else {
                    pairs[key].push({row, col});
                    
                    if (pairs[key].length === 2) {
                        return {
                            region: `第${col+1}列`,
                            numbers: possible,
                            cells: pairs[key]
                        };
                    }
                }
            }
        }
        
        // 检查宫格
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                const pairs = {};
                for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
                    for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
                        if (userBoard[r][c] !== 0 || givenCells[r][c]) continue;
                        
                        const possible = getPossibleNumbers(r, c);
                        if (possible.length !== 2) continue;
                        
                        const key = possible.join('');
                        if (!pairs[key]) {
                            pairs[key] = [{row: r, col: c}];
                        } else {
                            pairs[key].push({row: r, col: c});
                            
                            if (pairs[key].length === 2) {
                                return {
                                    region: `第${boxRow * 3 + boxCol + 1}宫格`,
                                    numbers: possible,
                                    cells: pairs[key]
                                };
                            }
                        }
                    }
                }
            }
        }
        
        return null;
    }
    
    // 查找区块摒除法
    function findPointingPair() {
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                for (let num = 1; num <= 9; num++) {
                    let positions = [];
                    
                    // 检查当前宫格内该数字的可能位置
                    for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
                        for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
                            if (userBoard[r][c] !== 0 || givenCells[r][c]) continue;
                            if (canPlaceNumber(r, c, num)) {
                                positions.push({row: r, col: c});
                            }
                        }
                    }
                    
                    if (positions.length > 1 && positions.length <= 3) {
                        // 检查是否都在同一行
                        const sameRow = positions.every(p => p.row === positions[0].row);
                        if (sameRow) {
                            return {
                                number: num,
                                box: boxRow * 3 + boxCol + 1,
                                direction: `第${positions[0].row + 1}行`,
                                positions
                            };
                        }
                        
                        // 检查是否都在同一列
                        const sameCol = positions.every(p => p.col === positions[0].col);
                        if (sameCol) {
                            return {
                                number: num,
                                box: boxRow * 3 + boxCol + 1,
                                direction: `第${positions[0].col + 1}列`,
                                positions
                            };
                        }
                    }
                }
            }
        }
        return null;
    }
    
    // 查找三链数法
    function findNakedTriple() {
        // 检查行
        for (let row = 0; row < 9; row++) {
            const triples = {};
            for (let col = 0; col < 9; col++) {
                if (userBoard[row][col] !== 0 || givenCells[row][col]) continue;
                
                const possible = getPossibleNumbers(row, col);
                if (possible.length < 2 || possible.length > 3) continue;
                
                // 将可能的组合作为键
                const key = possible.join('');
                if (!triples[key]) {
                    triples[key] = [{row, col}];
                } else {
                    triples[key].push({row, col});
                    
                    // 检查是否有三个单元格共享相同的三个数字
                    if (triples[key].length === 3) {
                        return {
                            region: `第${row+1}行`,
                            numbers: possible,
                            cells: triples[key]
                        };
                    }
                }
            }
        }
        
        // 检查列
        for (let col = 0; col < 9; col++) {
            const triples = {};
            for (let row = 0; row < 9; row++) {
                if (userBoard[row][col] !== 0 || givenCells[row][col]) continue;
                
                const possible = getPossibleNumbers(row, col);
                if (possible.length < 2 || possible.length > 3) continue;
                
                const key = possible.join('');
                if (!triples[key]) {
                    triples[key] = [{row, col}];
                } else {
                    triples[key].push({row, col});
                    
                    if (triples[key].length === 3) {
                        return {
                            region: `第${col+1}列`,
                            numbers: possible,
                            cells: triples[key]
                        };
                    }
                }
            }
        }
        
        // 检查宫格
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                const triples = {};
                for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
                    for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
                        if (userBoard[r][c] !== 0 || givenCells[r][c]) continue;
                        
                        const possible = getPossibleNumbers(r, c);
                        if (possible.length < 2 || possible.length > 3) continue;
                        
                        const key = possible.join('');
                        if (!triples[key]) {
                            triples[key] = [{row: r, col: c}];
                        } else {
                            triples[key].push({row: r, col: c});
                            
                            if (triples[key].length === 3) {
                                return {
                                    region: `第${boxRow * 3 + boxCol + 1}宫格`,
                                    numbers: possible,
                                    cells: triples[key]
                                };
                            }
                        }
                    }
                }
            }
        }
        
        return null;
    }
    
    // 查找X-Wing法
    function findXWing() {
        // 行方向的X-Wing
        for (let num = 1; num <= 9; num++) {
            const rowMap = {};
            
            // 记录数字在每行出现的位置
            for (let row = 0; row < 9; row++) {
                rowMap[row] = [];
                for (let col = 0; col < 9; col++) {
                    if (userBoard[row][col] !== 0 || givenCells[row][col]) continue;
                    if (canPlaceNumber(row, col, num)) {
                        rowMap[row].push(col);
                    }
                }
            }
            
            // 检查是否有两行具有相同的两个位置
            for (let row1 = 0; row1 < 9; row1++) {
                if (rowMap[row1].length !== 2) continue;
                
                for (let row2 = row1 + 1; row2 < 9; row2++) {
                    if (rowMap[row2].length !== 2) continue;
                    
                    if (rowMap[row1][0] === rowMap[row2][0] && 
                        rowMap[row1][1] === rowMap[row2][1]) {
                        
                        const cells = [
                            {row: row1, col: rowMap[row1][0]},
                            {row: row1, col: rowMap[row1][1]},
                            {row: row2, col: rowMap[row2][0]},
                            {row: row2, col: rowMap[row2][1]}
                        ];
                        
                        return {
                            type: `第${row1+1}行和第${row2+1}行`,
                            number: num,
                            cells: cells
                        };
                    }
                }
            }
        }
        
        // 列方向的X-Wing
        for (let num = 1; num <= 9; num++) {
            const colMap = {};
            
            // 记录数字在每列出现的位置
            for (let col = 0; col < 9; col++) {
                colMap[col] = [];
                for (let row = 0; row < 9; row++) {
                    if (userBoard[row][col] !== 0 || givenCells[row][col]) continue;
                    if (canPlaceNumber(row, col, num)) {
                        colMap[col].push(row);
                    }
                }
            }
            
            // 检查是否有两列具有相同的两个位置
            for (let col1 = 0; col1 < 9; col1++) {
                if (colMap[col1].length !== 2) continue;
                
                for (let col2 = col1 + 1; col2 < 9; col2++) {
                    if (colMap[col2].length !== 2) continue;
                    
                    if (colMap[col1][0] === colMap[col2][0] && 
                        colMap[col1][1] === colMap[col2][1]) {
                        
                        const cells = [
                            {row: colMap[col1][0], col: col1},
                            {row: colMap[col1][1], col: col1},
                            {row: colMap[col2][0], col: col2},
                            {row: colMap[col2][1], col: col2}
                        ];
                        
                        return {
                            type: `第${col1+1}列和第${col2+1}列`,
                            number: num,
                            cells: cells
                        };
                    }
                }
            }
        }
        
        return null;
    }
    
    // 获取可能数字
    function getPossibleNumbers(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (canPlaceNumber(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }
    
    // 检查数字是否可以放置在指定位置
    function canPlaceNumber(row, col, num) {
        // 检查行和列
        for (let i = 0; i < 9; i++) {
            const rowValue = userBoard[row][i] || board[row][i];
            const colValue = userBoard[i][col] || board[i][col];
            if (rowValue === num || colValue === num) return false;
        }
        
        // 检查宫格
        const boxRowStart = Math.floor(row / 3) * 3;
        const boxColStart = Math.floor(col / 3) * 3;
        for (let r = boxRowStart; r < boxRowStart + 3; r++) {
            for (let c = boxColStart; c < boxColStart + 3; c++) {
                const value = userBoard[r][c] || board[r][c];
                if (value === num) return false;
            }
        }
        
        return true;
    }
    
    // 检查是否完成
    function checkCompletion() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                let currentValue;
                
                if (givenCells[row][col]) {
                    currentValue = board[row][col];
                } else {
                    currentValue = userBoard[row][col];
                }
                
                if (currentValue === 0) {
                    return false;
                }
                
                if (currentValue !== solution[row][col]) {
                    return false;
                }
            }
        }
        
        clearInterval(timerInterval);
        showFireworks();
        showMessage('恭喜你！挑战成功！', 'success');
        return true;
    }
    
    // 显示消息
    function showMessage(text, type) {
        messageDisplay.textContent = text;
        messageDisplay.className = `message ${type}`;
        
        messageDisplay.classList.remove('success');
        messageDisplay.classList.remove('error');
        messageDisplay.classList.remove('info');
        
        if (type === 'success') {
            messageDisplay.style.color = '#27ae60';
        } else if (type === 'error') {
            messageDisplay.style.color = '#e74c3c';
        } else if (type === 'info') {
            messageDisplay.style.color = '#3498db';
        }
    }
    
    // 开始数独计时器
    function startGameTimer() {
        startTime = Date.now();
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            timeDisplay.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }
    
    // 重置计时器
    function resetTimer() {
        clearInterval(timerInterval);
        startTime = 0;
        timeDisplay.textContent = '00:00';
        gameStarted = false;
    }
    
    // 分享数独状态
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
        });
    }
    
    // 从URL加载数独状态
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
        
        // 游戏渲染完成后执行缩放
        if (typeof window.onGameRendered === 'function') {
            window.onGameRendered();
        }
    }
    
    // 从本地题库加载数独
    async function fetchNewGame(difficulty = 'easy') {
        try {
            showMessage('加载题目中，请稍候...', 'info');

            let boardData, solutionData;
            currentDifficulty = difficulty;

            if (currentDatabase === 'recommended') {
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
                    // 提供备选方案，使用推荐数独
                    showMessage(`加载收藏题库失败，使用推荐数独: ${error.message}`, 'warning');
                    // 回退到推荐数独
                    currentDatabase = 'recommended';
                    // 重新调用函数
                    return await fetchNewGame(difficulty);
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
                    // 提供备选方案，使用推荐数独
                    showMessage(`加载本地题库失败，使用推荐数独: ${error.message}`, 'warning');
                    // 回退到推荐数独
                    currentDatabase = 'recommended';
                    // 重新调用函数
                    return await fetchNewGame(difficulty);
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
            const xBtn = document.querySelector('.number-btn[data-value="x"]');
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
        const { timeout = 8000 } = options;
        
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
