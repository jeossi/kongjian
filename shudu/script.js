// 修复后的JavaScript文件内容
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
            // 用户输入数字后清除解题技巧线条
            if (typeof window.clearTechniqueLines === "function") {
                window.clearTechniqueLines();
            }
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
        
        const { row, col } = selectedCell;
        if (givenCells[row][col]) {
            showMessage('不能修改题目给定的数字', 'error');
            return;
        }
        
        // 检查是否与现有数字冲突
        const isConflict = !isNumberValid(row, col, num);
        
        // 如果有冲突，闪烁提示相关单元格
        if (isConflict) {
            // 收集冲突的单元格
            let conflictCells = [];
            
            // 检查行
            for (let c = 0; c < 9; c++) {
                if (c !== col && (userBoard[row][c] === num || board[row][c] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${row}"][data-col="${c}"]`));
                }
            }
            
            // 检查列
            for (let r = 0; r < 9; r++) {
                if (r !== row && (userBoard[r][col] === num || board[r][col] === num)) {
                    conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${col}"]`));
                }
            }
            
            // 检查宫
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;
            for (let r = boxRowStart; r < boxRowStart + 3; r++) {
                for (let c = boxColStart; c < boxColStart + 3; c++) {
                    if (!(r === row && c === col) && (userBoard[r][c] === num || board[r][c] === num)) {
                        conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                    }
                }
            }
            
            // 当前单元格也加入冲突列表
            const currentCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            conflictCells.push(currentCell);
            
            // 闪烁效果
            conflictCells.forEach(cell => {
                if (cell) cell.classList.add('conflict');
            });
            
            setTimeout(() => {
                conflictCells.forEach(cell => {
                    if (cell) cell.classList.remove('conflict');
                });
            }, 1500);
            
            showMessage('数字冲突！请检查', 'error');
            return; // 阻止输入
        }
        
        // 保存到历史记录
        moveHistory.push({
            row,
            col,
            prevValue: userBoard[row][col],
            newValue: num,
            prevNotes: [...notes[row][col]],
            prevErrorCount: errorCount
        });
        
        userBoard[row][col] = num;
        notes[row][col] = Array(9).fill(false);
        
        // 更新UI
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = num;
        
        // 检查输入的数字是否与解题结果一致
        if (num === solution[row][col]) {
            cell.classList.add('user-input', 'correct');
            cell.classList.remove('wrong');
        } else {
            cell.classList.add('user-input', 'wrong');
            cell.classList.remove('correct');
        }
        
        cell.classList.remove('notes');
        
        // 高亮相同数字
        highlightRelatedCells(row, col);
        
        // 检查是否完成
        if (checkCompletion()) {
            endGame();
            return;
        }
        
        updateNumberButtonsState();
    }

    // 删除数字
    function deleteNumber() {
        if (selectedCell.row === -1 || selectedCell.col === -1) return;
        
        const { row, col } = selectedCell;
        if (givenCells[row][col]) {
            showMessage('不能删除题目给定的数字', 'error');
            return;
        }
        
        // 保存到历史记录
        moveHistory.push({
            row,
            col,
            prevValue: userBoard[row][col],
            newValue: 0,
            prevNotes: [...notes[row][col]],
            prevErrorCount: errorCount
        });
        
        userBoard[row][col] = 0;
        notes[row][col] = Array(9).fill(false);
        
        // 更新UI
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = '';
        cell.classList.remove('user-input', 'correct', 'wrong');
        
        updateUndoBadge();
        updateNumberButtonsState();
        
        // 删除操作后清除解题技巧线条
        if (typeof window.clearTechniqueLines === "function") {
            window.clearTechniqueLines();
        }
        
        showMessage('已删除数字', 'success');
    }
    
    // 撤回操作
    function undoMove() {
        if (moveHistory.length === 0) {
            showMessage('没有可撤回的操作', 'info');
            return;
        }
        
        const lastMove = moveHistory.pop();
        userBoard[lastMove.row][lastMove.col] = lastMove.prevValue;
        notes[lastMove.row][lastMove.col] = lastMove.prevNotes;
        errorCount = lastMove.prevErrorCount;
        
        // 更新UI
        const cell = document.querySelector(`.cell[data-row="${lastMove.row}"][data-col="${lastMove.col}"]`);
        if (lastMove.prevValue === 0) {
            cell.textContent = '';
            cell.classList.remove('user-input', 'correct', 'wrong');
            if (lastMove.prevNotes.some(note => note)) {
                updateCellNotes(lastMove.row, lastMove.col);
            }
        } else {
            cell.textContent = lastMove.prevValue;
            cell.classList.add('user-input');
            cell.classList.remove('notes');
            if (lastMove.prevValue === solution[lastMove.row][lastMove.col]) {
                cell.classList.add('correct');
                cell.classList.remove('wrong');
            } else {
                cell.classList.add('wrong');
                cell.classList.remove('correct');
            }
        }
        
        updateUndoBadge();
        updateNumberButtonsState();
        
        // 撤回操作后清除解题技巧线条
        if (typeof window.clearTechniqueLines === "function") {
            window.clearTechniqueLines();
        }
        
        showMessage('已撤回上一步操作', 'success');
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
    
    // 更新单元格笔记显示
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
    
    // 检查数字是否有效（不冲突）
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
                if (!(r === row && c === col) && (userBoard[r][c] === num || board[r][c] === num)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // 检查是否完成
    function checkCompletion() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (userBoard[row][col] === 0 && board[row][col] === 0) {
                    return false;
                }
                if (userBoard[row][col] !== solution[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // 结束游戏
    function endGame() {
        clearInterval(timerInterval);
        showMessage('恭喜完成数独！', 'success');
        showFireworks();
    }
    
    // 清除所有非给定数字
    function clearAllNonGiven() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (!givenCells[row][col]) {
                    userBoard[row][col] = 0;
                    notes[row][col] = Array(9).fill(false);
                }
            }
        }
        
        moveHistory = [];
        errorCount = 0;
        updateUndoBadge();
        renderGame();
        clearAllHighlights();
        clearSelection();
        
        // 重置操作后清除解题技巧线条
        if (typeof window.clearTechniqueLines === "function") {
            window.clearTechniqueLines();
        }
        
        showMessage('已清除所有填写的数字和笔记', 'success');
        updateNumberButtonsState();
    }
    
    // 给出提示
    function giveHint() {
        const hintBtn = document.getElementById('hint-btn');
        const hintBadge = hintBtn.querySelector('.hint-badge');
        let hintsLeft = parseInt(hintBadge.textContent);
        
        if (hintsLeft <= 0) {
            showMessage('提示次数已用完！', 'error');
            return;
        }
        
        // 查找可以给出的提示
        let found = false;
        let technique = "";
        let targetRow = -1, targetCol = -1, targetNum = -1;
        let hintData = null; // 用于存储解题技巧的详细数据
        
        // 策略1：行唯一
        if (!found) {
            for (let row = 0; row < 9 && !found; row++) {
                for (let col = 0; col < 9 && !found; col++) {
                    if (userBoard[row][col] !== 0 || board[row][col] !== 0) continue;
                    
                    const possibleNumbers = getPossibleNumbers(row, col);
                    if (possibleNumbers.length === 1) {
                        found = true;
                        technique = "行唯一";
                        targetRow = row;
                        targetCol = col;
                        targetNum = possibleNumbers[0];
                    }
                }
            }
        }
        
        // 策略2：列唯一
        if (!found) {
            for (let col = 0; col < 9 && !found; col++) {
                for (let row = 0; row < 9 && !found; row++) {
                    if (userBoard[row][col] !== 0 || board[row][col] !== 0) continue;
                    
                    const possibleNumbers = getPossibleNumbers(row, col);
                    if (possibleNumbers.length === 1) {
                        found = true;
                        technique = "列唯一";
                        targetRow = row;
                        targetCol = col;
                        targetNum = possibleNumbers[0];
                    }
                }
            }
        }
        
        // 策略3：宫唯一
        if (!found) {
            for (let boxRow = 0; boxRow < 3 && !found; boxRow++) {
                for (let boxCol = 0; boxCol < 3 && !found; boxCol++) {
                    for (let row = boxRow * 3; row < boxRow * 3 + 3 && !found; row++) {
                        for (let col = boxCol * 3; col < boxCol * 3 + 3 && !found; col++) {
                            if (userBoard[row][col] !== 0 || board[row][col] !== 0) continue;
                            
                            const possibleNumbers = getPossibleNumbers(row, col);
                            if (possibleNumbers.length === 1) {
                                found = true;
                                technique = "宫唯一";
                                targetRow = row;
                                targetCol = col;
                                targetNum = possibleNumbers[0];
                            }
                        }
                    }
                }
            }
        }
        
        // 策略4：数对法
        if (!found) {
            // 检查行中的数对
            for (let row = 0; row < 9 && !found; row++) {
                const pairs = findNakedPairsInRow(row);
                for (const pair of pairs) {
                    const { col1, col2, nums } = pair;
                    // 检查同一行中其他单元格是否可以排除这些数字
                    for (let col = 0; col < 9; col++) {
                        if (col !== col1 && col !== col2 && userBoard[row][col] === 0 && board[row][col] === 0) {
                            for (const num of nums) {
                                if (canPlaceNumber(row, col, num)) {
                                    found = true;
                                    technique = "数对法";
                                    targetRow = row;
                                    targetCol = col;
                                    targetNum = num;
                                    // 保存数对法的相关数据
                                    hintData = {
                                        row: targetRow,
                                        col1: col1,
                                        col2: col2,
                                        num: targetNum,
                                        pairRow: row,
                                        pairCol1: col1,
                                        pairCol2: col2
                                    };
                                    break;
                                }
                            }
                            if (found) break;
                        }
                    }
                    if (found) break;
                }
            }
            
            // 检查列中的数对
            if (!found) {
                for (let col = 0; col < 9 && !found; col++) {
                    const pairs = findNakedPairsInCol(col);
                    for (const pair of pairs) {
                        const { row1, row2, nums } = pair;
                        // 检查同一列中其他单元格是否可以排除这些数字
                        for (let row = 0; row < 9; row++) {
                            if (row !== row1 && row !== row2 && userBoard[row][col] === 0 && board[row][col] === 0) {
                                for (const num of nums) {
                                    if (canPlaceNumber(row, col, num)) {
                                        found = true;
                                        technique = "数对法";
                                        targetRow = row;
                                        targetCol = col;
                                        targetNum = num;
                                        // 保存数对法的相关数据
                                        hintData = {
                                            row: targetRow,
                                            col1: col,
                                            col2: col,
                                            num: targetNum,
                                            pairRow: targetRow,
                                            pairCol1: col,
                                            pairCol2: col
                                        };
                                        break;
                                    }
                                }
                                if (found) break;
                            }
                        }
                        if (found) break;
                    }
                    if (found) break;
                }
            }
            
            // 检查宫中的数对
            if (!found) {
                for (let boxRow = 0; boxRow < 3 && !found; boxRow++) {
                    for (let boxCol = 0; boxCol < 3 && !found; boxCol++) {
                        const pairs = findNakedPairsInBox(boxRow, boxCol);
                        for (const pair of pairs) {
                            const { positions, nums } = pair;
                            // 检查同一宫中其他单元格是否可以排除这些数字
                            for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
                                for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
                                    const isPairPosition = positions.some(pos => pos.row === row && pos.col === col);
                                    if (!isPairPosition && userBoard[row][col] === 0 && board[row][col] === 0) {
                                        for (const num of nums) {
                                            if (canPlaceNumber(row, col, num)) {
                                                found = true;
                                                technique = "数对法";
                                                targetRow = row;
                                                targetCol = col;
                                                targetNum = num;
                                                // 保存数对法的相关数据
                                                hintData = {
                                                    row: targetRow,
                                                    col1: positions[0].col,
                                                    col2: positions[1].col,
                                                    num: targetNum,
                                                    pairRow: positions[0].row,
                                                    pairCol1: positions[0].col,
                                                    pairCol2: positions[1].col
                                                };
                                                break;
                                            }
                                        }
                                        if (found) break;
                                    }
                                }
                                if (found) break;
                            }
                            if (found) break;
                        }
                        if (found) break;
                    }
                }
            }
        }
        
        // 策略5：区块摒除法
        if (!found) {
            const pointingPairs = findPointingPairs();
            if (pointingPairs.length > 0) {
                const pair = pointingPairs[0];
                if (pair.excludePositions.length > 0) {
                    found = true;
                    technique = "区块摒除法";
                    targetRow = pair.excludePositions[0].row;
                    targetCol = pair.excludePositions[0].col;
                    targetNum = pair.num;
                    // 保存区块摒除法的相关数据
                    hintData = {
                        boxRow: pair.boxRow,
                        boxCol: pair.boxCol,
                        num: pair.num,
                        positions: pair.positions,
                        targetRow: targetRow,
                        targetCol: targetCol
                    };
                }
            }
        }
        
        // 策略6：三链数法
        if (!found) {
            // 这里实现三链数法的逻辑
            for (let row = 0; row < 9 && !found; row++) {
                for (let col = 0; col < 9 && !found; col++) {
                    if (userBoard[row][col] !== 0 || board[row][col] !== 0) continue;

                    const possibleNumbers = getPossibleNumbers(row, col);
                    if (possibleNumbers.length < 2 || possibleNumbers.length > 3) continue;

                    for (let otherCol1 = col + 1; otherCol1 < 9 && !found; otherCol1++) {
                        if (userBoard[row][otherCol1] !== 0 || board[row][otherCol1] !== 0) continue;
                        const otherPossibleNumbers1 = getPossibleNumbers(row, otherCol1);
                        if (otherPossibleNumbers1.length < 2 || otherPossibleNumbers1.length > 3) continue;

                        for (let otherCol2 = otherCol1 + 1; otherCol2 < 9 && !found; otherCol2++) {
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
                                                found = true;
                                                technique = "三链数法";
                                                targetRow = row;
                                                targetCol = c;
                                                targetNum = num;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // 策略7：矩形摒除法
        if (!found) {
            const rectangles = findRectangles();
            if (rectangles.length > 0) {
                const rectangle = rectangles[0];
                if (rectangle.excludePositions.length > 0) {
                    found = true;
                    technique = "矩形摒除法";
                    targetRow = rectangle.excludePositions[0].row;
                    targetCol = rectangle.excludePositions[0].col;
                    targetNum = rectangle.num;
                    // 保存矩形摒除法的相关数据
                    hintData = {
                        row1: rectangle.row1,
                        row2: rectangle.row2,
                        col1: rectangle.col1,
                        col2: rectangle.col2,
                        num: rectangle.num,
                        targetRow: targetRow,
                        targetCol: targetCol
                    };
                }
            }
        }
        
        // 策略8：X-Wing法
        if (!found) {
            // 这里实现X-Wing法的逻辑
            for (let num = 1; num <= 9 && !found; num++) {
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

                for (let row1 = 0; row1 < 9 && !found; row1++) {
                    if (rowMap[row1].length !== 2) continue;

                    for (let row2 = row1 + 1; row2 < 9 && !found; row2++) {
                        if (rowMap[row2].length !== 2) continue;

                        if (rowMap[row1][0] === rowMap[row2][0] && rowMap[row1][1] === rowMap[row2][1]) {
                            // X-Wing模式形成，排除相应列中的数字
                            for (let col = 0; col < 9; col++) {
                                if (col !== rowMap[row1][0] && col !== rowMap[row1][1]) {
                                    if (userBoard[0][col] === 0 && board[0][col] === 0 && canPlaceNumber(0, col, num)) {
                                        found = true;
                                        technique = "X-Wing法";
                                        targetRow = 0;
                                        targetCol = col;
                                        targetNum = num;
                                        // 保存X-Wing法的相关数据
                                        hintData = {
                                            row1: row1,
                                            row2: row2,
                                            col1: rowMap[row1][0],
                                            col2: rowMap[row1][1],
                                            num: num,
                                            targetRow: targetRow,
                                            targetCol: targetCol
                                        };
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // 策略9：从结果表中提取提示
        if (!found) {
            // 从solution结果表中提取一个未填写的单元格作为提示
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
                // 选择第一个空单元格作为提示（按照从上到下、从左到右的顺序）
                const firstEmptyCell = emptyCells[0];
                found = true;
                technique = "结果表提取";
                targetRow = firstEmptyCell.row;
                targetCol = firstEmptyCell.col;
                targetNum = solution[targetRow][targetCol];
            }
        }

        if (found) {
            // 双重检查目标单元格是否为空
            if (userBoard[targetRow][targetCol] !== 0 || board[targetRow][targetCol] !== 0) {
                console.error('提示错误：目标单元格已被占用', {targetRow, targetCol, userBoard: userBoard[targetRow][targetCol], board: board[targetRow][targetCol]});
                showMessage('提示错误：目标单元格已被占用', 'error');
                // 恢复提示次数
                hintsLeft++;
                hintBadge.textContent = hintsLeft;
                return;
            }
            
            // 检查是否与现有数字冲突（即使是提示也应该检查）
            const isConflict = !isNumberValid(targetRow, targetCol, targetNum);
            
            // 如果有冲突，闪烁提示相关单元格
            if (isConflict) {
                // 收集冲突的单元格
                let conflictCells = [];
                
                // 检查行
                for (let c = 0; c < 9; c++) {
                    if (c !== targetCol && (userBoard[targetRow][c] === targetNum || board[targetRow][c] === targetNum)) {
                        conflictCells.push(document.querySelector(`.cell[data-row="${targetRow}"][data-col="${c}"]`));
                    }
                }
                
                // 检查列
                for (let r = 0; r < 9; r++) {
                    if (r !== targetRow && (userBoard[r][targetCol] === targetNum || board[r][targetCol] === targetNum)) {
                        conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${targetCol}"]`));
                    }
                }
                
                // 检查宫
                const boxRowStart = Math.floor(targetRow / 3) * 3;
                const boxColStart = Math.floor(targetCol / 3) * 3;
                for (let r = boxRowStart; r < boxRowStart + 3; r++) {
                    for (let c = boxColStart; c < boxColStart + 3; c++) {
                        if (!(r === targetRow && c === targetCol) && (userBoard[r][c] === targetNum || board[r][c] === targetNum)) {
                            conflictCells.push(document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`));
                        }
                    }
                }
                
                // 当前单元格也加入冲突列表
                const currentCell = document.querySelector(`.cell[data-row="${targetRow}"][data-col="${targetCol}"]`);
                conflictCells.push(currentCell);
                
                // 闪烁效果
                conflictCells.forEach(cell => {
                    if (cell) cell.classList.add('conflict');
                });
                
                setTimeout(() => {
                    conflictCells.forEach(cell => {
                        if (cell) cell.classList.remove('conflict');
                    });
                }, 1500);
                
                showMessage('提示数字冲突！请检查', 'error');
                return; // 阻止输入
            }
            
            // 填入答案
            userBoard[targetRow][targetCol] = targetNum;
            
            // 更新UI
            const cell = document.querySelector(`.cell[data-row="${targetRow}"][data-col="${targetCol}"]`);
            cell.textContent = targetNum;
            
            // 检查输入的数字是否与解题结果一致
            if (targetNum === solution[targetRow][targetCol]) {
                cell.classList.add('user-input', 'correct');
                cell.classList.remove('wrong');
            } else {
                cell.classList.add('user-input', 'wrong');
                cell.classList.remove('correct');
            }
            
            // 减少提示次数
            hintsLeft--;
            hintBadge.textContent = hintsLeft;
            
            if (hintsLeft === 0) {
                hintBtn.disabled = true;
                hintBtn.style.opacity = '0.5';
            }
            
            // 保存到历史记录
            moveHistory.push({
                row: targetRow,
                col: targetCol,
                prevValue: 0,
                newValue: targetNum,
                prevNotes: Array(9).fill(false),
                prevErrorCount: errorCount
            });
            
            // 清除之前的高亮显示
            clearAllHighlights();
            
            // 高亮新写入的数字及相同的数
            highlightRelatedCells(targetRow, targetCol);
            
            // 高亮提示的单元格
            cell.classList.add('hint-highlight');
            setTimeout(() => {
                cell.classList.remove('hint-highlight');
            }, 1500);
            
            // 检查数字按钮状态
            updateNumberButtonsState();
            
            // 检查是否完成
            if (checkCompletion()) {
                return;
            }
            
            // 绘制解题技巧可视化
            if (technique === '行唯一') {
                if (typeof window.drawTechniqueVisualization === "function") {
                    window.drawTechniqueVisualization(technique, { row: targetRow, col: targetCol, num: targetNum });
                }
            } else if (technique === '列唯一') {
                if (typeof window.drawTechniqueVisualization === "function") {
                    window.drawTechniqueVisualization(technique, { row: targetRow, col: targetCol, num: targetNum });
                }
            } else if (technique === '宫唯一') {
                if (typeof window.drawTechniqueVisualization === "function") {
                    window.drawTechniqueVisualization(technique, { row: targetRow, col: targetCol, num: targetNum });
                }
            } else if (technique === '数对法') {
                // 传递数对法的完整数据
                if (typeof window.drawTechniqueVisualization === "function") {
                    window.drawTechniqueVisualization(technique, hintData || { 
                        row: targetRow, 
                        col1: targetCol, 
                        col2: targetCol, 
                        num: targetNum,
                        pairRow: targetRow,
                        pairCol1: targetCol,
                        pairCol2: targetCol
                    });
                }
            } else if (technique === '区块摒除法') {
                // 传递区块摒除法的完整数据
                if (typeof window.drawTechniqueVisualization === "function") {
                    window.drawTechniqueVisualization(technique, hintData || { 
                        boxRow: Math.floor(targetRow/3), 
                        boxCol: Math.floor(targetCol/3), 
                        num: targetNum, 
                        positions: [{row: targetRow, col: targetCol}],
                        targetRow: targetRow,
                        targetCol: targetCol
                    });
                }
            } else if (technique === '三链数法') {
                // 传递三链数法的完整数据
                if (typeof window.drawTechniqueVisualization === "function") {
                    window.drawTechniqueVisualization(technique, hintData || { 
                        row: targetRow, 
                        col1: targetCol, 
                        col2: targetCol, 
                        col3: targetCol, 
                        num: targetNum,
                        tripleRow: targetRow,
                        tripleCol1: targetCol,
                        tripleCol2: targetCol,
                        tripleCol3: targetCol
                    });
                }
            } else if (technique === 'X-Wing法') {
                // 传递X-Wing法的完整数据
                if (typeof window.drawTechniqueVisualization === "function") {
                    window.drawTechniqueVisualization(technique, hintData || { 
                        row1: targetRow, 
                        row2: targetRow, 
                        col1: targetCol, 
                        col2: targetCol, 
                        num: targetNum,
                        targetRow: targetRow,
                        targetCol: targetCol
                    });
                }
            }
            
            showMessage(`方法：${technique}，已填入数字 ${targetNum}`, 'success');
        } else {
            hintBadge.textContent = hintsLeft + 1; // 恢复提示次数
            showMessage('无法找到提示！', 'error');
        }
    }
    
    // 查找行中的数对
    function findNakedPairsInRow(row) {
        const pairs = [];
        const cellCandidates = [];
        
        // 获取行中每个空单元格的候选数字
        for (let col = 0; col < 9; col++) {
            if (userBoard[row][col] === 0 && board[row][col] === 0) {
                const candidates = [];
                for (let num = 1; num <= 9; num++) {
                    if (canPlaceNumber(row, col, num)) {
                        candidates.push(num);
                    }
                }
                if (candidates.length === 2) {
                    cellCandidates.push({ col, candidates });
                }
            }
        }
        
        // 查找相同的候选数字对
        for (let i = 0; i < cellCandidates.length; i++) {
            for (let j = i + 1; j < cellCandidates.length; j++) {
                const cell1 = cellCandidates[i];
                const cell2 = cellCandidates[j];
                
                // 检查两个单元格是否有相同的候选数字
                if (cell1.candidates[0] === cell2.candidates[0] && 
                    cell1.candidates[1] === cell2.candidates[1]) {
                    pairs.push({
                        col1: cell1.col,
                        col2: cell2.col,
                        nums: cell1.candidates
                    });
                }
            }
        }
        
        return pairs;
    }

    // 查找列中的数对
    function findNakedPairsInCol(col) {
        const pairs = [];
        const cellCandidates = [];
        
        // 获取列中每个空单元格的候选数字
        for (let row = 0; row < 9; row++) {
            if (userBoard[row][col] === 0 && board[row][col] === 0) {
                const candidates = [];
                for (let num = 1; num <= 9; num++) {
                    if (canPlaceNumber(row, col, num)) {
                        candidates.push(num);
                    }
                }
                if (candidates.length === 2) {
                    cellCandidates.push({ row, candidates });
                }
            }
        }
        
        // 查找相同的候选数字对
        for (let i = 0; i < cellCandidates.length; i++) {
            for (let j = i + 1; j < cellCandidates.length; j++) {
                const cell1 = cellCandidates[i];
                const cell2 = cellCandidates[j];
                
                // 检查两个单元格是否有相同的候选数字
                if (cell1.candidates[0] === cell2.candidates[0] && 
                    cell1.candidates[1] === cell2.candidates[1]) {
                    pairs.push({
                        row1: cell1.row,
                        row2: cell2.row,
                        nums: cell1.candidates
                    });
                }
            }
        }
        
        return pairs;
    }

    // 查找宫中的数对
    function findNakedPairsInBox(boxRow, boxCol) {
        const pairs = [];
        const cellCandidates = [];
        
        // 获取宫中每个空单元格的候选数字
        for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
            for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
                if (userBoard[row][col] === 0 && board[row][col] === 0) {
                    const candidates = [];
                    for (let num = 1; num <= 9; num++) {
                        if (canPlaceNumber(row, col, num)) {
                            candidates.push(num);
                        }
                    }
                    if (candidates.length === 2) {
                        cellCandidates.push({ row, col, candidates });
                    }
                }
            }
        }
        
        // 查找相同的候选数字对
        for (let i = 0; i < cellCandidates.length; i++) {
            for (let j = i + 1; j < cellCandidates.length; j++) {
                const cell1 = cellCandidates[i];
                const cell2 = cellCandidates[j];
                
                // 检查两个单元格是否有相同的候选数字
                if (cell1.candidates[0] === cell2.candidates[0] && 
                    cell1.candidates[1] === cell2.candidates[1]) {
                    pairs.push({
                        positions: [cell1, cell2],
                        nums: cell1.candidates
                    });
                }
            }
        }
        
        return pairs;
    }
    
    // 查找区块摒除法的机会
    function findPointingPairs() {
        const pointingPairs = [];
        
        // 检查每个宫格
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                // 检查每个数字
                for (let num = 1; num <= 9; num++) {
                    // 检查宫格中数字num的候选位置
                    const positions = [];
                    for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
                        for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
                            if (userBoard[row][col] === 0 && board[row][col] === 0 && canPlaceNumber(row, col, num)) {
                                positions.push({ row, col });
                            }
                        }
                    }
                    
                    // 如果候选位置在同一行或同一列，则形成区块摒除
                    if (positions.length >= 2) {
                        // 检查是否在同一行
                        const sameRow = positions.every(pos => pos.row === positions[0].row);
                        // 检查是否在同一列
                        const sameCol = positions.every(pos => pos.col === positions[0].col);
                        
                        if (sameRow || sameCol) {
                            // 查找可以排除数字的位置
                            const excludePositions = [];
                            if (sameRow) {
                                // 同一行，检查该行其他宫格中的位置
                                for (let col = 0; col < 9; col++) {
                                    // 跳过当前宫格中的列
                                    if (col >= boxCol * 3 && col < boxCol * 3 + 3) continue;
                                    
                                    if (userBoard[positions[0].row][col] === 0 && board[positions[0].row][col] === 0 && 
                                        canPlaceNumber(positions[0].row, col, num)) {
                                        excludePositions.push({ row: positions[0].row, col });
                                    }
                                }
                            } else if (sameCol) {
                                // 同一列，检查该列其他宫格中的位置
                                for (let row = 0; row < 9; row++) {
                                    // 跳过当前宫格中的行
                                    if (row >= boxRow * 3 && row < boxRow * 3 + 3) continue;
                                    
                                    if (userBoard[row][positions[0].col] === 0 && board[row][positions[0].col] === 0 && 
                                        canPlaceNumber(row, positions[0].col, num)) {
                                        excludePositions.push({ row, col: positions[0].col });
                                    }
                                }
                            }
                            
                            if (excludePositions.length > 0) {
                                pointingPairs.push({
                                    boxRow,
                                    boxCol,
                                    num,
                                    positions,
                                    excludePositions
                                });
                            }
                        }
                    }
                }
            }
        }
        
        return pointingPairs;
    }
    
    // 查找矩形摒除法的机会
    function findRectangles() {
        const rectangles = [];
        
        // 检查每个数字
        for (let num = 1; num <= 9; num++) {
            // 检查行方向的矩形
            for (let row1 = 0; row1 < 9; row1++) {
                const row1Positions = [];
                for (let col = 0; col < 9; col++) {
                    if (userBoard[row1][col] === 0 && board[row1][col] === 0 && canPlaceNumber(row1, col, num)) {
                        row1Positions.push(col);
                    }
                }
                
                // 只考虑恰好有2或3个候选位置的行
                if (row1Positions.length >= 2 && row1Positions.length <= 3) {
                    for (let row2 = row1 + 1; row2 < 9; row2++) {
                        const row2Positions = [];
                        for (let col = 0; col < 9; col++) {
                            if (userBoard[row2][col] === 0 && board[row2][col] === 0 && canPlaceNumber(row2, col, num)) {
                                row2Positions.push(col);
                            }
                        }
                        
                        // 检查两行是否有相同的候选位置
                        if (row2Positions.length >= 2 && row2Positions.length <= 3) {
                            const commonPositions = row1Positions.filter(pos => row2Positions.includes(pos));
                            
                            if (commonPositions.length >= 2) {
                                // 找到矩形模式，查找可以排除数字的位置
                                const excludePositions = [];
                                for (let col of commonPositions) {
                                    for (let row = 0; row < 9; row++) {
                                        // 跳过形成矩形的两行
                                        if (row === row1 || row === row2) continue;
                                        
                                        if (userBoard[row][col] === 0 && board[row][col] === 0 && 
                                            canPlaceNumber(row, col, num)) {
                                            excludePositions.push({ row, col });
                                        }
                                    }
                                }
                                
                                if (excludePositions.length > 0) {
                                    rectangles.push({
                                        row1,
                                        row2,
                                        col1: commonPositions[0],
                                        col2: commonPositions[1],
                                        num,
                                        excludePositions
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return rectangles;
    }
    
    // 查找X-Wing模式
    function findXWing() {
        const xWings = [];
        
        // 检查每个数字
        for (let num = 1; num <= 9; num++) {
            // 检查行方向的X-Wing
            for (let row1 = 0; row1 < 9; row1++) {
                const row1Positions = [];
                for (let col = 0; col < 9; col++) {
                    if (userBoard[row1][col] === 0 && board[row1][col] === 0 && canPlaceNumber(row1, col, num)) {
                        row1Positions.push(col);
                    }
                }
                
                // 只考虑恰好有两个候选位置的行
                if (row1Positions.length === 2) {
                    for (let row2 = row1 + 1; row2 < 9; row2++) {
                        const row2Positions = [];
                        for (let col = 0; col < 9; col++) {
                            if (userBoard[row2][col] === 0 && board[row2][col] === 0 && canPlaceNumber(row2, col, num)) {
                                row2Positions.push(col);
                            }
                        }
                        
                        // 检查两行是否有相同的候选位置
                        if (row2Positions.length === 2 && 
                            row1Positions[0] === row2Positions[0] && 
                            row1Positions[1] === row2Positions[1]) {
                            
                            // 找到X-Wing模式，查找可以排除数字的位置
                            const excludePositions = [];
                            for (let col of row1Positions) {
                                for (let row = 0; row < 9; row++) {
                                    // 跳过形成X-Wing的两行
                                    if (row === row1 || row === row2) continue;
                                    
                                    if (userBoard[row][col] === 0 && board[row][col] === 0 && 
                                        canPlaceNumber(row, col, num)) {
                                        excludePositions.push({ row, col });
                                    }
                                }
                            }
                            
                            if (excludePositions.length > 0) {
                                xWings.push({
                                    row1,
                                    row2,
                                    col1: row1Positions[0],
                                    col2: row1Positions[1],
                                    num,
                                    excludePositions
                                });
                            }
                        }
                    }
                }
            }
        }
        
        return xWings;
    }
    
    // 获取可能数字
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
        
        setTimeout(() => {
            if (messageDisplay.textContent === text) {
                messageDisplay.textContent = '';
                messageDisplay.className = 'message';
            }
        }, 3000);
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
        // 检查烟花容器是否存在
        if (!fireworksContainer) {
            console.error('烟花容器不存在');
            return;
        }
        
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
            
            // 添加动画结束后的清理
            firework.addEventListener('animationend', function() {
                if (firework.parentNode) {
                    firework.parentNode.removeChild(firework);
                }
            });
            
            fireworksContainer.appendChild(firework);
        }
        
        // 使用CSS动画而不是Web Animations API以提高兼容性
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
    
    // 添加缺失的loadSudoku函数
    function loadSudoku(puzzleId) {
        // 如果提供了puzzleId，则尝试加载特定题目
        if (puzzleId) {
            // 这里可以实现加载特定题目的逻辑
            showMessage(`正在加载题目 ID: ${puzzleId}`, 'info');
            // 暂时直接调用fetchNewGame作为替代方案
            fetchNewGame(currentDifficulty);
        } else {
            // 否则加载新游戏
            fetchNewGame(currentDifficulty);
        }
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
                        `https://corsproxy.io/https://sugoku.onrender.com/board?difficulty=${difficulty}`,
                        { timeout: 5000 }
                    );

                    if (!boardResponse.ok) {
                        throw new Error('数独API请求失败');
                    }

                    boardData = await boardResponse.json();

                    const solutionResponse = await fetchWithTimeout(
                        'https://corsproxy.io/https://sugoku.onrender.com/solve',
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
                // 加载收藏数独
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
                // 加载自用数独
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

            // 设置数独数据
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

            // 清除解题技巧线条
            if (typeof window.clearTechniqueLines === "function") {
                window.clearTechniqueLines();
            }

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
                } else {
                    cell.classList.remove('given', 'user-input', 'correct', 'wrong', 'notes');
                }
            }
        }
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

    // 添加缺失的loadGameFromURL函数
    function loadGameFromURL() {
        // 简单实现，始终返回false表示不从URL加载
        return false;
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
