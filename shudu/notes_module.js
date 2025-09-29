// 笔记模块 - 独立处理数独笔记功能
class NotesModule {
    constructor() {
        // 笔记相关状态
        this.notesMode = false;
        // 初始化笔记数组（9x9的二维数组，每个元素是一个包含9个布尔值的数组）
        this.notes = Array(9).fill().map(() => Array(9).fill().map(() => Array(9).fill(false)));
    }
    
    // 初始化笔记模块
    init() {
        // 初始化UI状态
        this.updateNotesModeDisplay();
    }
    
    // 获取笔记数组
    getNotes() {
        return this.notes;
    }
    
    // 设置笔记数组
    setNotes(notes) {
        this.notes = notes;
    }
    
    // 清空所有笔记
    clearAllNotes() {
        this.notes = Array(9).fill().map(() => Array(9).fill().map(() => Array(9).fill(false)));
    }
    
    // 更新笔记模式显示
    updateNotesModeDisplay() {
        const notesBtn = document.getElementById('notes-btn');
        const notesBadge = notesBtn ? notesBtn.querySelector('.notes-badge') : null;
        
        if (notesBadge) {
            if (this.notesMode) {
                notesBtn.classList.add('active');
                notesBadge.textContent = '开';
            } else {
                notesBtn.classList.remove('active');
                notesBadge.textContent = '关';
            }
        }
    }
    
    // 切换笔记模式
    toggleNotesMode() {
        this.notesMode = !this.notesMode;
        this.updateNotesModeDisplay();
        
        return this.notesMode;
    }
    
    // 获取笔记模式状态
    isNotesMode() {
        return this.notesMode;
    }
    
    // 设置笔记模式状态
    setNotesMode(mode) {
        this.notesMode = mode;
        this.updateNotesModeDisplay();
    }
    
    // 更新单元格笔记显示
    updateCellNotes(row, col) {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        
        cell.innerHTML = '';
        cell.classList.add('notes');
        
        // 如果没有笔记，移除notes类
        if (!this.notes[row][col].some(note => note)) {
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
            
            if (this.notes[row][col][i]) {
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
    
    // 切换单元格笔记
    toggleCellNote(row, col, num, givenCells, userBoard, board, moveHistory, showMessage) {
        // 检查是否是题目给定的数字
        if (givenCells[row][col]) {
            showMessage('不能修改题目给定的数字！', 'error');
            return false;
        }
        
        // 检查当前单元格是否已经包含该笔记数字
        // 如果已经包含，则这次操作是移除笔记，不需要冲突检测
        const isRemovingNote = this.notes[row][col][num - 1];
        if (isRemovingNote) {
            // 保存到历史记录
            moveHistory.push({
                row: row,
                col: col,
                prevValue: userBoard[row][col],
                newValue: userBoard[row][col],
                prevNotes: [...this.notes[row][col]]
            });
            
            // 移除笔记
            this.notes[row][col][num - 1] = false;
            
            // 如果单元格有用户输入，清除用户输入
            if (userBoard[row][col] !== 0) {
                userBoard[row][col] = 0;
            }
            
            // 更新UI
            this.updateCellNotes(row, col);
            
            return true;
        }
        
        // 在笔记模式下也要进行冲突检测
        // 检查要添加的笔记数字是否与同行、同列、同宫的已填数字冲突
        let isConflict = false;
        let conflictCells = [];
        
        // 检查行
        for (let c = 0; c < 9; c++) {
            if (c !== col && (userBoard[row][c] === num || board[row][c] === num)) {
                isConflict = true;
                const conflictCell = document.querySelector(`.cell[data-row="${row}"][data-col="${c}"]`);
                if (conflictCell) {
                    conflictCells.push(conflictCell);
                }
            }
        }
        
        // 检查列
        for (let r = 0; r < 9; r++) {
            if (r !== row && (userBoard[r][col] === num || board[r][col] === num)) {
                isConflict = true;
                const conflictCell = document.querySelector(`.cell[data-row="${r}"][data-col="${col}"]`);
                if (conflictCell) {
                    conflictCells.push(conflictCell);
                }
            }
        }
        
        // 检查宫
        const boxRowStart = Math.floor(row / 3) * 3;
        const boxColStart = Math.floor(col / 3) * 3;
        for (let r = boxRowStart; r < boxRowStart + 3; r++) {
            for (let c = boxColStart; c < boxColStart + 3; c++) {
                if (!(r === row && c === col) && (userBoard[r][c] === num || board[r][c] === num)) {
                    isConflict = true;
                    const conflictCell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                    if (conflictCell) {
                        conflictCells.push(conflictCell);
                    }
                }
            }
        }
        
        // 如果有冲突，闪烁提示相关单元格
        if (isConflict) {
            // 当前单元格也加入冲突列表
            const currentCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            if (currentCell) {
                conflictCells.push(currentCell);
            }
            
            // 确保至少有一个冲突单元格
            if (conflictCells.length > 0) {
                // 闪烁效果
                conflictCells.forEach(cell => {
                    if (cell) {
                        cell.classList.add('conflict');
                    }
                });
                
                setTimeout(() => {
                    conflictCells.forEach(cell => {
                        if (cell) {
                            cell.classList.remove('conflict');
                        }
                    });
                }, 1500);
            }
            
            showMessage('数字冲突！请检查', 'error');
            return false; // 阻止添加笔记
        }
        
        // 保存到历史记录
        moveHistory.push({
            row: row,
            col: col,
            prevValue: userBoard[row][col],
            newValue: userBoard[row][col],
            prevNotes: [...this.notes[row][col]]
        });
        
        // 添加笔记
        this.notes[row][col][num - 1] = true;
        
        // 如果单元格有用户输入，清除用户输入
        if (userBoard[row][col] !== 0) {
            userBoard[row][col] = 0;
        }
        
        // 更新UI
        this.updateCellNotes(row, col);
        
        return true;
    }
    
    // 清除指定单元格的笔记
    clearCellNotes(row, col) {
        this.notes[row][col] = Array(9).fill(false);
        this.updateCellNotes(row, col);
    }
    
    // 获取指定单元格的笔记
    getCellNotes(row, col) {
        return this.notes[row][col];
    }
    
    // 设置指定单元格的笔记
    setCellNotes(row, col, notesArray) {
        this.notes[row][col] = notesArray;
        this.updateCellNotes(row, col);
    }
    
    // 检查指定单元格是否有笔记
    hasCellNotes(row, col) {
        return this.notes[row][col].some(note => note);
    }
    
    // 更新相关单元格的候选数（当用户输入新数字时调用）
    updateRelatedNotes(row, col, num, givenCells, userBoard, board) {
        // 更新同行的候选数
        for (let c = 0; c < 9; c++) {
            if (c !== col && !givenCells[row][c] && userBoard[row][c] === 0 && board[row][c] === 0) {
                this.notes[row][c][num - 1] = false;
                this.updateCellNotes(row, c);
            }
        }
        
        // 更新同列的候选数
        for (let r = 0; r < 9; r++) {
            if (r !== row && !givenCells[r][col] && userBoard[r][col] === 0 && board[r][col] === 0) {
                this.notes[r][col][num - 1] = false;
                this.updateCellNotes(r, col);
            }
        }
        
        // 更新同宫的候选数
        const boxRowStart = Math.floor(row / 3) * 3;
        const boxColStart = Math.floor(col / 3) * 3;
        for (let r = boxRowStart; r < boxRowStart + 3; r++) {
            for (let c = boxColStart; c < boxColStart + 3; c++) {
                if (!(r === row && c === col) && !givenCells[r][c] && userBoard[r][c] === 0 && board[r][c] === 0) {
                    this.notes[r][c][num - 1] = false;
                    this.updateCellNotes(r, c);
                }
            }
        }
    }
}

// 导出笔记模块
window.NotesModule = NotesModule;