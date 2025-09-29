// 解题技巧可视化增强功能

// 保存当前技巧信息
window.currentTechnique = null;
window.currentHintData = null;

// 在九宫格上绘制解题技巧线条
function drawTechniqueVisualization(technique, data) {
    // 清除之前的线条
    clearTechniqueLines();
    
    // 创建SVG容器
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "technique-svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "100";
    
    // 添加到数独容器中
    const sudokuBoard = document.getElementById('sudoku-board');
    sudokuBoard.style.position = "relative";
    sudokuBoard.appendChild(svg);
    
    switch (technique) {
        case "行唯一":
            drawRowHighlight(svg, data.row, data.col, data.num);
            break;
        case "列唯一":
            drawColHighlight(svg, data.row, data.col, data.num);
            break;
        case "宫唯一":
            drawBoxHighlight(svg, data.row, data.col, data.num);
            break;
        case "数对法":
            drawNakedPair(svg, data);
            break;
        case "区块摒除法":
            drawPointingPair(svg, data);
            break;
        case "三链数法":
            drawNakedTriple(svg, data);
            break;
        case "X-Wing法":
            drawXWing(svg, data);
            break;
        default:
            // 对于其他技巧不绘制线条
            break;
    }
    
    // 保存当前技巧信息，以便后续清除
    window.currentTechnique = {
        technique: technique,
        data: data
    };
    
    // 不再自动清除，保持显示直到用户继续操作
}

// 清除解题技巧线条
function clearTechniqueLines() {
    const existingSvg = document.getElementById("technique-svg");
    if (existingSvg) {
        existingSvg.remove();
    }
    // 清除当前技巧信息
    window.currentTechnique = null;
    window.currentHintData = null;
}

// 重新绘制当前技巧线条（用于窗口大小改变等情况）
function redrawCurrentTechnique() {
    if (window.currentTechnique) {
        drawTechniqueVisualization(window.currentTechnique.technique, window.currentTechnique.data);
    }
}

// 绘制行高亮
function drawRowHighlight(svg, row, col, num) {
    // 高亮整行
    const rowLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    rowLine.setAttribute("x1", "0");
    rowLine.setAttribute("y1", `${(row + 0.5) * (100 / 9)}%`);
    rowLine.setAttribute("x2", "100%");
    rowLine.setAttribute("y2", `${(row + 0.5) * (100 / 9)}%`);
    rowLine.setAttribute("stroke", "#4a69bd");
    rowLine.setAttribute("stroke-width", "3");
    rowLine.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(rowLine);
    
    // 标记目标单元格
    const targetRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    targetRect.setAttribute("x", `${col * (100 / 9)}%`);
    targetRect.setAttribute("y", `${row * (100 / 9)}%`);
    targetRect.setAttribute("width", `${100 / 9}%`);
    targetRect.setAttribute("height", `${100 / 9}%`);
    targetRect.setAttribute("fill", "rgba(74, 105, 189, 0.3)");
    targetRect.setAttribute("stroke", "#4a69bd");
    targetRect.setAttribute("stroke-width", "2");
    svg.appendChild(targetRect);
    
    // 添加文字说明
    // const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    // text.setAttribute("x", "50%");
    // text.setAttribute("y", "5%");
    // text.setAttribute("text-anchor", "middle");
    // text.setAttribute("fill", "#4a69bd");
    // text.setAttribute("font-size", "16");
    // text.setAttribute("font-weight", "bold");
    // text.textContent = "行唯一法";
    // svg.appendChild(text);
}

// 绘制列高亮
function drawColHighlight(svg, row, col, num) {
    // 高亮整列
    const colLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    colLine.setAttribute("x1", `${(col + 0.5) * (100 / 9)}%`);
    colLine.setAttribute("y1", "0");
    colLine.setAttribute("x2", `${(col + 0.5) * (100 / 9)}%`);
    colLine.setAttribute("y2", "100%");
    colLine.setAttribute("stroke", "#4a69bd");
    colLine.setAttribute("stroke-width", "3");
    colLine.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(colLine);
    
    // 标记目标单元格
    const targetRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    targetRect.setAttribute("x", `${col * (100 / 9)}%`);
    targetRect.setAttribute("y", `${row * (100 / 9)}%`);
    targetRect.setAttribute("width", `${100 / 9}%`);
    targetRect.setAttribute("height", `${100 / 9}%`);
    targetRect.setAttribute("fill", "rgba(74, 105, 189, 0.3)");
    targetRect.setAttribute("stroke", "#4a69bd");
    targetRect.setAttribute("stroke-width", "2");
    svg.appendChild(targetRect);
    
    // 添加文字说明
    // const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    // text.setAttribute("x", "50%");
    // text.setAttribute("y", "5%");
    // text.setAttribute("text-anchor", "middle");
    // text.setAttribute("fill", "#4a69bd");
    // text.setAttribute("font-size", "16");
    // text.setAttribute("font-weight", "bold");
    // text.textContent = "列唯一法";
    // svg.appendChild(text);
}

// 绘制宫高亮
function drawBoxHighlight(svg, row, col, num) {
    const boxRowStart = Math.floor(row / 3) * 3;
    const boxColStart = Math.floor(col / 3) * 3;
    
    // 高亮整个宫
    const boxRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    boxRect.setAttribute("x", `${boxColStart * (100 / 9)}%`);
    boxRect.setAttribute("y", `${boxRowStart * (100 / 9)}%`);
    boxRect.setAttribute("width", `${300 / 9}%`);
    boxRect.setAttribute("height", `${300 / 9}%`);
    boxRect.setAttribute("fill", "rgba(74, 105, 189, 0.2)");
    boxRect.setAttribute("stroke", "#4a69bd");
    boxRect.setAttribute("stroke-width", "2");
    boxRect.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(boxRect);
    
    // 标记目标单元格
    const targetRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    targetRect.setAttribute("x", `${col * (100 / 9)}%`);
    targetRect.setAttribute("y", `${row * (100 / 9)}%`);
    targetRect.setAttribute("width", `${100 / 9}%`);
    targetRect.setAttribute("height", `${100 / 9}%`);
    targetRect.setAttribute("fill", "rgba(74, 105, 189, 0.3)");
    targetRect.setAttribute("stroke", "#4a69bd");
    targetRect.setAttribute("stroke-width", "2");
    svg.appendChild(targetRect);
    
    // 添加文字说明
    // const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    // text.setAttribute("x", "50%");
    // text.setAttribute("y", "5%");
    // text.setAttribute("text-anchor", "middle");
    // text.setAttribute("fill", "#4a69bd");
    // text.setAttribute("font-size", "16");
    // text.setAttribute("font-weight", "bold");
    // text.textContent = "宫唯一法";
    // svg.appendChild(text);
}

// 绘制数对法
function drawNakedPair(svg, data) {
    const { row, col1, col2, num, pairRow, pairCol1, pairCol2 } = data;
    
    // 高亮整行
    const rowLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    rowLine.setAttribute("x1", "0");
    rowLine.setAttribute("y1", `${(row + 0.5) * (100 / 9)}%`);
    rowLine.setAttribute("x2", "100%");
    rowLine.setAttribute("y2", `${(row + 0.5) * (100 / 9)}%`);
    rowLine.setAttribute("stroke", "#4a69bd");
    rowLine.setAttribute("stroke-width", "3");
    rowLine.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(rowLine);
    
    // 标记数对单元格
    const pairRect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    pairRect1.setAttribute("x", `${pairCol1 * (100 / 9)}%`);
    pairRect1.setAttribute("y", `${pairRow * (100 / 9)}%`);
    pairRect1.setAttribute("width", `${100 / 9}%`);
    pairRect1.setAttribute("height", `${100 / 9}%`);
    pairRect1.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
    pairRect1.setAttribute("stroke", "red");
    pairRect1.setAttribute("stroke-width", "2");
    svg.appendChild(pairRect1);
    
    const pairRect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    pairRect2.setAttribute("x", `${pairCol2 * (100 / 9)}%`);
    pairRect2.setAttribute("y", `${pairRow * (100 / 9)}%`);
    pairRect2.setAttribute("width", `${100 / 9}%`);
    pairRect2.setAttribute("height", `${100 / 9}%`);
    pairRect2.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
    pairRect2.setAttribute("stroke", "red");
    pairRect2.setAttribute("stroke-width", "2");
    svg.appendChild(pairRect2);
    
    // 标记目标单元格
    const targetRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    targetRect.setAttribute("x", `${col1 * (100 / 9)}%`);
    targetRect.setAttribute("y", `${row * (100 / 9)}%`);
    targetRect.setAttribute("width", `${100 / 9}%`);
    targetRect.setAttribute("height", `${100 / 9}%`);
    targetRect.setAttribute("fill", "rgba(74, 105, 189, 0.3)");
    targetRect.setAttribute("stroke", "#4a69bd");
    targetRect.setAttribute("stroke-width", "2");
    svg.appendChild(targetRect);
    
    // 添加连接线表示数对关系 - 使用更粗的线和箭头
    const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line1.setAttribute("x1", `${(pairCol1 + 0.5) * (100 / 9)}%`);
    line1.setAttribute("y1", `${(pairRow + 0.5) * (100 / 9)}%`);
    line1.setAttribute("x2", `${(pairCol2 + 0.5) * (100 / 9)}%`);
    line1.setAttribute("y2", `${(pairRow + 0.5) * (100 / 9)}%`);
    line1.setAttribute("stroke", "red");
    line1.setAttribute("stroke-width", "4");
    line1.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(line1);
    
    // 添加箭头标记
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "arrow");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("refX", "5");
    marker.setAttribute("refY", "5");
    marker.setAttribute("orient", "auto");
    
    const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrowPath.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    arrowPath.setAttribute("fill", "red");
    marker.appendChild(arrowPath);
    svg.appendChild(marker);
    
    // 添加从数对到目标单元格的连接线
    const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line2.setAttribute("x1", `${(pairCol1 + 0.5) * (100 / 9)}%`);
    line2.setAttribute("y1", `${(pairRow + 0.5) * (100 / 9)}%`);
    line2.setAttribute("x2", `${(col1 + 0.5) * (100 / 9)}%`);
    line2.setAttribute("y2", `${(row + 0.5) * (100 / 9)}%`);
    line2.setAttribute("stroke", "orange");
    line2.setAttribute("stroke-width", "3");
    line2.setAttribute("stroke-dasharray", "3,3");
    line2.setAttribute("marker-end", "url(#arrow)");
    svg.appendChild(line2);
    
    const line3 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line3.setAttribute("x1", `${(pairCol2 + 0.5) * (100 / 9)}%`);
    line3.setAttribute("y1", `${(pairRow + 0.5) * (100 / 9)}%`);
    line3.setAttribute("x2", `${(col1 + 0.5) * (100 / 9)}%`);
    line3.setAttribute("y2", `${(row + 0.5) * (100 / 9)}%`);
    line3.setAttribute("stroke", "orange");
    line3.setAttribute("stroke-width", "3");
    line3.setAttribute("stroke-dasharray", "3,3");
    line3.setAttribute("marker-end", "url(#arrow)");
    svg.appendChild(line3);
    
    // 添加文字说明
    // const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    // text.setAttribute("x", "50%");
    // text.setAttribute("y", "5%");
    // text.setAttribute("text-anchor", "middle");
    // text.setAttribute("fill", "#4a69bd");
    // text.setAttribute("font-size", "16");
    // text.setAttribute("font-weight", "bold");
    // text.textContent = "数对法";
    // svg.appendChild(text);
    
    // 添加解释文字
    // const explanation = document.createElementNS("http://www.w3.org/2000/svg", "text");
    // explanation.setAttribute("x", "50%");
    // explanation.setAttribute("y", "10%");
    // explanation.setAttribute("text-anchor", "middle");
    // explanation.setAttribute("fill", "red");
    // explanation.setAttribute("font-size", "12");
    // explanation.textContent = "第" + (pairRow+1) + "行的两个红色单元格只能填入相同的两个数字";
    // svg.appendChild(explanation);
}

// 绘制区块摒除法
function drawPointingPair(svg, data) {
    const { boxRow, boxCol, num, positions, targetRow, targetCol } = data;
    
    // 高亮宫格
    const boxRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    boxRect.setAttribute("x", `${boxCol * 3 * (100 / 9)}%`);
    boxRect.setAttribute("y", `${boxRow * 3 * (100 / 9)}%`);
    boxRect.setAttribute("width", `${300 / 9}%`);
    boxRect.setAttribute("height", `${300 / 9}%`);
    boxRect.setAttribute("fill", "rgba(74, 105, 189, 0.2)");
    boxRect.setAttribute("stroke", "#4a69bd");
    boxRect.setAttribute("stroke-width", "2");
    boxRect.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(boxRect);
    
    // 标记相关位置
    positions.forEach(pos => {
        const posRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        posRect.setAttribute("x", `${pos.col * (100 / 9)}%`);
        posRect.setAttribute("y", `${pos.row * (100 / 9)}%`);
        posRect.setAttribute("width", `${100 / 9}%`);
        posRect.setAttribute("height", `${100 / 9}%`);
        posRect.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
        posRect.setAttribute("stroke", "red");
        posRect.setAttribute("stroke-width", "2");
        svg.appendChild(posRect);
    });
    
    // 标记目标单元格
    const targetRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    targetRect.setAttribute("x", `${targetCol * (100 / 9)}%`);
    targetRect.setAttribute("y", `${targetRow * (100 / 9)}%`);
    targetRect.setAttribute("width", `${100 / 9}%`);
    targetRect.setAttribute("height", `${100 / 9}%`);
    targetRect.setAttribute("fill", "rgba(74, 105, 189, 0.3)");
    targetRect.setAttribute("stroke", "#4a69bd");
    targetRect.setAttribute("stroke-width", "2");
    svg.appendChild(targetRect);
    
    // 添加连接线表示区块关系 - 使用更清晰的表示方法
    if (positions.length > 1) {
        // 绘制宫格内的连接线
        for (let i = 0; i < positions.length - 1; i++) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", `${(positions[i].col + 0.5) * (100 / 9)}%`);
            line.setAttribute("y1", `${(positions[i].row + 0.5) * (100 / 9)}%`);
            line.setAttribute("x2", `${(positions[i+1].col + 0.5) * (100 / 9)}%`);
            line.setAttribute("y2", `${(positions[i+1].row + 0.5) * (100 / 9)}%`);
            line.setAttribute("stroke", "red");
            line.setAttribute("stroke-width", "3");
            line.setAttribute("stroke-dasharray", "4,4");
            svg.appendChild(line);
        }
        
        // 添加从宫格到目标单元格的排除线
        positions.forEach(pos => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", `${(pos.col + 0.5) * (100 / 9)}%`);
            line.setAttribute("y1", `${(pos.row + 0.5) * (100 / 9)}%`);
            line.setAttribute("x2", `${(targetCol + 0.5) * (100 / 9)}%`);
            line.setAttribute("y2", `${(targetRow + 0.5) * (100 / 9)}%`);
            line.setAttribute("stroke", "orange");
            line.setAttribute("stroke-width", "2");
            line.setAttribute("stroke-dasharray", "3,3");
            svg.appendChild(line);
        });
    }
    
    // 添加文字说明
    // const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    // text.setAttribute("x", "50%");
    // text.setAttribute("y", "5%");
    // text.setAttribute("text-anchor", "middle");
    // text.setAttribute("fill", "#4a69bd");
    // text.setAttribute("font-size", "16");
    // text.setAttribute("font-weight", "bold");
    // text.textContent = "区块摒除法";
    // svg.appendChild(text);
    
    // 添加解释文字
    // const explanation = document.createElementNS("http://www.w3.org/2000/svg", "text");
    // explanation.setAttribute("x", "50%");
    // explanation.setAttribute("y", "10%");
    // explanation.setAttribute("text-anchor", "middle");
    // explanation.setAttribute("fill", "red");
    // explanation.setAttribute("font-size", "12");
    // explanation.textContent = "红色单元格在同一行/列，可以排除该行/列其他位置的数字" + num;
    // svg.appendChild(explanation);
}

// 绘制三链数法
function drawNakedTriple(svg, data) {
    // 根据数据类型绘制不同类型的三链数
    if (data.tripleRow !== undefined) {
        // 行方向的三链数
        const { row, col1, col2, col3, num, tripleRow, tripleCol1, tripleCol2, tripleCol3 } = data;
        
        // 高亮整行
        const rowLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        rowLine.setAttribute("x1", "0");
        rowLine.setAttribute("y1", `${(tripleRow + 0.5) * (100 / 9)}%`);
        rowLine.setAttribute("x2", "100%");
        rowLine.setAttribute("y2", `${(tripleRow + 0.5) * (100 / 9)}%`);
        rowLine.setAttribute("stroke", "#4a69bd");
        rowLine.setAttribute("stroke-width", "3");
        rowLine.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(rowLine);
        
        // 标记三链数单元格
        const tripleRect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        tripleRect1.setAttribute("x", `${tripleCol1 * (100 / 9)}%`);
        tripleRect1.setAttribute("y", `${tripleRow * (100 / 9)}%`);
        tripleRect1.setAttribute("width", `${100 / 9}%`);
        tripleRect1.setAttribute("height", `${100 / 9}%`);
        tripleRect1.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
        tripleRect1.setAttribute("stroke", "red");
        tripleRect1.setAttribute("stroke-width", "2");
        svg.appendChild(tripleRect1);
        
        const tripleRect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        tripleRect2.setAttribute("x", `${tripleCol2 * (100 / 9)}%`);
        tripleRect2.setAttribute("y", `${tripleRow * (100 / 9)}%`);
        tripleRect2.setAttribute("width", `${100 / 9}%`);
        tripleRect2.setAttribute("height", `${100 / 9}%`);
        tripleRect2.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
        tripleRect2.setAttribute("stroke", "red");
        tripleRect2.setAttribute("stroke-width", "2");
        svg.appendChild(tripleRect2);
        
        const tripleRect3 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        tripleRect3.setAttribute("x", `${tripleCol3 * (100 / 9)}%`);
        tripleRect3.setAttribute("y", `${tripleRow * (100 / 9)}%`);
        tripleRect3.setAttribute("width", `${100 / 9}%`);
        tripleRect3.setAttribute("height", `${100 / 9}%`);
        tripleRect3.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
        tripleRect3.setAttribute("stroke", "red");
        tripleRect3.setAttribute("stroke-width", "2");
        svg.appendChild(tripleRect3);
        
        // 标记目标单元格
        const targetRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        targetRect.setAttribute("x", `${col1 * (100 / 9)}%`);
        targetRect.setAttribute("y", `${row * (100 / 9)}%`);
        targetRect.setAttribute("width", `${100 / 9}%`);
        targetRect.setAttribute("height", `${100 / 9}%`);
        targetRect.setAttribute("fill", "rgba(74, 105, 189, 0.3)");
        targetRect.setAttribute("stroke", "#4a69bd");
        targetRect.setAttribute("stroke-width", "2");
        svg.appendChild(targetRect);
        
        // 添加连接线表示三链数关系 - 使用更清晰的表示方法
        const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line1.setAttribute("x1", `${(tripleCol1 + 0.5) * (100 / 9)}%`);
        line1.setAttribute("y1", `${(tripleRow + 0.5) * (100 / 9)}%`);
        line1.setAttribute("x2", `${(tripleCol2 + 0.5) * (100 / 9)}%`);
        line1.setAttribute("y2", `${(tripleRow + 0.5) * (100 / 9)}%`);
        line1.setAttribute("stroke", "red");
        line1.setAttribute("stroke-width", "4");
        line1.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(line1);
        
        const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line2.setAttribute("x1", `${(tripleCol2 + 0.5) * (100 / 9)}%`);
        line2.setAttribute("y1", `${(tripleRow + 0.5) * (100 / 9)}%`);
        line2.setAttribute("x2", `${(tripleCol3 + 0.5) * (100 / 9)}%`);
        line2.setAttribute("y2", `${(tripleRow + 0.5) * (100 / 9)}%`);
        line2.setAttribute("stroke", "red");
        line2.setAttribute("stroke-width", "4");
        line2.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(line2);
        
        // 添加从三链数到目标单元格的连接线
        const line3 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line3.setAttribute("x1", `${(tripleCol1 + 0.5) * (100 / 9)}%`);
        line3.setAttribute("y1", `${(tripleRow + 0.5) * (100 / 9)}%`);
        line3.setAttribute("x2", `${(col1 + 0.5) * (100 / 9)}%`);
        line3.setAttribute("y2", `${(row + 0.5) * (100 / 9)}%`);
        line3.setAttribute("stroke", "orange");
        line3.setAttribute("stroke-width", "2");
        line3.setAttribute("stroke-dasharray", "3,3");
        svg.appendChild(line3);
        
        const line4 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line4.setAttribute("x1", `${(tripleCol2 + 0.5) * (100 / 9)}%`);
        line4.setAttribute("y1", `${(tripleRow + 0.5) * (100 / 9)}%`);
        line4.setAttribute("x2", `${(col1 + 0.5) * (100 / 9)}%`);
        line4.setAttribute("y2", `${(row + 0.5) * (100 / 9)}%`);
        line4.setAttribute("stroke", "orange");
        line4.setAttribute("stroke-width", "2");
        line4.setAttribute("stroke-dasharray", "3,3");
        svg.appendChild(line4);
        
        const line5 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line5.setAttribute("x1", `${(tripleCol3 + 0.5) * (100 / 9)}%`);
        line5.setAttribute("y1", `${(tripleRow + 0.5) * (100 / 9)}%`);
        line5.setAttribute("x2", `${(col1 + 0.5) * (100 / 9)}%`);
        line5.setAttribute("y2", `${(row + 0.5) * (100 / 9)}%`);
        line5.setAttribute("stroke", "orange");
        line5.setAttribute("stroke-width", "2");
        line5.setAttribute("stroke-dasharray", "3,3");
        svg.appendChild(line5);
        
        // 添加文字说明
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", "50%");
        text.setAttribute("y", "5%");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "#4a69bd");
        text.setAttribute("font-size", "16");
        text.setAttribute("font-weight", "bold");
        text.textContent = "三链数法（行方向）";
        svg.appendChild(text);
        
        // 添加解释文字
        const explanation = document.createElementNS("http://www.w3.org/2000/svg", "text");
        explanation.setAttribute("x", "50%");
        explanation.setAttribute("y", "10%");
        explanation.setAttribute("text-anchor", "middle");
        explanation.setAttribute("fill", "red");
        explanation.setAttribute("font-size", "12");
        explanation.textContent = "第" + (tripleRow+1) + "行的第" + (tripleCol1+1) + "、" + (tripleCol2+1) + "、" + (tripleCol3+1) + "列的三个红色单元格只能填入相同的三个数字" + num + "，可以排除第" + (row+1) + "行第" + (col1+1) + "列的数字" + num;
        svg.appendChild(explanation);
    } else if (data.tripleCol !== undefined) {
        // 列方向的三链数
        const { row1, row2, row3, col, num, tripleCol, tripleRow1, tripleRow2, tripleRow3 } = data;
        
        // 高亮整列
        const colLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        colLine.setAttribute("x1", `${(tripleCol + 0.5) * (100 / 9)}%`);
        colLine.setAttribute("y1", "0");
        colLine.setAttribute("x2", `${(tripleCol + 0.5) * (100 / 9)}%`);
        colLine.setAttribute("y2", "100%");
        colLine.setAttribute("stroke", "#4a69bd");
        colLine.setAttribute("stroke-width", "3");
        colLine.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(colLine);
        
        // 标记三链数单元格
        const tripleRect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        tripleRect1.setAttribute("x", `${tripleCol * (100 / 9)}%`);
        tripleRect1.setAttribute("y", `${tripleRow1 * (100 / 9)}%`);
        tripleRect1.setAttribute("width", `${100 / 9}%`);
        tripleRect1.setAttribute("height", `${100 / 9}%`);
        tripleRect1.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
        tripleRect1.setAttribute("stroke", "red");
        tripleRect1.setAttribute("stroke-width", "2");
        svg.appendChild(tripleRect1);
        
        const tripleRect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        tripleRect2.setAttribute("x", `${tripleCol * (100 / 9)}%`);
        tripleRect2.setAttribute("y", `${tripleRow2 * (100 / 9)}%`);
        tripleRect2.setAttribute("width", `${100 / 9}%`);
        tripleRect2.setAttribute("height", `${100 / 9}%`);
        tripleRect2.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
        tripleRect2.setAttribute("stroke", "red");
        tripleRect2.setAttribute("stroke-width", "2");
        svg.appendChild(tripleRect2);
        
        const tripleRect3 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        tripleRect3.setAttribute("x", `${tripleCol * (100 / 9)}%`);
        tripleRect3.setAttribute("y", `${tripleRow3 * (100 / 9)}%`);
        tripleRect3.setAttribute("width", `${100 / 9}%`);
        tripleRect3.setAttribute("height", `${100 / 9}%`);
        tripleRect3.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
        tripleRect3.setAttribute("stroke", "red");
        tripleRect3.setAttribute("stroke-width", "2");
        svg.appendChild(tripleRect3);
        
        // 标记目标单元格
        const targetRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        targetRect.setAttribute("x", `${col * (100 / 9)}%`);
        targetRect.setAttribute("y", `${row1 * (100 / 9)}%`);
        targetRect.setAttribute("width", `${100 / 9}%`);
        targetRect.setAttribute("height", `${100 / 9}%`);
        targetRect.setAttribute("fill", "rgba(74, 105, 189, 0.3)");
        targetRect.setAttribute("stroke", "#4a69bd");
        targetRect.setAttribute("stroke-width", "2");
        svg.appendChild(targetRect);
        
        // 添加连接线表示三链数关系 - 使用更清晰的表示方法
        const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line1.setAttribute("x1", `${(tripleCol + 0.5) * (100 / 9)}%`);
        line1.setAttribute("y1", `${(tripleRow1 + 0.5) * (100 / 9)}%`);
        line1.setAttribute("x2", `${(tripleCol + 0.5) * (100 / 9)}%`);
        line1.setAttribute("y2", `${(tripleRow2 + 0.5) * (100 / 9)}%`);
        line1.setAttribute("stroke", "red");
        line1.setAttribute("stroke-width", "4");
        line1.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(line1);
        
        const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line2.setAttribute("x1", `${(tripleCol + 0.5) * (100 / 9)}%`);
        line2.setAttribute("y1", `${(tripleRow2 + 0.5) * (100 / 9)}%`);
        line2.setAttribute("x2", `${(tripleCol + 0.5) * (100 / 9)}%`);
        line2.setAttribute("y2", `${(tripleRow3 + 0.5) * (100 / 9)}%`);
        line2.setAttribute("stroke", "red");
        line2.setAttribute("stroke-width", "4");
        line2.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(line2);
        
        // 添加从三链数到目标单元格的连接线
        const line3 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line3.setAttribute("x1", `${(tripleCol + 0.5) * (100 / 9)}%`);
        line3.setAttribute("y1", `${(tripleRow1 + 0.5) * (100 / 9)}%`);
        line3.setAttribute("x2", `${(col + 0.5) * (100 / 9)}%`);
        line3.setAttribute("y2", `${(row1 + 0.5) * (100 / 9)}%`);
        line3.setAttribute("stroke", "orange");
        line3.setAttribute("stroke-width", "2");
        line3.setAttribute("stroke-dasharray", "3,3");
        svg.appendChild(line3);
        
        const line4 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line4.setAttribute("x1", `${(tripleCol + 0.5) * (100 / 9)}%`);
        line4.setAttribute("y1", `${(tripleRow2 + 0.5) * (100 / 9)}%`);
        line4.setAttribute("x2", `${(col + 0.5) * (100 / 9)}%`);
        line4.setAttribute("y2", `${(row1 + 0.5) * (100 / 9)}%`);
        line4.setAttribute("stroke", "orange");
        line4.setAttribute("stroke-width", "2");
        line4.setAttribute("stroke-dasharray", "3,3");
        svg.appendChild(line4);
        
        const line5 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line5.setAttribute("x1", `${(tripleCol + 0.5) * (100 / 9)}%`);
        line5.setAttribute("y1", `${(tripleRow3 + 0.5) * (100 / 9)}%`);
        line5.setAttribute("x2", `${(col + 0.5) * (100 / 9)}%`);
        line5.setAttribute("y2", `${(row1 + 0.5) * (100 / 9)}%`);
        line5.setAttribute("stroke", "orange");
        line5.setAttribute("stroke-width", "2");
        line5.setAttribute("stroke-dasharray", "3,3");
        svg.appendChild(line5);
        
        // 添加文字说明
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", "50%");
        text.setAttribute("y", "5%");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "#4a69bd");
        text.setAttribute("font-size", "16");
        text.setAttribute("font-weight", "bold");
        text.textContent = "三链数法（列方向）";
        svg.appendChild(text);
        
        // 添加解释文字
        const explanation = document.createElementNS("http://www.w3.org/2000/svg", "text");
        explanation.setAttribute("x", "50%");
        explanation.setAttribute("y", "10%");
        explanation.setAttribute("text-anchor", "middle");
        explanation.setAttribute("fill", "red");
        explanation.setAttribute("font-size", "12");
        explanation.textContent = "第" + (tripleCol+1) + "列的第" + (tripleRow1+1) + "、" + (tripleRow2+1) + "、" + (tripleRow3+1) + "行的三个红色单元格只能填入相同的三个数字" + num + "，可以排除第" + (row1+1) + "行第" + (col+1) + "列的数字" + num;
        svg.appendChild(explanation);
    } else if (data.tripleBoxRow !== undefined) {
        // 宫格中的三链数
        const { row, col, num, tripleBoxRow, tripleBoxCol, positions } = data;
        
        // 高亮整个宫格
        const boxRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        boxRect.setAttribute("x", `${tripleBoxCol * (300 / 9)}%`);
        boxRect.setAttribute("y", `${tripleBoxRow * (300 / 9)}%`);
        boxRect.setAttribute("width", `${300 / 9}%`);
        boxRect.setAttribute("height", `${300 / 9}%`);
        boxRect.setAttribute("fill", "rgba(74, 105, 189, 0.2)");
        boxRect.setAttribute("stroke", "#4a69bd");
        boxRect.setAttribute("stroke-width", "2");
        boxRect.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(boxRect);
        
        // 标记三链数单元格
        positions.forEach(pos => {
            const tripleRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            tripleRect.setAttribute("x", `${pos.col * (100 / 9)}%`);
            tripleRect.setAttribute("y", `${pos.row * (100 / 9)}%`);
            tripleRect.setAttribute("width", `${100 / 9}%`);
            tripleRect.setAttribute("height", `${100 / 9}%`);
            tripleRect.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
            tripleRect.setAttribute("stroke", "red");
            tripleRect.setAttribute("stroke-width", "2");
            svg.appendChild(tripleRect);
        });
        
        // 标记目标单元格
        const targetRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        targetRect.setAttribute("x", `${col * (100 / 9)}%`);
        targetRect.setAttribute("y", `${row * (100 / 9)}%`);
        targetRect.setAttribute("width", `${100 / 9}%`);
        targetRect.setAttribute("height", `${100 / 9}%`);
        targetRect.setAttribute("fill", "rgba(74, 105, 189, 0.3)");
        targetRect.setAttribute("stroke", "#4a69bd");
        targetRect.setAttribute("stroke-width", "2");
        svg.appendChild(targetRect);
        
        // 添加从三链数到目标单元格的连接线
        positions.forEach(pos => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", `${(pos.col + 0.5) * (100 / 9)}%`);
            line.setAttribute("y1", `${(pos.row + 0.5) * (100 / 9)}%`);
            line.setAttribute("x2", `${(col + 0.5) * (100 / 9)}%`);
            line.setAttribute("y2", `${(row + 0.5) * (100 / 9)}%`);
            line.setAttribute("stroke", "orange");
            line.setAttribute("stroke-width", "2");
            line.setAttribute("stroke-dasharray", "3,3");
            svg.appendChild(line);
        });
        
        // 添加文字说明
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", "50%");
        text.setAttribute("y", "5%");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "#4a69bd");
        text.setAttribute("font-size", "16");
        text.setAttribute("font-weight", "bold");
        text.textContent = "三链数法（宫格内）";
        svg.appendChild(text);
        
        // 添加解释文字
        const explanation = document.createElementNS("http://www.w3.org/2000/svg", "text");
        explanation.setAttribute("x", "50%");
        explanation.setAttribute("y", "10%");
        explanation.setAttribute("text-anchor", "middle");
        explanation.setAttribute("fill", "red");
        explanation.setAttribute("font-size", "12");
        explanation.textContent = "第" + (tripleBoxRow+1) + "宫格内的三个红色单元格只能填入相同的三个数字" + num + "，可以排除第" + (row+1) + "行第" + (col+1) + "列的数字" + num;
        svg.appendChild(explanation);
    }
}

// 绘制X-Wing法
function drawXWing(svg, data) {
    // 根据X-Wing类型绘制不同的可视化效果
    if (data.type === "col") {
        // 列方向的X-Wing
        const { col1, col2, row1, row2, num, targetRow, targetCol } = data;
        
        // 高亮相关列
        const colLine1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        colLine1.setAttribute("x1", `${(col1 + 0.5) * (100 / 9)}%`);
        colLine1.setAttribute("y1", "0");
        colLine1.setAttribute("x2", `${(col1 + 0.5) * (100 / 9)}%`);
        colLine1.setAttribute("y2", "100%");
        colLine1.setAttribute("stroke", "#4a69bd");
        colLine1.setAttribute("stroke-width", "3");
        colLine1.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(colLine1);
        
        const colLine2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        colLine2.setAttribute("x1", `${(col2 + 0.5) * (100 / 9)}%`);
        colLine2.setAttribute("y1", "0");
        colLine2.setAttribute("x2", `${(col2 + 0.5) * (100 / 9)}%`);
        colLine2.setAttribute("y2", "100%");
        colLine2.setAttribute("stroke", "#4a69bd");
        colLine2.setAttribute("stroke-width", "3");
        colLine2.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(colLine2);
        
        // 高亮相关行
        const rowLine1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        rowLine1.setAttribute("x1", "0");
        rowLine1.setAttribute("y1", `${(row1 + 0.5) * (100 / 9)}%`);
        rowLine1.setAttribute("x2", "100%");
        rowLine1.setAttribute("y2", `${(row1 + 0.5) * (100 / 9)}%`);
        rowLine1.setAttribute("stroke", "#4a69bd");
        rowLine1.setAttribute("stroke-width", "3");
        rowLine1.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(rowLine1);
        
        const rowLine2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        rowLine2.setAttribute("x1", "0");
        rowLine2.setAttribute("y1", `${(row2 + 0.5) * (100 / 9)}%`);
        rowLine2.setAttribute("x2", "100%");
        rowLine2.setAttribute("y2", `${(row2 + 0.5) * (100 / 9)}%`);
        rowLine2.setAttribute("stroke", "#4a69bd");
        rowLine2.setAttribute("stroke-width", "3");
        rowLine2.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(rowLine2);
        
        // 标记X-Wing位置
        const xWingRect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        xWingRect1.setAttribute("x", `${col1 * (100 / 9)}%`);
        xWingRect1.setAttribute("y", `${row1 * (100 / 9)}%`);
        xWingRect1.setAttribute("width", `${100 / 9}%`);
        xWingRect1.setAttribute("height", `${100 / 9}%`);
        xWingRect1.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
        xWingRect1.setAttribute("stroke", "red");
        xWingRect1.setAttribute("stroke-width", "2");
        svg.appendChild(xWingRect1);
        
        const xWingRect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        xWingRect2.setAttribute("x", `${col2 * (100 / 9)}%`);
        xWingRect2.setAttribute("y", `${row1 * (100 / 9)}%`);
        xWingRect2.setAttribute("width", `${100 / 9}%`);
        xWingRect2.setAttribute("height", `${100 / 9}%`);
        xWingRect2.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
        xWingRect2.setAttribute("stroke", "red");
        xWingRect2.setAttribute("stroke-width", "2");
        svg.appendChild(xWingRect2);
        
        const xWingRect3 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        xWingRect3.setAttribute("x", `${col1 * (100 / 9)}%`);
        xWingRect3.setAttribute("y", `${row2 * (100 / 9)}%`);
        xWingRect3.setAttribute("width", `${100 / 9}%`);
        xWingRect3.setAttribute("height", `${100 / 9}%`);
        xWingRect3.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
        xWingRect3.setAttribute("stroke", "red");
        xWingRect3.setAttribute("stroke-width", "2");
        svg.appendChild(xWingRect3);
        
        const xWingRect4 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        xWingRect4.setAttribute("x", `${col2 * (100 / 9)}%`);
        xWingRect4.setAttribute("y", `${row2 * (100 / 9)}%`);
        xWingRect4.setAttribute("width", `${100 / 9}%`);
        xWingRect4.setAttribute("height", `${100 / 9}%`);
        xWingRect4.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
        xWingRect4.setAttribute("stroke", "red");
        xWingRect4.setAttribute("stroke-width", "2");
        svg.appendChild(xWingRect4);
        
        // 添加连接线表示X-Wing关系 - 使用更清晰的表示方法
        // 绘制X形状的连接线
        const diagonal1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        diagonal1.setAttribute("x1", `${(col1 + 0.5) * (100 / 9)}%`);
        diagonal1.setAttribute("y1", `${(row1 + 0.5) * (100 / 9)}%`);
        diagonal1.setAttribute("x2", `${(col2 + 0.5) * (100 / 9)}%`);
        diagonal1.setAttribute("y2", `${(row2 + 0.5) * (100 / 9)}%`);
        diagonal1.setAttribute("stroke", "red");
        diagonal1.setAttribute("stroke-width", "4");
        diagonal1.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(diagonal1);
        
        const diagonal2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        diagonal2.setAttribute("x1", `${(col2 + 0.5) * (100 / 9)}%`);
        diagonal2.setAttribute("y1", `${(row1 + 0.5) * (100 / 9)}%`);
        diagonal2.setAttribute("x2", `${(col1 + 0.5) * (100 / 9)}%`);
        diagonal2.setAttribute("y2", `${(row2 + 0.5) * (100 / 9)}%`);
        diagonal2.setAttribute("stroke", "red");
        diagonal2.setAttribute("stroke-width", "4");
        diagonal2.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(diagonal2);
        
        // 添加水平和垂直连接线，形成完整的X-Wing框架
        const horizontal1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        horizontal1.setAttribute("x1", `${(col1 + 0.5) * (100 / 9)}%`);
        horizontal1.setAttribute("y1", `${(row1 + 0.5) * (100 / 9)}%`);
        horizontal1.setAttribute("x2", `${(col2 + 0.5) * (100 / 9)}%`);
        horizontal1.setAttribute("y2", `${(row1 + 0.5) * (100 / 9)}%`);
        horizontal1.setAttribute("stroke", "purple");
        horizontal1.setAttribute("stroke-width", "3");
        horizontal1.setAttribute("stroke-dasharray", "4,4");
        svg.appendChild(horizontal1);
        
        const horizontal2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        horizontal2.setAttribute("x1", `${(col1 + 0.5) * (100 / 9)}%`);
        horizontal2.setAttribute("y1", `${(row2 + 0.5) * (100 / 9)}%`);
        horizontal2.setAttribute("x2", `${(col2 + 0.5) * (100 / 9)}%`);
        horizontal2.setAttribute("y2", `${(row2 + 0.5) * (100 / 9)}%`);
        horizontal2.setAttribute("stroke", "purple");
        horizontal2.setAttribute("stroke-width", "3");
        horizontal2.setAttribute("stroke-dasharray", "4,4");
        svg.appendChild(horizontal2);
        
        const vertical1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        vertical1.setAttribute("x1", `${(col1 + 0.5) * (100 / 9)}%`);
        vertical1.setAttribute("y1", `${(row1 + 0.5) * (100 / 9)}%`);
        vertical1.setAttribute("x2", `${(col1 + 0.5) * (100 / 9)}%`);
        vertical1.setAttribute("y2", `${(row2 + 0.5) * (100 / 9)}%`);
        vertical1.setAttribute("stroke", "purple");
        vertical1.setAttribute("stroke-width", "3");
        vertical1.setAttribute("stroke-dasharray", "4,4");
        svg.appendChild(vertical1);
        
        const vertical2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        vertical2.setAttribute("x1", `${(col2 + 0.5) * (100 / 9)}%`);
        vertical2.setAttribute("y1", `${(row1 + 0.5) * (100 / 9)}%`);
        vertical2.setAttribute("x2", `${(col2 + 0.5) * (100 / 9)}%`);
        vertical2.setAttribute("y2", `${(row2 + 0.5) * (100 / 9)}%`);
        vertical2.setAttribute("stroke", "purple");
        vertical2.setAttribute("stroke-width", "3");
        vertical2.setAttribute("stroke-dasharray", "4,4");
        svg.appendChild(vertical2);
        
        // 添加从X-Wing到目标单元格的连接线
        const lineToTarget = document.createElementNS("http://www.w3.org/2000/svg", "line");
        lineToTarget.setAttribute("x1", `${(col1 + 0.5) * (100 / 9)}%`);
        lineToTarget.setAttribute("y1", `${(row1 + 0.5) * (100 / 9)}%`);
        lineToTarget.setAttribute("x2", `${(targetCol + 0.5) * (100 / 9)}%`);
        lineToTarget.setAttribute("y2", `${(targetRow + 0.5) * (100 / 9)}%`);
        lineToTarget.setAttribute("stroke", "orange");
        lineToTarget.setAttribute("stroke-width", "2");
        lineToTarget.setAttribute("stroke-dasharray", "3,3");
        svg.appendChild(lineToTarget);
        
        // 标记目标单元格（如果有）
        if (targetRow !== undefined && targetCol !== undefined) {
            const targetRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            targetRect.setAttribute("x", `${targetCol * (100 / 9)}%`);
            targetRect.setAttribute("y", `${targetRow * (100 / 9)}%`);
            targetRect.setAttribute("width", `${100 / 9}%`);
            targetRect.setAttribute("height", `${100 / 9}%`);
            targetRect.setAttribute("fill", "rgba(74, 105, 189, 0.3)");
            targetRect.setAttribute("stroke", "#4a69bd");
            targetRect.setAttribute("stroke-width", "2");
            svg.appendChild(targetRect);
        }
        
        // 添加文字说明
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", "50%");
        text.setAttribute("y", "5%");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "#4a69bd");
        text.setAttribute("font-size", "16");
        text.setAttribute("font-weight", "bold");
        text.textContent = "X-Wing法（列方向）";
        svg.appendChild(text);
        
        // 添加解释文字
        const explanation = document.createElementNS("http://www.w3.org/2000/svg", "text");
        explanation.setAttribute("x", "50%");
        explanation.setAttribute("y", "10%");
        explanation.setAttribute("text-anchor", "middle");
        explanation.setAttribute("fill", "red");
        explanation.setAttribute("font-size", "12");
        explanation.textContent = "数字" + num + "在第" + (col1+1) + "列和第" + (col2+1) + "列的第" + (row1+1) + "行和第" + (row2+1) + "行形成X-Wing模式，可以排除第" + (targetRow+1) + "行第" + (targetCol+1) + "列的数字" + num;
        svg.appendChild(explanation);
    } else {
        // 行方向的X-Wing（默认情况）
        const { row1, row2, col1, col2, num, targetRow, targetCol } = data;
        
        // 高亮相关行
        const rowLine1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        rowLine1.setAttribute("x1", "0");
        rowLine1.setAttribute("y1", `${(row1 + 0.5) * (100 / 9)}%`);
        rowLine1.setAttribute("x2", "100%");
        rowLine1.setAttribute("y2", `${(row1 + 0.5) * (100 / 9)}%`);
        rowLine1.setAttribute("stroke", "#4a69bd");
        rowLine1.setAttribute("stroke-width", "3");
        rowLine1.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(rowLine1);
        
        const rowLine2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        rowLine2.setAttribute("x1", "0");
        rowLine2.setAttribute("y1", `${(row2 + 0.5) * (100 / 9)}%`);
        rowLine2.setAttribute("x2", "100%");
        rowLine2.setAttribute("y2", `${(row2 + 0.5) * (100 / 9)}%`);
        rowLine2.setAttribute("stroke", "#4a69bd");
        rowLine2.setAttribute("stroke-width", "3");
        rowLine2.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(rowLine2);
        
        // 高亮相关列
        const colLine1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        colLine1.setAttribute("x1", `${(col1 + 0.5) * (100 / 9)}%`);
        colLine1.setAttribute("y1", "0");
        colLine1.setAttribute("x2", `${(col1 + 0.5) * (100 / 9)}%`);
        colLine1.setAttribute("y2", "100%");
        colLine1.setAttribute("stroke", "#4a69bd");
        colLine1.setAttribute("stroke-width", "3");
        colLine1.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(colLine1);
        
        const colLine2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        colLine2.setAttribute("x1", `${(col2 + 0.5) * (100 / 9)}%`);
        colLine2.setAttribute("y1", "0");
        colLine2.setAttribute("x2", `${(col2 + 0.5) * (100 / 9)}%`);
        colLine2.setAttribute("y2", "100%");
        colLine2.setAttribute("stroke", "#4a69bd");
        colLine2.setAttribute("stroke-width", "3");
        colLine2.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(colLine2);
        
        // 标记X-Wing位置
        const xWingRect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        xWingRect1.setAttribute("x", `${col1 * (100 / 9)}%`);
        xWingRect1.setAttribute("y", `${row1 * (100 / 9)}%`);
        xWingRect1.setAttribute("width", `${100 / 9}%`);
        xWingRect1.setAttribute("height", `${100 / 9}%`);
        xWingRect1.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
        xWingRect1.setAttribute("stroke", "red");
        xWingRect1.setAttribute("stroke-width", "2");
        svg.appendChild(xWingRect1);
        
        const xWingRect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        xWingRect2.setAttribute("x", `${col2 * (100 / 9)}%`);
        xWingRect2.setAttribute("y", `${row1 * (100 / 9)}%`);
        xWingRect2.setAttribute("width", `${100 / 9}%`);
        xWingRect2.setAttribute("height", `${100 / 9}%`);
        xWingRect2.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
        xWingRect2.setAttribute("stroke", "red");
        xWingRect2.setAttribute("stroke-width", "2");
        svg.appendChild(xWingRect2);
        
        const xWingRect3 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        xWingRect3.setAttribute("x", `${col1 * (100 / 9)}%`);
        xWingRect3.setAttribute("y", `${row2 * (100 / 9)}%`);
        xWingRect3.setAttribute("width", `${100 / 9}%`);
        xWingRect3.setAttribute("height", `${100 / 9}%`);
        xWingRect3.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
        xWingRect3.setAttribute("stroke", "red");
        xWingRect3.setAttribute("stroke-width", "2");
        svg.appendChild(xWingRect3);
        
        const xWingRect4 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        xWingRect4.setAttribute("x", `${col2 * (100 / 9)}%`);
        xWingRect4.setAttribute("y", `${row2 * (100 / 9)}%`);
        xWingRect4.setAttribute("width", `${100 / 9}%`);
        xWingRect4.setAttribute("height", `${100 / 9}%`);
        xWingRect4.setAttribute("fill", "rgba(255, 0, 0, 0.3)");
        xWingRect4.setAttribute("stroke", "red");
        xWingRect4.setAttribute("stroke-width", "2");
        svg.appendChild(xWingRect4);
        
        // 添加连接线表示X-Wing关系 - 使用更清晰的表示方法
        // 绘制X形状的连接线
        const diagonal1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        diagonal1.setAttribute("x1", `${(col1 + 0.5) * (100 / 9)}%`);
        diagonal1.setAttribute("y1", `${(row1 + 0.5) * (100 / 9)}%`);
        diagonal1.setAttribute("x2", `${(col2 + 0.5) * (100 / 9)}%`);
        diagonal1.setAttribute("y2", `${(row2 + 0.5) * (100 / 9)}%`);
        diagonal1.setAttribute("stroke", "red");
        diagonal1.setAttribute("stroke-width", "4");
        diagonal1.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(diagonal1);
        
        const diagonal2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        diagonal2.setAttribute("x1", `${(col2 + 0.5) * (100 / 9)}%`);
        diagonal2.setAttribute("y1", `${(row1 + 0.5) * (100 / 9)}%`);
        diagonal2.setAttribute("x2", `${(col1 + 0.5) * (100 / 9)}%`);
        diagonal2.setAttribute("y2", `${(row2 + 0.5) * (100 / 9)}%`);
        diagonal2.setAttribute("stroke", "red");
        diagonal2.setAttribute("stroke-width", "4");
        diagonal2.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(diagonal2);
        
        // 添加水平和垂直连接线，形成完整的X-Wing框架
        const horizontal1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        horizontal1.setAttribute("x1", `${(col1 + 0.5) * (100 / 9)}%`);
        horizontal1.setAttribute("y1", `${(row1 + 0.5) * (100 / 9)}%`);
        horizontal1.setAttribute("x2", `${(col2 + 0.5) * (100 / 9)}%`);
        horizontal1.setAttribute("y2", `${(row1 + 0.5) * (100 / 9)}%`);
        horizontal1.setAttribute("stroke", "purple");
        horizontal1.setAttribute("stroke-width", "3");
        horizontal1.setAttribute("stroke-dasharray", "4,4");
        svg.appendChild(horizontal1);
        
        const horizontal2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        horizontal2.setAttribute("x1", `${(col1 + 0.5) * (100 / 9)}%`);
        horizontal2.setAttribute("y1", `${(row2 + 0.5) * (100 / 9)}%`);
        horizontal2.setAttribute("x2", `${(col2 + 0.5) * (100 / 9)}%`);
        horizontal2.setAttribute("y2", `${(row2 + 0.5) * (100 / 9)}%`);
        horizontal2.setAttribute("stroke", "purple");
        horizontal2.setAttribute("stroke-width", "3");
        horizontal2.setAttribute("stroke-dasharray", "4,4");
        svg.appendChild(horizontal2);
        
        const vertical1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        vertical1.setAttribute("x1", `${(col1 + 0.5) * (100 / 9)}%`);
        vertical1.setAttribute("y1", `${(row1 + 0.5) * (100 / 9)}%`);
        vertical1.setAttribute("x2", `${(col1 + 0.5) * (100 / 9)}%`);
        vertical1.setAttribute("y2", `${(row2 + 0.5) * (100 / 9)}%`);
        vertical1.setAttribute("stroke", "purple");
        vertical1.setAttribute("stroke-width", "3");
        vertical1.setAttribute("stroke-dasharray", "4,4");
        svg.appendChild(vertical1);
        
        const vertical2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        vertical2.setAttribute("x1", `${(col2 + 0.5) * (100 / 9)}%`);
        vertical2.setAttribute("y1", `${(row1 + 0.5) * (100 / 9)}%`);
        vertical2.setAttribute("x2", `${(col2 + 0.5) * (100 / 9)}%`);
        vertical2.setAttribute("y2", `${(row2 + 0.5) * (100 / 9)}%`);
        vertical2.setAttribute("stroke", "purple");
        vertical2.setAttribute("stroke-width", "3");
        vertical2.setAttribute("stroke-dasharray", "4,4");
        svg.appendChild(vertical2);
        
        // 添加从X-Wing到目标单元格的连接线
        const lineToTarget = document.createElementNS("http://www.w3.org/2000/svg", "line");
        lineToTarget.setAttribute("x1", `${(col1 + 0.5) * (100 / 9)}%`);
        lineToTarget.setAttribute("y1", `${(row1 + 0.5) * (100 / 9)}%`);
        lineToTarget.setAttribute("x2", `${(targetCol + 0.5) * (100 / 9)}%`);
        lineToTarget.setAttribute("y2", `${(targetRow + 0.5) * (100 / 9)}%`);
        lineToTarget.setAttribute("stroke", "orange");
        lineToTarget.setAttribute("stroke-width", "2");
        lineToTarget.setAttribute("stroke-dasharray", "3,3");
        svg.appendChild(lineToTarget);
        
        // 标记目标单元格（如果有）
        if (targetRow !== undefined && targetCol !== undefined) {
            const targetRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            targetRect.setAttribute("x", `${targetCol * (100 / 9)}%`);
            targetRect.setAttribute("y", `${targetRow * (100 / 9)}%`);
            targetRect.setAttribute("width", `${100 / 9}%`);
            targetRect.setAttribute("height", `${100 / 9}%`);
            targetRect.setAttribute("fill", "rgba(74, 105, 189, 0.3)");
            targetRect.setAttribute("stroke", "#4a69bd");
            targetRect.setAttribute("stroke-width", "2");
            svg.appendChild(targetRect);
        }
        
        // 添加文字说明
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", "50%");
        text.setAttribute("y", "5%");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "#4a69bd");
        text.setAttribute("font-size", "16");
        text.setAttribute("font-weight", "bold");
        text.textContent = "X-Wing法（行方向）";
        svg.appendChild(text);
        
        // 添加解释文字
        const explanation = document.createElementNS("http://www.w3.org/2000/svg", "text");
        explanation.setAttribute("x", "50%");
        explanation.setAttribute("y", "10%");
        explanation.setAttribute("text-anchor", "middle");
        explanation.setAttribute("fill", "red");
        explanation.setAttribute("font-size", "12");
        explanation.textContent = "数字" + num + "在第" + (row1+1) + "行和第" + (row2+1) + "行的第" + (col1+1) + "列和第" + (col2+1) + "列形成X-Wing模式，可以排除第" + (targetRow+1) + "行第" + (targetCol+1) + "列的数字" + num;
        svg.appendChild(explanation);
    }
}
