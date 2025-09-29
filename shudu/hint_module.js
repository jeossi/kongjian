// 提示模块 - 独立处理数独提示功能
class HintModule {
    constructor() {
        // 提示相关状态
        this.hintsLeft = 10;
        
        // 解题技巧说明
        this.techniqueDescriptions = {
            "行唯一": {
                name: "唯一候选数法 (Naked Singles)",
                description: "在一个单元格中，当所有其他数字（1-9中）都因为同行、同列或同宫格内已存在而被排除时，这个单元格就只剩下唯一一个可能的数字。这是最基础的解题技巧。"
            },
            "列唯一": {
                name: "隐性唯一法 (Hidden Singles)",
                description: "在某一行、某一列或某一个宫格中，如果某个数字只能填入一个单元格（尽管该单元格内可能还有其他候选数），那么这个数字就必定属于这个单元格。这种方法需要仔细观察候选数分布。"
            },
            "宫唯一": {
                name: "排除法 (Cross-Hatching)",
                description: "通过观察一个数字在某行或某列的所有可能位置，利用其他已填入的数字来排除该数字在某些宫格内的可能性，从而锁定其唯一位置。这是一种重要的中级技巧。"
            },
            "数对法": {
                name: "数对法 (Naked Pairs)",
                description: "在某一行、某一列或某一个宫格中，如果两个单元格的候选数完全相同，并且都只包含两个相同的数字（例如，两个单元格都只有候选数{3,7}），那么这两个数字就必然占据这两个单元格。因此，这两个数字可以从该行、该列或该宫格的其他单元格的候选数中移除。这是一种常用的中级技巧。"
            },
            "隐性数对法": {
                name: "隐性数对法 (Hidden Pairs)",
                description: "在某一行、某一列或某一个宫格中，如果两个数字只出现在两个特定的单元格中（尽管这两个单元格可能还有其他候选数），那么这两个单元格就必然由这两个数字占据。因此，这两个单元格的其他候选数可以被移除。这是一种较难发现的技巧。"
            },
            "三链数法": {
                name: "三链数法 (Naked Triples)",
                description: "与'数对法'类似，但扩展到三个单元格和数字。如果某行、某列或某宫格中有三个单元格的候选数只包含三个特定的数字，那么这三个数字就必然占据这三个单元格，从而可以从该行、该列或该宫格的其他单元格中移除这些候选数。这是一种高级技巧，需要仔细分析候选数分布。"
            },
            "X-Wing法": {
                name: "X翼法 (X-Wing)",
                description: "当某个数字在两行中，都恰好只出现在两个相同的列的单元格中时，就形成了一个行方向的'X-Wing'模式；或者当某个数字在两列中，都恰好只出现在两个相同的行的单元格中时，就形成了一个列方向的'X-Wing'模式。这意味着该数字必须占据这两对单元格中的对角线位置。因此，可以从这两列（行方向X-Wing）或这两行（列方向X-Wing）的其他所有单元格中移除该数字作为候选数。这是一种重要的高级技巧。"
            },
            "区块摒除法": {
                name: "区块摒除法",
                description: "当一个数字在某个宫中只能出现在同一行或同一列时，可以排除该行或列其他宫中的这个数字。这是连接宫与行列的重要技巧，常用于中级和高级数独。"
            },
            "矩形摒除法": {
                name: "矩形摒除法",
                description: "当某个数字在两行中只出现在相同的两列时，就形成了一个矩形。这意味着该数字必须占据这两对单元格中的对角线位置。因此，可以从这两列的其他所有单元格中移除该数字作为候选数。这是一种高级技巧。"
            },
            "结果表提取": {
                name: "结果表提取",
                description: "从已计算完成的数独解答中直接提取一个尚未填写的单元格的正确数字。这是一种直接的提示方式，用于在无法应用其他技巧时提供帮助。这是最后的备选方案。"
            }
        };
        
        // 当前提示步骤
        this.currentStep = 0;
        this.totalSteps = 3;
        this.currentHint = null;
    }
    
    // 初始化提示模块
    init() {
        this.updateHintDisplay();
    }
    
    // 更新提示显示
    updateHintDisplay() {
        const hintBtn = document.getElementById('hint-btn');
        const hintBadge = hintBtn.querySelector('.hint-badge');
        if (hintBadge) {
            hintBadge.textContent = this.hintsLeft;
        }
        
        if (this.hintsLeft === 0) {
            hintBtn.disabled = true;
            hintBtn.style.opacity = '0.5';
        } else {
            hintBtn.disabled = false;
            hintBtn.style.opacity = '1';
        }
    }
    
    // 获取提示次数
    getHintsLeft() {
        return this.hintsLeft;
    }
    
    // 设置提示次数
    setHintsLeft(count) {
        this.hintsLeft = count;
        this.updateHintDisplay();
    }
    
    // 增加提示次数
    addHint() {
        this.hintsLeft++;
        this.updateHintDisplay();
    }
    
    // 减少提示次数
    useHint() {
        if (this.hintsLeft > 0) {
            this.hintsLeft--;
            this.updateHintDisplay();
            return true;
        }
        return false;
    }
    
    // 生成提示
    generateHint(userBoard, board, solution, getPossibleNumbers, canPlaceNumber, findNakedPairsInRow, 
                 findNakedPairsInCol, findNakedPairsInBox, findPointingPairs, findRectangles) {
        
        if (this.hintsLeft <= 0) {
            return { success: false, message: '提示次数已用完！' };
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
                        // 保存行唯一的相关数据
                        hintData = {
                            row: targetRow,
                            col: targetCol,
                            num: targetNum
                        };
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
                        // 保存列唯一的相关数据
                        hintData = {
                            row: targetRow,
                            col: targetCol,
                            num: targetNum
                        };
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
                                // 保存宫唯一的相关数据
                                hintData = {
                                    row: targetRow,
                                    col: targetCol,
                                    num: targetNum
                                };
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
                                        pairCol2: col2,
                                        targetRow: targetRow,
                                        targetCol: targetCol
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
                                            pairCol2: col,
                                            targetRow: targetRow,
                                            targetCol: targetCol
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
                                                    pairCol2: positions[1].col,
                                                    targetRow: targetRow,
                                                    targetCol: targetCol
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
            // 改进的三链数法实现，借鉴成熟项目的做法
            // 检查行方向的三链数
            for (let row = 0; row < 9 && !found; row++) {
                // 收集行中所有候选数字为2或3的空单元格
                const candidates = [];
                for (let col = 0; col < 9; col++) {
                    if (userBoard[row][col] !== 0 || board[row][col] !== 0) continue;
                    const possibleNumbers = getPossibleNumbers(row, col);
                    if (possibleNumbers.length >= 2 && possibleNumbers.length <= 3) {
                        candidates.push({col: col, numbers: new Set(possibleNumbers)});
                    }
                }
                
                // 寻找三链数模式
                if (candidates.length >= 3) {
                    // 检查所有可能的三元组合
                    for (let i = 0; i < candidates.length - 2 && !found; i++) {
                        for (let j = i + 1; j < candidates.length - 1 && !found; j++) {
                            for (let k = j + 1; k < candidates.length && !found; k++) {
                                const cand1 = candidates[i];
                                const cand2 = candidates[j];
                                const cand3 = candidates[k];
                                
                                // 检查三个单元格的可能数字是否形成三链数
                                const allPossible = new Set([...cand1.numbers, ...cand2.numbers, ...cand3.numbers]);
                                if (allPossible.size === 3) {
                                    // 三链数法逻辑：在这三个列中排除这三个数字
                                    for (let c = 0; c < 9 && !found; c++) {
                                        if (c === cand1.col || c === cand2.col || c === cand3.col) continue;
                                        if (userBoard[row][c] === 0 && board[row][c] === 0) {
                                            for (let num of allPossible) {
                                                if (canPlaceNumber(row, c, num)) {
                                                    found = true;
                                                    technique = "三链数法";
                                                    targetRow = row;
                                                    targetCol = c;
                                                    targetNum = num;
                                                    // 保存三链数法的相关数据
                                                    hintData = {
                                                        tripleRow: row,
                                                        tripleCol1: cand1.col,
                                                        tripleCol2: cand2.col,
                                                        tripleCol3: cand3.col,
                                                        numbers: Array.from(allPossible),
                                                        num: targetNum,
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
                }
            }
            
            // 检查列方向的三链数
            if (!found) {
                for (let col = 0; col < 9 && !found; col++) {
                    // 收集列中所有候选数字为2或3的空单元格
                    const candidates = [];
                    for (let row = 0; row < 9; row++) {
                        if (userBoard[row][col] !== 0 || board[row][col] !== 0) continue;
                        const possibleNumbers = getPossibleNumbers(row, col);
                        if (possibleNumbers.length >= 2 && possibleNumbers.length <= 3) {
                            candidates.push({row: row, numbers: new Set(possibleNumbers)});
                        }
                    }
                    
                    // 寻找三链数模式
                    if (candidates.length >= 3) {
                        // 检查所有可能的三元组合
                        for (let i = 0; i < candidates.length - 2 && !found; i++) {
                            for (let j = i + 1; j < candidates.length - 1 && !found; j++) {
                                for (let k = j + 1; k < candidates.length && !found; k++) {
                                    const cand1 = candidates[i];
                                    const cand2 = candidates[j];
                                    const cand3 = candidates[k];
                                    
                                    // 检查三个单元格的可能数字是否形成三链数
                                    const allPossible = new Set([...cand1.numbers, ...cand2.numbers, ...cand3.numbers]);
                                    if (allPossible.size === 3) {
                                        // 三链数法逻辑：在这三个行中排除这三个数字
                                        for (let r = 0; r < 9 && !found; r++) {
                                            if (r === cand1.row || r === cand2.row || r === cand3.row) continue;
                                            if (userBoard[r][col] === 0 && board[r][col] === 0) {
                                                for (let num of allPossible) {
                                                    if (canPlaceNumber(r, col, num)) {
                                                        found = true;
                                                        technique = "三链数法";
                                                        targetRow = r;
                                                        targetCol = col;
                                                        targetNum = num;
                                                        // 保存三链数法的相关数据
                                                        hintData = {
                                                            tripleCol: col,
                                                            tripleRow1: cand1.row,
                                                            tripleRow2: cand2.row,
                                                            tripleRow3: cand3.row,
                                                            numbers: Array.from(allPossible),
                                                            num: targetNum,
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
                    }
                }
            }
            
            // 检查宫格中的三链数
            if (!found) {
                for (let boxRow = 0; boxRow < 3 && !found; boxRow++) {
                    for (let boxCol = 0; boxCol < 3 && !found; boxCol++) {
                        // 收集宫格中所有候选数字为2或3的空单元格
                        const candidates = [];
                        for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
                            for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
                                if (userBoard[row][col] !== 0 || board[row][col] !== 0) continue;
                                const possibleNumbers = getPossibleNumbers(row, col);
                                if (possibleNumbers.length >= 2 && possibleNumbers.length <= 3) {
                                    candidates.push({row: row, col: col, numbers: new Set(possibleNumbers)});
                                }
                            }
                        }
                        
                        // 寻找三链数模式
                        if (candidates.length >= 3) {
                            // 检查所有可能的三元组合
                            for (let i = 0; i < candidates.length - 2 && !found; i++) {
                                for (let j = i + 1; j < candidates.length - 1 && !found; j++) {
                                    for (let k = j + 1; k < candidates.length && !found; k++) {
                                        const cand1 = candidates[i];
                                        const cand2 = candidates[j];
                                        const cand3 = candidates[k];
                                        
                                        // 检查三个单元格的可能数字是否形成三链数
                                        const allPossible = new Set([...cand1.numbers, ...cand2.numbers, ...cand3.numbers]);
                                        if (allPossible.size === 3) {
                                            // 三链数法逻辑：在宫格中排除这三个数字
                                            for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
                                                for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
                                                    const isTriplePosition = (
                                                        (cand1.row === row && cand1.col === col) ||
                                                        (cand2.row === row && cand2.col === col) ||
                                                        (cand3.row === row && cand3.col === col)
                                                    );
                                                    if (isTriplePosition) continue;
                                                    if (userBoard[row][col] === 0 && board[row][col] === 0) {
                                                        for (let num of allPossible) {
                                                            if (canPlaceNumber(row, col, num)) {
                                                                found = true;
                                                                technique = "三链数法";
                                                                targetRow = row;
                                                                targetCol = col;
                                                                targetNum = num;
                                                                // 保存三链数法的相关数据
                                                                hintData = {
                                                                    tripleBoxRow: boxRow,
                                                                    tripleBoxCol: boxCol,
                                                                    positions: [cand1, cand2, cand3],
                                                                    numbers: Array.from(allPossible),
                                                                    num: targetNum,
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
            // 改进的X-Wing法实现，借鉴成熟项目的做法
            // 检查每个数字
            for (let num = 1; num <= 9 && !found; num++) {
                // 检查行方向的X-Wing
                for (let row1 = 0; row1 < 9 && !found; row1++) {
                    const row1Positions = [];
                    for (let col = 0; col < 9; col++) {
                        if (userBoard[row1][col] === 0 && board[row1][col] === 0 && canPlaceNumber(row1, col, num)) {
                            row1Positions.push(col);
                        }
                    }
                    
                    // 只考虑恰好有两个候选位置的行
                    if (row1Positions.length === 2) {
                        for (let row2 = row1 + 1; row2 < 9 && !found; row2++) {
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
                                for (let col of row1Positions) {
                                    for (let row = 0; row < 9 && !found; row++) {
                                        // 跳过形成X-Wing的两行
                                        if (row === row1 || row === row2) continue;
                                        
                                        if (userBoard[row][col] === 0 && board[row][col] === 0 && 
                                            canPlaceNumber(row, col, num)) {
                                            found = true;
                                            technique = "X-Wing法";
                                            targetRow = row;
                                            targetCol = col;
                                            targetNum = num;
                                            // 保存X-Wing法的相关数据
                                            hintData = {
                                                row1: row1,
                                                row2: row2,
                                                col1: row1Positions[0],
                                                col2: row1Positions[1],
                                                num: num,
                                                targetRow: targetRow,
                                                targetCol: targetCol,
                                                type: "row" // 行方向的X-Wing
                                            };
                                            break;
                                        }
                                    }
                                    if (found) break;
                                }
                            }
                        }
                    }
                }
                
                // 检查列方向的X-Wing
                if (!found) {
                    for (let col1 = 0; col1 < 9 && !found; col1++) {
                        const col1Positions = [];
                        for (let row = 0; row < 9; row++) {
                            if (userBoard[row][col1] === 0 && board[row][col1] === 0 && canPlaceNumber(row, col1, num)) {
                                col1Positions.push(row);
                            }
                        }
                        
                        // 只考虑恰好有两个候选位置的列
                        if (col1Positions.length === 2) {
                            for (let col2 = col1 + 1; col2 < 9 && !found; col2++) {
                                const col2Positions = [];
                                for (let row = 0; row < 9; row++) {
                                    if (userBoard[row][col2] === 0 && board[row][col2] === 0 && canPlaceNumber(row, col2, num)) {
                                        col2Positions.push(row);
                                    }
                                }
                                
                                // 检查两列是否有相同的候选位置
                                if (col2Positions.length === 2 && 
                                    col1Positions[0] === col2Positions[0] && 
                                    col1Positions[1] === col2Positions[1]) {
                                    
                                    // 找到X-Wing模式，查找可以排除数字的位置
                                    for (let row of col1Positions) {
                                        for (let col = 0; col < 9 && !found; col++) {
                                            // 跳过形成X-Wing的两列
                                            if (col === col1 || col === col2) continue;
                                            
                                            if (userBoard[row][col] === 0 && board[row][col] === 0 && 
                                                canPlaceNumber(row, col, num)) {
                                                found = true;
                                                technique = "X-Wing法";
                                                targetRow = row;
                                                targetCol = col;
                                                targetNum = num;
                                                // 保存X-Wing法的相关数据
                                                hintData = {
                                                    col1: col1,
                                                    col2: col2,
                                                    row1: col1Positions[0],
                                                    row2: col1Positions[1],
                                                    num: num,
                                                    targetRow: targetRow,
                                                    targetCol: targetCol,
                                                    type: "col" // 列方向的X-Wing
                                                };
                                                break;
                                            }
                                        }
                                        if (found) break;
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
                // 保存结果表提取的相关数据
                hintData = {
                    row: targetRow,
                    col: targetCol,
                    num: targetNum
                };
            }
        }

        if (found) {
            return {
                success: true,
                technique: technique,
                targetRow: targetRow,
                targetCol: targetCol,
                targetNum: targetNum,
                hintData: hintData
            };
        } else {
            return { success: false, message: '无法找到合适的提示' };
        }
    }
    
    // 创建提示弹出面板
    createHintPopup(technique, hintData) {
        console.log('createHintPopup函数被调用', {technique, hintData}); // 调试信息
        // 保存当前提示数据
        this.currentHint = {
            technique: technique,
            data: hintData,
            step: 0
        };
        
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'hint-popup-overlay';
        overlay.id = 'hint-popup-overlay';
        
        // 创建面板
        const panel = document.createElement('div');
        panel.className = 'hint-popup-panel';
        panel.id = 'hint-popup-panel';
        
        // 面板头部
        const header = document.createElement('div');
        header.className = 'panel-header';
        
        const techniqueName = document.createElement('div');
        techniqueName.className = 'technique-name';
        techniqueName.textContent = this.getTechniqueName(technique);
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => this.closeHintPopup();
        
        header.appendChild(techniqueName);
        header.appendChild(closeBtn);
        
        // 面板内容
        const content = document.createElement('div');
        content.className = 'panel-content';
        this.updatePanelContent(content, technique, hintData, 0);
        
        // 面板底部
        const footer = document.createElement('div');
        footer.className = 'panel-footer';
        
        const navButtons = document.createElement('div');
        navButtons.className = 'nav-buttons';
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'nav-btn prev-btn';
        prevBtn.innerHTML = '&lt; 上一步';
        prevBtn.onclick = () => this.previousStep();
        prevBtn.disabled = true;
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'nav-btn next-btn';
        nextBtn.innerHTML = '下一步 &gt;';
        nextBtn.onclick = () => this.nextStep();
        console.log('下一步按钮已创建', nextBtn); // 调试信息
        
        navButtons.appendChild(prevBtn);
        navButtons.appendChild(nextBtn);
        
        const stepIndicators = document.createElement('div');
        stepIndicators.className = 'step-indicators';
        this.createStepIndicators(stepIndicators);
        
        footer.appendChild(navButtons);
        footer.appendChild(stepIndicators);
        
        // 组装面板
        panel.appendChild(header);
        panel.appendChild(content);
        panel.appendChild(footer);
        
        // 组装遮罩层
        overlay.appendChild(panel);
        
        // 添加到页面
        document.body.appendChild(overlay);
        
        // 应用半透明遮罩
        this.applyDimOverlay();
        
        // 绘制第一步的可视化效果
        this.drawVisualizationStep(0, technique, hintData);
        
        // 调整面板位置，确保在移动端不会遮挡九宫格
        this.adjustPanelPosition();
        
        // 添加窗口大小改变事件监听器
        window.addEventListener('resize', () => this.adjustPanelPosition());
    }
    
    // 调整面板位置，确保在不同屏幕尺寸下都能正确跟随按钮和数字键盘的位置
    adjustPanelPosition() {
        const panel = document.getElementById('hint-popup-panel');
        const sudokuBoard = document.getElementById('sudoku-board');
        const rightColumn = document.querySelector('.right-column');
        
        if (panel && sudokuBoard && rightColumn) {
            // 根据屏幕宽度采用不同的布局策略
            const screenWidth = window.innerWidth;
            
            if (screenWidth <= 768) {
                // 移动端：面板显示在九宫格下方
                const sudokuRect = sudokuBoard.getBoundingClientRect();
                
                // 使用固定宽度确保在所有小屏设备上显示一致
                const panelWidth = Math.min(screenWidth * 0.9, 400); // 最大400px
                
                panel.style.position = 'fixed';
                panel.style.bottom = '10px';
                panel.style.left = '50%';
                panel.style.transform = 'translateX(-50%)';
                panel.style.width = `${panelWidth}px`;
                panel.style.maxWidth = '90vw';
                panel.style.margin = '0';
                panel.style.maxHeight = '40vh';
                
                // 确保面板不会过高
                const panelHeight = panel.offsetHeight || 200;
                const viewportHeight = window.innerHeight;
                
                if (panelHeight > viewportHeight * 0.4) {
                    panel.style.maxHeight = '40vh';
                }
            } else if (screenWidth >= 1200) {
                // 大屏端：面板显示在九宫格右侧，不遮挡九宫格
                const sudokuRect = sudokuBoard.getBoundingClientRect();
                const rightColumnRect = rightColumn.getBoundingClientRect();
                
                // 计算面板的右侧位置，确保与右侧面板对齐
                panel.style.position = 'fixed';
                panel.style.right = `${window.innerWidth - rightColumnRect.right}px`;
                panel.style.top = `${sudokuRect.top}px`;
                panel.style.transform = 'none';
                panel.style.width = `${rightColumnRect.width}px`;
                panel.style.maxWidth = 'none';
                panel.style.margin = '0';
                panel.style.height = 'auto';
                panel.style.maxHeight = `${sudokuRect.height}px`;
                
                // 确保面板不会超出视窗底部
                const panelHeight = panel.offsetHeight;
                const viewportHeight = window.innerHeight;
                
                if (sudokuRect.top + panelHeight > viewportHeight) {
                    // 如果面板会超出视窗，则调整位置
                    const availableHeight = viewportHeight - sudokuRect.top - 20;
                    panel.style.maxHeight = `${availableHeight}px`;
                }
            } else {
                // 中等屏幕：采用响应式布局，面板显示在九宫格下方
                const sudokuRect = sudokuBoard.getBoundingClientRect();
                
                // 使用固定宽度确保在中等屏幕设备上显示一致
                const panelWidth = Math.min(screenWidth * 0.9, 400); // 最大400px
                
                panel.style.position = 'fixed';
                panel.style.bottom = '10px';
                panel.style.left = '50%';
                panel.style.transform = 'translateX(-50%)';
                panel.style.width = `${panelWidth}px`;
                panel.style.maxWidth = '90vw';
                panel.style.margin = '0';
                panel.style.maxHeight = '40vh';
                
                // 确保面板不会过高
                const panelHeight = panel.offsetHeight || 200;
                const viewportHeight = window.innerHeight;
                
                if (panelHeight > viewportHeight * 0.4) {
                    panel.style.maxHeight = '40vh';
                }
            }
        }
    }
    
    // 更新面板内容
    updatePanelContent(content, technique, hintData, step) {
        content.innerHTML = '';
        
        const techniqueName = this.getTechniqueName(technique);
        const description = this.getTechniqueDescription(technique);
        
        // 位置信息
        const positionInfo = document.createElement('div');
        positionInfo.className = 'position-info';
        if (hintData && hintData.row !== undefined && hintData.col !== undefined) {
            positionInfo.textContent = `位置：第${hintData.row + 1}行，第${hintData.col + 1}列`;
        } else if (hintData && hintData.targetRow !== undefined && hintData.targetCol !== undefined) {
            positionInfo.textContent = `位置：第${hintData.targetRow + 1}行，第${hintData.targetCol + 1}列`;
        }
        content.appendChild(positionInfo);
        
        // 技巧说明（根据步骤显示不同内容）
        const techniqueDesc = document.createElement('div');
        techniqueDesc.className = 'technique-description';
        
        switch (step) {
            case 0:
                techniqueDesc.innerHTML = `<strong>原理：</strong>${description}`;
                break;
            case 1:
                if (hintData && hintData.num !== undefined) {
                    techniqueDesc.innerHTML = `<strong>分析：</strong>根据${techniqueName}技巧，经过详细分析候选数，可以确定在第${(hintData.targetRow || hintData.row) + 1}行第${(hintData.targetCol || hintData.col) + 1}列的位置必须填入数字<strong>${hintData.num}</strong>。`;
                } else {
                    techniqueDesc.innerHTML = `<strong>分析：</strong>根据${techniqueName}技巧，经过详细分析候选数，可以确定一个位置的数字。`;
                }
                break;
            case 2:
                if (hintData && hintData.num !== undefined) {
                    techniqueDesc.innerHTML = `<strong>结果：</strong>在此位置（第${(hintData.targetRow || hintData.row) + 1}行第${(hintData.targetCol || hintData.col) + 1}列）填入数字<strong>${hintData.num}</strong>。这将帮助您继续解题。`;
                } else {
                    techniqueDesc.innerHTML = `<strong>结果：</strong>根据${techniqueName}技巧得出结果，填入相应的数字。`;
                }
                break;
        }
        
        content.appendChild(techniqueDesc);
    }
    
    // 创建步骤指示器
    createStepIndicators(container) {
        container.innerHTML = '';
        for (let i = 0; i < this.totalSteps; i++) {
            const indicator = document.createElement('div');
            indicator.className = `step-indicator ${i === 0 ? 'active' : ''}`;
            container.appendChild(indicator);
        }
    }
    
    // 更新步骤指示器
    updateStepIndicators() {
        const indicators = document.querySelectorAll('.step-indicator');
        indicators.forEach((indicator, index) => {
            if (index === this.currentHint.step) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }
    
    // 下一步
    nextStep() {
        if (this.currentHint.step < this.totalSteps - 1) {
            this.currentHint.step++;
            this.updatePanel();
            
            // 更新按钮状态
            const prevBtn = document.querySelector('.prev-btn');
            const nextBtn = document.querySelector('.next-btn');
            
            prevBtn.disabled = false;
            
            if (this.currentHint.step === this.totalSteps - 1) {
                console.log('更新按钮为完成状态'); // 调试信息
                nextBtn.innerHTML = '完成 √';
                nextBtn.onclick = () => this.finishHint();
            }
            
            this.updateStepIndicators();
        }
    }
    
    // 上一步
    previousStep() {
        if (this.currentHint.step > 0) {
            this.currentHint.step--;
            this.updatePanel();
            
            // 更新按钮状态
            const prevBtn = document.querySelector('.prev-btn');
            const nextBtn = document.querySelector('.next-btn');
            
            nextBtn.innerHTML = '下一步 &gt;';
            nextBtn.onclick = () => this.nextStep();
            
            if (this.currentHint.step === 0) {
                prevBtn.disabled = true;
            }
            
            this.updateStepIndicators();
        }
    }
    
    // 完成提示
    finishHint() {
        console.log('finishHint函数被调用'); // 调试信息
        // 关闭面板
        this.closeHintPopup();
        
        // 恢复正常的九宫格高亮显示
        if (this.currentHint && this.currentHint.data) {
            const data = this.currentHint.data;
            console.log('FinishHint接收到的数据:', data); // 调试信息
            let row, col, num;
            
            // 根据不同的技巧类型获取目标单元格位置和数字
            // 处理区块摒除法、矩形摒除法、X-Wing法等技巧
            if (data.targetRow !== undefined && data.targetCol !== undefined) {
                row = data.targetRow;
                col = data.targetCol;
                num = data.num;
            } 
            // 处理默认情况和其他技巧（包括行唯一、列唯一、宫唯一）
            else if (data.row !== undefined && data.col !== undefined) {
                row = data.row;
                col = data.col;
                num = data.num;
            }
            // 处理数对法技巧（特殊情况：data.row是目标行，但列位置需要从targetCol获取）
            else if (data.row !== undefined && data.col1 !== undefined) {
                row = data.row;
                // 对于数对法，目标列应该是targetCol而不是col1
                col = data.targetCol !== undefined ? data.targetCol : data.col1;
                num = data.num;
            }
            // 处理三链数法技巧
            else if (data.tripleRow !== undefined && data.tripleCol1 !== undefined) {
                row = data.tripleRow;
                col = data.tripleCol1;
                num = data.num;
            }
            // 处理X-Wing法技巧
            else if (data.row1 !== undefined && data.col1 !== undefined) {
                // X-Wing法的目标位置存储在targetRow和targetCol中
                row = data.targetRow;
                col = data.targetCol;
                num = data.num;
            }
            
            console.log('解析后的row, col, num:', {row, col, num}); // 调试信息
            
            // 添加更多调试信息
            if (row === undefined || col === undefined || num === undefined) {
                console.error('未能正确解析row, col, num:', {row, col, num});
                console.log('完整的data对象:', data);
            }
            
            if (row !== undefined && col !== undefined && num !== undefined) {
                console.log('准备结束提示并恢复正常游戏状态:', {row, col, num}); // 调试信息
                
                // 数字已经在第二步填入，这里只需要恢复正常游戏状态
                
                // 更新UI - 高亮新写入的数字及相同的数
                const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                
                // 清除闪烁效果
                if (cell) {
                    cell.classList.remove('hint-highlight');
                }
                
                // 清除之前的高亮显示
                this.clearAllHighlights();
                
                // 高亮新写入的数字及相同的数
                this.highlightRelatedCells(row, col);
                
                // 减少提示次数
                this.useHint();
                
                // 更新游戏渲染
                if (typeof window.renderGame === "function") {
                    console.log('调用renderGame更新游戏渲染'); // 调试信息
                    window.renderGame();
                }
                
                // 检查数字按钮状态
                if (typeof window.updateNumberButtonsState === "function") {
                    window.updateNumberButtonsState();
                }
                
                // 检查是否完成
                if (typeof window.checkCompletion === "function") {
                    window.checkCompletion();
                }
            }
        }
    }
    
    // 清除所有高亮状态
    clearAllHighlights() {
        // 清除高亮
        document.querySelectorAll('.cell.highlighted').forEach(cell => {
            cell.classList.remove('highlighted');
        });
        
        // 清除相同数字高亮
        document.querySelectorAll('.cell.same-number-highlight').forEach(cell => {
            cell.classList.remove('same-number-highlight');
        });
        
        // 清除冲突高亮
        document.querySelectorAll('.cell.conflict').forEach(cell => {
            cell.classList.remove('conflict');
        });
    }
    
    // 高亮相关单元格（行、列、宫）和相同数字
    highlightRelatedCells(row, col) {
        // 高亮行
        for (let c = 0; c < 9; c++) {
            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${c}"]`);
            if (cell) cell.classList.add('highlighted');
        }
        
        // 高亮列
        for (let r = 0; r < 9; r++) {
            const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${col}"]`);
            if (cell) cell.classList.add('highlighted');
        }
        
        // 高亮宫
        const boxRowStart = Math.floor(row / 3) * 3;
        const boxColStart = Math.floor(col / 3) * 3;
        for (let r = boxRowStart; r < boxRowStart + 3; r++) {
            for (let c = boxColStart; c < boxColStart + 3; c++) {
                const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                if (cell) cell.classList.add('highlighted');
            }
        }
        
        // 高亮相同数字
        // 获取目标单元格的值
        const targetCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (targetCell) {
            const targetValue = targetCell.textContent;
            if (targetValue) {
                // 高亮所有相同数字的单元格
                document.querySelectorAll('.cell').forEach(cell => {
                    if (cell.textContent === targetValue && cell !== targetCell) {
                        cell.classList.add('same-number-highlight');
                    }
                });
            }
        }
    }
    
    // 更新面板
    updatePanel() {
        const content = document.querySelector('.panel-content');
        if (content && this.currentHint) {
            this.updatePanelContent(content, this.currentHint.technique, this.currentHint.data, this.currentHint.step);
            this.drawVisualizationStep(this.currentHint.step, this.currentHint.technique, this.currentHint.data);
            
            // 更新遮罩以反映当前步骤
            this.applyDimOverlay();
        }
    }
    
    // 绘制可视化步骤
    drawVisualizationStep(step, technique, hintData) {
        // 清除之前的可视化效果
        if (typeof window.clearTechniqueLines === "function") {
            window.clearTechniqueLines();
        }
        
        // 根据步骤绘制不同的可视化效果
        switch (step) {
            case 0:
                // 第一步：高亮显示相关的行、列、宫和预填数的位置
                this.highlightFirstStep(technique, hintData);
                break;
            case 1:
                // 第二步：保持高亮并显示相关数字
                this.highlightSecondStep(technique, hintData);
                break;
            case 2:
                // 第三步：高亮闪烁显示填入的数字
                this.highlightThirdStep(technique, hintData);
                break;
        }
    }
    
    // 第一步高亮
    highlightFirstStep(technique, hintData) {
        if (typeof window.drawTechniqueVisualization === "function") {
            window.drawTechniqueVisualization(technique, hintData);
        }
    }
    
    // 第二步高亮
    highlightSecondStep(technique, hintData) {
        if (typeof window.drawTechniqueVisualization === "function") {
            window.drawTechniqueVisualization(technique, hintData);
        }
        
        // 在第二步时将结果数字放入预填单元格并闪烁显示
        let targetRow, targetCol, num;
        if (hintData.targetRow !== undefined && hintData.targetCol !== undefined) {
            targetRow = hintData.targetRow;
            targetCol = hintData.targetCol;
            num = hintData.num;
        } else if (hintData.row !== undefined && hintData.col !== undefined) {
            targetRow = hintData.row;
            targetCol = hintData.col;
            num = hintData.num;
        }
        
        if (targetRow !== undefined && targetCol !== undefined && num !== undefined) {
            // 双重检查目标单元格是否为空
            if (window.userBoard[targetRow][targetCol] === 0 && window.board[targetRow][targetCol] === 0) {
                // 填入答案
                window.userBoard[targetRow][targetCol] = num;
                
                // 更新UI
                const cell = document.querySelector(`.cell[data-row="${targetRow}"][data-col="${targetCol}"]`);
                if (cell) {
                    cell.textContent = num;
                    
                    // 检查输入的数字是否与解题结果一致
                    if (num === window.solution[targetRow][targetCol]) {
                        cell.classList.add('user-input', 'correct');
                        cell.classList.remove('wrong');
                    } else {
                        cell.classList.add('user-input', 'wrong');
                        cell.classList.remove('correct');
                    }
                    
                    // 闪烁效果 - 确保动画能正确显示，并保持到点击完成
                    cell.classList.remove('hint-highlight'); // 先移除可能存在的类
                    // 强制重排以确保类被正确移除
                    cell.offsetHeight;
                    cell.classList.add('hint-highlight');
                    // 不再自动移除闪烁效果，让它保持到用户点击完成按钮
                }
                
                // 保存到历史记录
                window.moveHistory.push({
                    row: targetRow,
                    col: targetCol,
                    prevValue: 0,
                    newValue: num,
                    prevNotes: Array(9).fill(false),
                    prevErrorCount: window.errorCount
                });
            }
        }
    }
    
    // 第三步高亮
    highlightThirdStep(technique, hintData) {
        if (typeof window.drawTechniqueVisualization === "function") {
            window.drawTechniqueVisualization(technique, hintData);
        }
        
        // 闪烁效果
        let targetRow, targetCol;
        if (hintData.targetRow !== undefined && hintData.targetCol !== undefined) {
            targetRow = hintData.targetRow;
            targetCol = hintData.targetCol;
        } else if (hintData.row !== undefined && hintData.col !== undefined) {
            targetRow = hintData.row;
            targetCol = hintData.col;
        }
        
        if (targetRow !== undefined && targetCol !== undefined) {
            const cell = document.querySelector(`.cell[data-row="${targetRow}"][data-col="${targetCol}"]`);
            if (cell) {
                cell.classList.add('hint-highlight');
                setTimeout(() => {
                    cell.classList.remove('hint-highlight');
                }, 1500);
            }
        }
    }
    
    // 应用半透明遮罩
    applyDimOverlay() {
        // 移除现有的遮罩
        this.removeDimOverlay();
        
        // 只有在有当前提示时才应用遮罩
        if (!this.currentHint) return;
        
        // 获取九宫格元素
        const sudokuBoard = document.getElementById('sudoku-board');
        
        // 只为九宫格创建遮罩
        if (sudokuBoard) {
            // 为每个单元格添加遮罩类
            const cells = sudokuBoard.querySelectorAll('.cell');
            cells.forEach(cell => {
                cell.classList.add('dimmed');
            });
            
            // 根据提示技巧类型，移除相关单元格的遮罩类
            this.removeRelevantCellDimming(sudokuBoard);
        }
    }
    
    // 移除与当前提示技巧相关的单元格遮罩
    removeRelevantCellDimming(sudokuBoard) {
        if (!this.currentHint || !this.currentHint.data) return;
        
        const { technique, data } = this.currentHint;
        
        // 根据不同的技巧类型确定需要保持可见的单元格
        let keepVisibleCells = [];
        let rowCells = [];
        let colCells = [];
        let boxCells = [];
        
        switch (technique) {
            case "行唯一":
                // 目标单元格、整行、整列和整个宫需要保持可见
                // 整行
                for (let col = 0; col < 9; col++) {
                    rowCells.push({ row: data.row, col: col });
                }
                // 整列
                for (let row = 0; row < 9; row++) {
                    colCells.push({ row: row, col: data.col });
                }
                // 整个宫
                const boxRowStart1 = Math.floor(data.row / 3) * 3;
                const boxColStart1 = Math.floor(data.col / 3) * 3;
                for (let r = boxRowStart1; r < boxRowStart1 + 3; r++) {
                    for (let c = boxColStart1; c < boxColStart1 + 3; c++) {
                        boxCells.push({ row: r, col: c });
                    }
                }
                break;
                
            case "列唯一":
                // 目标单元格、整行、整列和整个宫需要保持可见
                // 整行
                for (let col = 0; col < 9; col++) {
                    rowCells.push({ row: data.row, col: col });
                }
                // 整列
                for (let row = 0; row < 9; row++) {
                    colCells.push({ row: row, col: data.col });
                }
                // 整个宫
                const boxRowStart2 = Math.floor(data.row / 3) * 3;
                const boxColStart2 = Math.floor(data.col / 3) * 3;
                for (let r = boxRowStart2; r < boxRowStart2 + 3; r++) {
                    for (let c = boxColStart2; c < boxColStart2 + 3; c++) {
                        boxCells.push({ row: r, col: c });
                    }
                }
                break;
                
            case "宫唯一":
                // 目标单元格、整行、整列和整个宫需要保持可见
                // 整行
                for (let col = 0; col < 9; col++) {
                    rowCells.push({ row: data.row, col: col });
                }
                // 整列
                for (let row = 0; row < 9; row++) {
                    colCells.push({ row: row, col: data.col });
                }
                // 整个宫
                const boxRowStart3 = Math.floor(data.row / 3) * 3;
                const boxColStart3 = Math.floor(data.col / 3) * 3;
                for (let r = boxRowStart3; r < boxRowStart3 + 3; r++) {
                    for (let c = boxColStart3; c < boxColStart3 + 3; c++) {
                        boxCells.push({ row: r, col: c });
                    }
                }
                break;
                
            case "数对法":
                // 数对单元格、目标单元格、整行、整列和相关宫需要保持可见
                // 数对所在的行
                for (let col = 0; col < 9; col++) {
                    rowCells.push({ row: data.pairRow, col: col });
                }
                // 数对单元格
                rowCells.push({ row: data.pairRow, col: data.pairCol1 });
                rowCells.push({ row: data.pairRow, col: data.pairCol2 });
                // 目标所在的行
                for (let col = 0; col < 9; col++) {
                    rowCells.push({ row: data.row, col: col });
                }
                // 目标所在的列
                for (let row = 0; row < 9; row++) {
                    colCells.push({ row: row, col: data.col1 });
                }
                // 目标所在的宫
                const boxRowStart4 = Math.floor(data.row / 3) * 3;
                const boxColStart4 = Math.floor(data.col1 / 3) * 3;
                for (let r = boxRowStart4; r < boxRowStart4 + 3; r++) {
                    for (let c = boxColStart4; c < boxColStart4 + 3; c++) {
                        boxCells.push({ row: r, col: c });
                    }
                }
                break;
                
            case "区块摒除法":
                // 区块内的单元格、目标单元格、相关行列宫需要保持可见
                // 区块内的所有单元格
                for (let i = 0; i < data.positions.length; i++) {
                    const pos = data.positions[i];
                    boxCells.push({ row: pos.row, col: pos.col });
                }
                // 目标单元格所在的行
                for (let col = 0; col < 9; col++) {
                    rowCells.push({ row: data.targetRow, col: col });
                }
                // 目标单元格所在的列
                for (let row = 0; row < 9; row++) {
                    colCells.push({ row: row, col: data.targetCol });
                }
                // 目标单元格所在的宫
                const boxRowStart5 = Math.floor(data.targetRow / 3) * 3;
                const boxColStart5 = Math.floor(data.targetCol / 3) * 3;
                for (let r = boxRowStart5; r < boxRowStart5 + 3; r++) {
                    for (let c = boxColStart5; c < boxColStart5 + 3; c++) {
                        boxCells.push({ row: r, col: c });
                    }
                }
                break;
                
            case "三链数法":
                // 三链数单元格、目标单元格、相关行列宫需要保持可见
                // 三链数所在的行
                for (let col = 0; col < 9; col++) {
                    rowCells.push({ row: data.tripleRow, col: col });
                }
                // 三链数单元格
                if (data.tripleRow !== undefined && data.tripleCol1 !== undefined) {
                    rowCells.push({ row: data.tripleRow, col: data.tripleCol1 });
                    rowCells.push({ row: data.tripleRow, col: data.tripleCol2 });
                    if (data.tripleCol3 !== undefined) {
                        rowCells.push({ row: data.tripleRow, col: data.tripleCol3 });
                    }
                }
                // 目标所在的行
                for (let col = 0; col < 9; col++) {
                    rowCells.push({ row: data.row, col: col });
                }
                // 目标所在的列
                for (let row = 0; row < 9; row++) {
                    colCells.push({ row: row, col: data.col1 });
                }
                // 目标所在的宫
                const boxRowStart6 = Math.floor(data.row / 3) * 3;
                const boxColStart6 = Math.floor(data.col1 / 3) * 3;
                for (let r = boxRowStart6; r < boxRowStart6 + 3; r++) {
                    for (let c = boxColStart6; c < boxColStart6 + 3; c++) {
                        boxCells.push({ row: r, col: c });
                    }
                }
                break;
                
            case "X-Wing法":
                // X-Wing位置单元格、目标单元格、相关行列需要保持可见
                // X-Wing位置单元格
                rowCells.push({ row: data.row1, col: data.col1 });
                rowCells.push({ row: data.row1, col: data.col2 });
                rowCells.push({ row: data.row2, col: data.col1 });
                rowCells.push({ row: data.row2, col: data.col2 });
                
                // 目标所在的行
                for (let col = 0; col < 9; col++) {
                    rowCells.push({ row: data.targetRow, col: col });
                }
                // 目标所在的列
                for (let row = 0; row < 9; row++) {
                    colCells.push({ row: row, col: data.targetCol });
                }
                // 目标所在的宫
                const boxRowStart7 = Math.floor(data.targetRow / 3) * 3;
                const boxColStart7 = Math.floor(data.targetCol / 3) * 3;
                for (let r = boxRowStart7; r < boxRowStart7 + 3; r++) {
                    for (let c = boxColStart7; c < boxColStart7 + 3; c++) {
                        boxCells.push({ row: r, col: c });
                    }
                }
                break;
                
            default:
                // 默认情况下，目标单元格、整行、整列和整个宫需要保持可见
                if (data.row !== undefined && data.col !== undefined) {
                    // 整行
                    for (let col = 0; col < 9; col++) {
                        rowCells.push({ row: data.row, col: col });
                    }
                    // 整列
                    for (let row = 0; row < 9; row++) {
                        colCells.push({ row: row, col: data.col });
                    }
                    // 整个宫
                    const boxRowStart8 = Math.floor(data.row / 3) * 3;
                    const boxColStart8 = Math.floor(data.col / 3) * 3;
                    for (let r = boxRowStart8; r < boxRowStart8 + 3; r++) {
                        for (let c = boxColStart8; c < boxColStart8 + 3; c++) {
                            boxCells.push({ row: r, col: c });
                        }
                    }
                }
                break;
        }
        
        // 合并所有需要保持可见的单元格
        keepVisibleCells = [...rowCells, ...colCells, ...boxCells];
        
        // 移除重复的单元格
        const uniqueKeepVisibleCells = [];
        const cellMap = new Map();
        keepVisibleCells.forEach(cell => {
            const key = `${cell.row}-${cell.col}`;
            if (!cellMap.has(key)) {
                cellMap.set(key, true);
                uniqueKeepVisibleCells.push(cell);
            }
        });
        
        // 移除相关单元格的遮罩类
        uniqueKeepVisibleCells.forEach(cell => {
            const cellElement = sudokuBoard.querySelector(`.cell[data-row="${cell.row}"][data-col="${cell.col}"]`);
            if (cellElement) {
                cellElement.classList.remove('dimmed');
                
                // 为行、列、宫添加不同的高亮背景色
                const isInRow = rowCells.some(rc => rc.row === cell.row && rc.col === cell.col);
                const isInCol = colCells.some(cc => cc.row === cell.row && cc.col === cell.col);
                const isInBox = boxCells.some(bc => bc.row === cell.row && bc.col === cell.col);
                
                if (isInRow) {
                    cellElement.classList.add('row-highlight');
                }
                if (isInCol) {
                    cellElement.classList.add('col-highlight');
                }
                if (isInBox) {
                    cellElement.classList.add('box-highlight');
                }
            }
        });
    }

    // 移除半透明遮罩
    removeDimOverlay() {
        const sudokuBoard = document.getElementById('sudoku-board');
        if (sudokuBoard) {
            const cells = sudokuBoard.querySelectorAll('.cell');
            cells.forEach(cell => {
                cell.classList.remove('dimmed');
                cell.classList.remove('row-highlight');
                cell.classList.remove('col-highlight');
                cell.classList.remove('box-highlight');
            });
        }
    }
    
    // 关闭提示弹出面板
    closeHintPopup() {
        const overlay = document.getElementById('hint-popup-overlay');
        if (overlay) overlay.remove();
        
        // 移除遮罩
        this.removeDimOverlay();
        
        // 清除可视化效果
        if (typeof window.clearTechniqueLines === "function") {
            window.clearTechniqueLines();
        }
        
        // 重置当前提示
        this.currentHint = null;
    }
    
    // 获取技巧名称
    getTechniqueName(technique) {
        if (this.techniqueDescriptions[technique]) {
            return this.techniqueDescriptions[technique].name;
        }
        return technique;
    }
    
    // 获取技巧说明
    getTechniqueDescription(technique) {
        if (this.techniqueDescriptions[technique]) {
            return this.techniqueDescriptions[technique].description;
        }
        return "暂无说明";
    }
    
    // 应用提示到游戏
    applyHint(userBoard, board, solution, targetRow, targetCol, targetNum, technique, hintData) {
        // 双重检查目标单元格是否为空
        if (userBoard[targetRow][targetCol] !== 0 || board[targetRow][targetCol] !== 0) {
            console.error('提示错误：目标单元格已被占用', {targetRow, targetCol, userBoard: userBoard[targetRow][targetCol], board: board[targetRow][targetCol]});
            return { success: false, message: '提示错误：目标单元格已被占用' };
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
        this.useHint();
        
        // 高亮提示的单元格
        cell.classList.add('hint-highlight');
        setTimeout(() => {
            cell.classList.remove('hint-highlight');
        }, 1500);
        
        return { success: true };
    }
}

// 导出提示模块
window.HintModule = HintModule;