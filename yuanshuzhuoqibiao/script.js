// 字段映射 - 英文到中文
const fieldMapping = {
    "id": "原子序数",
    "zwmc": "元素名称",
    "ysfh": "元素符号",
    "ywmc": "英文名称",
    "yzzl": "原子质量",
    "yzbj": "原子半径/Å",
    "dzgx": "电子构型",
    "gjbj": "共价半径",
    "yztj": "原子体积",
    "lzbj": "离子半径",
    "yht": "氧化态",
    "fx": "发现",
    "ly": "来源",
    "yt": "用途",
    "zt": "状态",
    "fd": "沸点(℃)",
    "br": "比热/J/gK",
    "rhr": "熔化热/KJ/mol",
    "drxs": "导热系数/W/cmK",
    "sd": "闪点/℃",
    "rd": "熔点(℃)",
    "md": "密度(g/cc，300K)",
    "zfr": "蒸发热/KJ/mol",
    "ddl": "导电率/10的6次方/cm",
    "zrd": "自燃点/℃",
    "ty": "丰度-太阳(相对于 H=1×1012)",
    "diq": "丰度-地壳/p.p.m.",
    "tpybm": "丰度-太平洋表面",
    "dxysc": "丰度-大西洋深处",
    "zlsj": "滞留时间/年",
    "hsz": "丰度-海水中/p.p.m.",
    "dxybm": "丰度-大西洋表面/p.p.m.",
    "daq": "丰度-大气/p.p.m.（体积）",
    "tpysc": "丰度-太平洋深处",
    "qgz": "人体-器官中",
    "xie": "人体-血/mg dm-3",
    "gu": "人体-骨/p.p.m",
    "gan": "人体-肝/p.p.m",
    "jr": "人体-肌肉/p.p.m",
    "rsrl": "人体-日摄入量/mg",
    "rtzl": "人体-人(70Kg)均体内总量/mg",
    "code": "状态码",
    "dzmx": "电子模型图"
};

// 元素名称拼音映射
const elementPinyinMap = {
    "氢": "qīng",
    "氦": "hài",
    "锂": "lǐ",
    "铍": "pí",
    "硼": "péng",
    "碳": "tàn",
    "氮": "dàn",
    "氧": "yǎng",
    "氟": "fú",
    "氖": "nǎi",
    "钠": "nà",
    "镁": "měi",
    "铝": "lǚ",
    "硅": "guī",
    "磷": "lín",
    "硫": "liú",
    "氯": "lǜ",
    "氩": "yà",
    "钾": "jiǎ",
    "钙": "gài",
    "钪": "kàng",
    "钛": "tài",
    "钒": "fán",
    "铬": "gè",
    "锰": "měng",
    "铁": "tiě",
    "钴": "gǔ",
    "镍": "niè",
    "铜": "tóng",
    "锌": "xīn",
    "镓": "jiā",
    "锗": "zhě",
    "砷": "shēn",
    "硒": "xī",
    "溴": "xiù",
    "氪": "kè",
    "铷": "rú",
    "锶": "sī",
    "钇": "yǐ",
    "锆": "gào",
    "铌": "ní",
    "钼": "mù",
    "锝": "dé",
    "钌": "liǎo",
    "铑": "lǎo",
    "钯": "bǎ",
    "银": "yín",
    "镉": "gé",
    "铟": "yīn",
    "锡": "xī",
    "锑": "tī",
    "碲": "dì",
    "碘": "diǎn",
    "氙": "xiān",
    "铯": "sè",
    "钡": "bèi",
    "镧": "lán",
    "铈": "shì",
    "镨": "pǔ",
    "钕": "nǚ",
    "钷": "pǒ",
    "钐": "shān",
    "铕": "yǒu",
    "钆": "gá",
    "铽": "tè",
    "镝": "dī",
    "钬": "huǒ",
    "铒": "ěr",
    "铥": "diū",
    "镱": "yì",
    "镥": "lǔ",
    "铪": "hā",
    "钽": "tǎn",
    "钨": "wū",
    "铼": "lái",
    "锇": "é",
    "铱": "yī",
    "铂": "bó",
    "金": "jīn",
    "汞": "gǒng",
    "铊": "tā",
    "铅": "qiān",
    "铋": "bì",
    "钋": "pō",
    "砹": "ài",
    "氡": "dōng",
    "钫": "fāng",
    "镭": "léi",
    "锕": "ā",
    "钍": "tǔ",
    "镤": "pú",
    "铀": "yóu",
    "镎": "ná",
    "钚": "bù",
    "镅": "méi",
    "锔": "jú",
    "锫": "péi",
    "锎": "kāi",
    "锿": "āi",
    "镄": "fèi",
    "钔": "mén",
    "锘": "nuò",
    "铹": "láo",
    "𬬻": "lú",
    "𬭊": "dù",
    "𬭳": "xǐ",
    "𬭛": "bō",
    "𬭶": "hēi",
    "鿏": "mài",
    "𫟼": "dá",
    "𬬭": "lún",
    "鿔": "gē",
    "鿭": "nǐ",
    "𫓧": "fū",
    "镆": "mò",
    "𫟷": "lì",
    "鿬": "tián",
    "鿫": "ào"
};

// 元素周期表数据（完整的118个元素）
const elements = [
    // 第一周期
    { number: 1, symbol: "H", name: "氢", category: "non-metal", period: 1, group: 1 },
    { number: 2, symbol: "He", name: "氦", category: "noble-gas", period: 1, group: 18 },
    
    // 第二周期
    { number: 3, symbol: "Li", name: "锂", category: "alkali-metal", period: 2, group: 1 },
    { number: 4, symbol: "Be", name: "铍", category: "alkaline-earth", period: 2, group: 2 },
    { number: 5, symbol: "B", name: "硼", category: "semi-metal", period: 2, group: 13 },
    { number: 6, symbol: "C", name: "碳", category: "non-metal", period: 2, group: 14 },
    { number: 7, symbol: "N", name: "氮", category: "non-metal", period: 2, group: 15 },
    { number: 8, symbol: "O", name: "氧", category: "non-metal", period: 2, group: 16 },
    { number: 9, symbol: "F", name: "氟", category: "halogen", period: 2, group: 17 },
    { number: 10, symbol: "Ne", name: "氖", category: "noble-gas", period: 2, group: 18 },
    
    // 第三周期
    { number: 11, symbol: "Na", name: "钠", category: "alkali-metal", period: 3, group: 1 },
    { number: 12, symbol: "Mg", name: "镁", category: "alkaline-earth", period: 3, group: 2 },
    { number: 13, symbol: "Al", name: "铝", category: "basic-metal", period: 3, group: 13 },
    { number: 14, symbol: "Si", name: "硅", category: "semi-metal", period: 3, group: 14 },
    { number: 15, symbol: "P", name: "磷", category: "non-metal", period: 3, group: 15 },
    { number: 16, symbol: "S", name: "硫", category: "non-metal", period: 3, group: 16 },
    { number: 17, symbol: "Cl", name: "氯", category: "halogen", period: 3, group: 17 },
    { number: 18, symbol: "Ar", name: "氩", category: "noble-gas", period: 3, group: 18 },
    
    // 第四周期
    { number: 19, symbol: "K", name: "钾", category: "alkali-metal", period: 4, group: 1 },
    { number: 20, symbol: "Ca", name: "钙", category: "alkaline-earth", period: 4, group: 2 },
    { number: 21, symbol: "Sc", name: "钪", category: "transition-metal", period: 4, group: 3 },
    { number: 22, symbol: "Ti", name: "钛", category: "transition-metal", period: 4, group: 4 },
    { number: 23, symbol: "V", name: "钒", category: "transition-metal", period: 4, group: 5 },
    { number: 24, symbol: "Cr", name: "铬", category: "transition-metal", period: 4, group: 6 },
    { number: 25, symbol: "Mn", name: "锰", category: "transition-metal", period: 4, group: 7 },
    { number: 26, symbol: "Fe", name: "铁", category: "transition-metal", period: 4, group: 8 },
    { number: 27, symbol: "Co", name: "钴", category: "transition-metal", period: 4, group: 9 },
    { number: 28, symbol: "Ni", name: "镍", category: "transition-metal", period: 4, group: 10 },
    { number: 29, symbol: "Cu", name: "铜", category: "transition-metal", period: 4, group: 11 },
    { number: 30, symbol: "Zn", name: "锌", category: "transition-metal", period: 4, group: 12 },
    { number: 31, symbol: "Ga", name: "镓", category: "basic-metal", period: 4, group: 13 },
    { number: 32, symbol: "Ge", name: "锗", category: "semi-metal", period: 4, group: 14 },
    { number: 33, symbol: "As", name: "砷", category: "semi-metal", period: 4, group: 15 },
    { number: 34, symbol: "Se", name: "硒", category: "non-metal", period: 4, group: 16 },
    { number: 35, symbol: "Br", name: "溴", category: "halogen", period: 4, group: 17 },
    { number: 36, symbol: "Kr", name: "氪", category: "noble-gas", period: 4, group: 18 },
    
    // 第五周期
    { number: 37, symbol: "Rb", name: "铷", category: "alkali-metal", period: 5, group: 1 },
    { number: 38, symbol: "Sr", name: "锶", category: "alkaline-earth", period: 5, group: 2 },
    { number: 39, symbol: "Y", name: "钇", category: "transition-metal", period: 5, group: 3 },
    { number: 40, symbol: "Zr", name: "锆", category: "transition-metal", period: 5, group: 4 },
    { number: 41, symbol: "Nb", name: "铌", category: "transition-metal", period: 5, group: 5 },
    { number: 42, symbol: "Mo", name: "钼", category: "transition-metal", period: 5, group: 6 },
    { number: 43, symbol: "Tc", name: "锝", category: "transition-metal", period: 5, group: 7 },
    { number: 44, symbol: "Ru", name: "钌", category: "transition-metal", period: 5, group: 8 },
    { number: 45, symbol: "Rh", name: "铑", category: "transition-metal", period: 5, group: 9 },
    { number: 46, symbol: "Pd", name: "钯", category: "transition-metal", period: 5, group: 10 },
    { number: 47, symbol: "Ag", name: "银", category: "transition-metal", period: 5, group: 11 },
    { number: 48, symbol: "Cd", name: "镉", category: "transition-metal", period: 5, group: 12 },
    { number: 49, symbol: "In", name: "铟", category: "basic-metal", period: 5, group: 13 },
    { number: 50, symbol: "Sn", name: "锡", category: "basic-metal", period: 5, group: 14 },
    { number: 51, symbol: "Sb", name: "锑", category: "semi-metal", period: 5, group: 15 },
    { number: 52, symbol: "Te", name: "碲", category: "semi-metal", period: 5, group: 16 },
    { number: 53, symbol: "I", name: "碘", category: "halogen", period: 5, group: 17 },
    { number: 54, symbol: "Xe", name: "氙", category: "noble-gas", period: 5, group: 18 },
    
    // 第六周期
    { number: 55, symbol: "Cs", name: "铯", category: "alkali-metal", period: 6, group: 1 },
    { number: 56, symbol: "Ba", name: "钡", category: "alkaline-earth", period: 6, group: 2 },
    
    // 镧系元素（第六周期）
    { number: 57, symbol: "La", name: "镧", category: "lanthanide", period: 6, group: 3 },
    { number: 58, symbol: "Ce", name: "铈", category: "lanthanide", period: 6, group: 3 },
    { number: 59, symbol: "Pr", name: "镨", category: "lanthanide", period: 6, group: 3 },
    { number: 60, symbol: "Nd", name: "钕", category: "lanthanide", period: 6, group: 3 },
    { number: 61, symbol: "Pm", name: "钷", category: "lanthanide", period: 6, group: 3 },
    { number: 62, symbol: "Sm", name: "钐", category: "lanthanide", period: 6, group: 3 },
    { number: 63, symbol: "Eu", name: "铕", category: "lanthanide", period: 6, group: 3 },
    { number: 64, symbol: "Gd", name: "钆", category: "lanthanide", period: 6, group: 3 },
    { number: 65, symbol: "Tb", name: "铽", category: "lanthanide", period: 6, group: 3 },
    { number: 66, symbol: "Dy", name: "镝", category: "lanthanide", period: 6, group: 3 },
    { number: 67, symbol: "Ho", name: "钬", category: "lanthanide", period: 6, group: 3 },
    { number: 68, symbol: "Er", name: "铒", category: "lanthanide", period: 6, group: 3 },
    { number: 69, symbol: "Tm", name: "铥", category: "lanthanide", period: 6, group: 3 },
    { number: 70, symbol: "Yb", name: "镱", category: "lanthanide", period: 6, group: 3 },
    { number: 71, symbol: "Lu", name: "镥", category: "lanthanide", period: 6, group: 3 },
    
    // 第六周期（继续）
    { number: 72, symbol: "Hf", name: "铪", category: "transition-metal", period: 6, group: 4 },
    { number: 73, symbol: "Ta", name: "钽", category: "transition-metal", period: 6, group: 5 },
    { number: 74, symbol: "W", name: "钨", category: "transition-metal", period: 6, group: 6 },
    { number: 75, symbol: "Re", name: "铼", category: "transition-metal", period: 6, group: 7 },
    { number: 76, symbol: "Os", name: "锇", category: "transition-metal", period: 6, group: 8 },
    { number: 77, symbol: "Ir", name: "铱", category: "transition-metal", period: 6, group: 9 },
    { number: 78, symbol: "Pt", name: "铂", category: "transition-metal", period: 6, group: 10 },
    { number: 79, symbol: "Au", name: "金", category: "transition-metal", period: 6, group: 11 },
    { number: 80, symbol: "Hg", name: "汞", category: "transition-metal", period: 6, group: 12 },
    { number: 81, symbol: "Tl", name: "铊", category: "basic-metal", period: 6, group: 13 },
    { number: 82, symbol: "Pb", name: "铅", category: "basic-metal", period: 6, group: 14 },
    { number: 83, symbol: "Bi", name: "铋", category: "basic-metal", period: 6, group: 15 },
    { number: 84, symbol: "Po", name: "钋", category: "semi-metal", period: 6, group: 16 },
    { number: 85, symbol: "At", name: "砹", category: "halogen", period: 6, group: 17 },
    { number: 86, symbol: "Rn", name: "氡", category: "noble-gas", period: 6, group: 18 },
    
    // 第七周期
    { number: 87, symbol: "Fr", name: "钫", category: "alkali-metal", period: 7, group: 1 },
    { number: 88, symbol: "Ra", name: "镭", category: "alkaline-earth", period: 7, group: 2 },
    
    // 锕系元素（第七周期）
    { number: 89, symbol: "Ac", name: "锕", category: "actinide", period: 7, group: 3 },
    { number: 90, symbol: "Th", name: "钍", category: "actinide", period: 7, group: 3 },
    { number: 91, symbol: "Pa", name: "镤", category: "actinide", period: 7, group: 3 },
    { number: 92, symbol: "U", name: "铀", category: "actinide", period: 7, group: 3 },
    { number: 93, symbol: "Np", name: "镎", category: "actinide", period: 7, group: 3 },
    { number: 94, symbol: "Pu", name: "钚", category: "actinide", period: 7, group: 3 },
    { number: 95, symbol: "Am", name: "镅", category: "actinide", period: 7, group: 3 },
    { number: 96, symbol: "Cm", name: "锔", category: "actinide", period: 7, group: 3 },
    { number: 97, symbol: "Bk", name: "锫", category: "actinide", period: 7, group: 3 },
    { number: 98, symbol: "Cf", name: "锎", category: "actinide", period: 7, group: 3 },
    { number: 99, symbol: "Es", name: "锿", category: "actinide", period: 7, group: 3 },
    { number: 100, symbol: "Fm", name: "镄", category: "actinide", period: 7, group: 3 },
    { number: 101, symbol: "Md", name: "钔", category: "actinide", period: 7, group: 3 },
    { number: 102, symbol: "No", name: "锘", category: "actinide", period: 7, group: 3 },
    { number: 103, symbol: "Lr", name: "铹", category: "actinide", period: 7, group: 3 },
    
    // 第七周期（继续）
    { number: 104, symbol: "Rf", name: "𬬻", category: "transition-metal", period: 7, group: 4 },
    { number: 105, symbol: "Db", name: "𬭊", category: "transition-metal", period: 7, group: 5 },
    { number: 106, symbol: "Sg", name: "𬭳", category: "transition-metal", period: 7, group: 6 },
    { number: 107, symbol: "Bh", name: "𬭛", category: "transition-metal", period: 7, group: 7 },
    { number: 108, symbol: "Hs", name: "𬭶", category: "transition-metal", period: 7, group: 8 },
    { number: 109, symbol: "Mt", name: "鿏", category: "transition-metal", period: 7, group: 9 },
    { number: 110, symbol: "Ds", name: "𫟼", category: "transition-metal", period: 7, group: 10 },
    { number: 111, symbol: "Rg", name: "𬬭", category: "transition-metal", period: 7, group: 11 },
    { number: 112, symbol: "Cn", name: "鿔", category: "transition-metal", period: 7, group: 12 },
    { number: 113, symbol: "Nh", name: "鿭", category: "basic-metal", period: 7, group: 13 },
    { number: 114, symbol: "Fl", name: "𫓧", category: "basic-metal", period: 7, group: 14 },
    { number: 115, symbol: "Mc", name: "镆", category: "basic-metal", period: 7, group: 15 },
    { number: 116, symbol: "Lv", name: "𫟷", category: "basic-metal", period: 7, group: 16 },
    { number: 117, symbol: "Ts", name: "鿬", category: "halogen", period: 7, group: 17 },
    { number: 118, symbol: "Og", name: "鿫", category: "noble-gas", period: 7, group: 18 }
];

// 初始化周期表
function initPeriodicTable() {
    const tableContainer = document.getElementById('periodic-table');
    
    // 创建主周期表网格（18列，9行，包括镧系和锕系）
    const grid = [];
    for (let i = 0; i < 9 * 18; i++) {
        grid[i] = null;
    }
    
    // 根据周期和族放置元素
    elements.forEach(element => {
        if (element.period && element.group) {
            let period = element.period;
            let group = element.group;
            
            // 对于镧系元素（57-71），放在第8行
            if (element.number >= 57 && element.number <= 71) {
                period = 8;
                group = element.number - 54; // 57从第3列开始
            }
            // 对于锕系元素（89-103），放在第9行
            else if (element.number >= 89 && element.number <= 103) {
                period = 9;
                group = element.number - 86; // 89从第3列开始
            }
            
            const index = (period - 1) * 18 + (group - 1);
            if (index >= 0 && index < grid.length) {
                grid[index] = element;
            }
        }
    });
    
    // 为镧系和锕系在主表中添加占位符
    if (!grid[(6-1) * 18 + (3-1)]) { // 第6周期第3族位置
        grid[(6-1) * 18 + (3-1)] = { 
            number: '*', symbol: 'La-Lu', name: '镧系', 
            category: 'lanthanide', isPlaceholder: true 
        };
    }
    if (!grid[(7-1) * 18 + (3-1)]) { // 第7周期第3族位置
        grid[(7-1) * 18 + (3-1)] = { 
            number: '**', symbol: 'Ac-Lr', name: '锕系', 
            category: 'actinide', isPlaceholder: true 
        };
    }
    
    // 创建元素单元格函数
    function createElementCell(element) {
        const cell = document.createElement('div');
        if (element) {
            cell.className = `element ${element.category}`;
            
            if (element.isPlaceholder) {
                // 占位符显示
                cell.innerHTML = `
                    <div class="number">${element.number}</div>
                    <div class="symbol">${element.symbol}</div>
                    <div class="name">${element.name}</div>
                `;
                cell.style.fontSize = '0.6rem';
                cell.style.cursor = 'default';
            } else {
                // 正常元素显示
                cell.innerHTML = `
                    <div class="number">${element.number}</div>
                    <div class="symbol">${element.symbol}</div>
                    <div class="name">${element.name}</div>
                `;
                
                // 添加点击事件
                cell.addEventListener('click', () => {
                    fetchElementData(element.number);
                    // 高亮选中的元素
                    document.querySelectorAll('.element').forEach(el => el.classList.remove('selected'));
                    cell.classList.add('selected');
                });
            }
        } else {
            cell.className = 'element empty';
            cell.style.visibility = 'hidden';
        }
        
        return cell;
    }
    
    // 生成周期表网格
    grid.forEach(element => {
        tableContainer.appendChild(createElementCell(element));
    });
}

// 获取元素数据
async function fetchElementData(atomicNumber) {
    const detailsContent = document.getElementById('details-content');
    detailsContent.innerHTML = '<div class="loading">正在加载元素信息...</div>';
    
    try {
        // 尝试使用真实API获取数据
        // 注意：实际使用时需要替换为正确的API地址和密钥
        const apiUrl = `https://cn.apihz.cn/api/other/yuansu.php?id=10007708&key=0e156b1b7c28da5f20a18a298d8dcbb9&name=${atomicNumber}`;
        
        let data;
        try {
            const response = await fetch(apiUrl);
            if (response.ok) {
                data = await response.json();
                if (data.code !== 200) {
                    throw new Error('API返回错误状态');
                }
            } else {
                throw new Error('网络请求失败');
            }
        } catch (apiError) {
            console.log('API请求失败，使用模拟数据:', apiError.message);
            
            // 如果API失败，使用模拟数据
            await new Promise(resolve => setTimeout(resolve, 500)); // 模拟网络延迟
            
            // 根据原子序数提供不同的模拟数据
            data = getSimulatedData(atomicNumber);
        }
        
        // 更新元素标题信息，包含拼音
        const elementName = data.zwmc || '未知元素';
        const pinyin = elementPinyinMap[elementName] || '';
        document.getElementById('element-symbol').textContent = data.ysfh || '?';
        document.getElementById('element-name').innerHTML = `${elementName} <span class="pinyin">(${pinyin})</span>`;
        document.getElementById('element-number').textContent = `原子序数: ${data.id || atomicNumber}`;
        
        // 显示元素详细信息
        displayElementDetails(data);
    } catch (error) {
        console.error('获取数据时发生错误:', error);
        detailsContent.innerHTML = `<div class="loading">获取数据失败: ${error.message}<br>请检查网络连接或API配置</div>`;
    }
}

// 获取模拟数据的函数
function getSimulatedData(atomicNumber) {
    const simulatedData = {
        1: { "id": "1", "zwmc": "氢", "ysfh": "H", "ywmc": "Hydrogen", "yzzl": "1.008", "zt": "无色气体", "rd": "-259.14", "fd": "-252.87", "fx": "1766年发现", "yt": "用于氨的合成、石油炼制、火箭燃料等", "dzmx": "https://rescdn.apihz.cn/resimg/yuansu1/1.gif" },
        2: { "id": "2", "zwmc": "氦", "ysfh": "He", "ywmc": "Helium", "yzzl": "4.003", "zt": "无色惰性气体", "rd": "-272.20", "fd": "-268.93", "fx": "1868年发现", "yt": "填充气球、低温实验、深海潜水", "dzmx": "https://rescdn.apihz.cn/resimg/yuansu1/2.gif" },
        6: { "id": "6", "zwmc": "碳", "ysfh": "C", "ywmc": "Carbon", "yzzl": "12.011", "zt": "黑色固体(石墨)或无色晶体(金刚石)", "rd": "3500", "fd": "4027", "fx": "史前时代就已知", "yt": "制造钢铁、燃料、塑料等", "dzmx": "https://rescdn.apihz.cn/resimg/yuansu1/6.gif" },
        8: { "id": "8", "zwmc": "氧", "ysfh": "O", "ywmc": "Oxygen", "yzzl": "15.999", "zt": "无色气体", "rd": "-218.79", "fd": "-182.95", "fx": "1774年发现", "yt": "生命支持、燃烧助燃、钢铁工业", "dzmx": "https://rescdn.apihz.cn/resimg/yuansu1/8.gif" },
        26: { "id": "26", "zwmc": "铁", "ysfh": "Fe", "ywmc": "Iron", "yzzl": "55.845", "zt": "银灰色金属", "rd": "1538", "fd": "2861", "fx": "史前时代就已知", "yt": "钢铁工业、建筑材料、机械制造", "dzmx": "https://rescdn.apihz.cn/resimg/yuansu1/26.gif" },
        29: { "id": "29", "zwmc": "铜", "ysfh": "Cu", "ywmc": "Copper", "yzzl": "63.546", "zt": "红色金属", "rd": "1084.62", "fd": "2562", "fx": "史前时代就已知", "yt": "电线电缆、建筑材料、铜合金", "dzmx": "https://rescdn.apihz.cn/resimg/yuansu1/29.gif" },
        47: { "id": "47", "zwmc": "银", "ysfh": "Ag", "ywmc": "Silver", "yzzl": "107.868", "zt": "银白色金属", "rd": "961.78", "fd": "2162", "fx": "史前时代就已知", "yt": "首饰制作、电子元件、摄影业", "dzmx": "https://rescdn.apihz.cn/resimg/yuansu1/47.gif" },
        79: { "id": "79", "zwmc": "金", "ysfh": "Au", "ywmc": "Gold", "yzzl": "196.967", "zt": "金黄色金属", "rd": "1064.18", "fd": "2856", "fx": "史前时代就已知", "yt": "首饰制作、电子元件、货币制造", "dzmx": "https://rescdn.apihz.cn/resimg/yuansu1/79.gif" },
        50: { // 锡（使用提供的完整数据）
            "id": "50", "zwmc": "锡", "ysfh": "Sn", "ywmc": "Tin",
            "yzzl": "118.710", "yzbj": "1.72",
            "dzgx": "1s(2)|2s(2)p(6)|3s(2)p(6)d(10)|4s(2)p(6)d(10)|5s(2)p(2)",
            "gjbj": "1.41", "yztj": "16.3", "lzbj": "0.69", "yht": "4,2",
            "fx": "古代就已知。",
            "ly": "主要存在于锡石矿(SnO(2) )和stannine矿(Cu(2) FeSnS(4) )中",
            "yt": "用作钢罐头涂层，也用于焊料, 铜锡合金。锡的氟化物用于牙膏",
            "zt": "具有很好延展性的白色金属。", "fd": "2270", "br": "0.227",
            "rhr": "7.029", "drxs": "0.666", "rd": "232.06", "md": "7.31",
            "zfr": "295.8", "ddl": "0.0917", "ty": "100", "diq": "2.2",
            "code": 200, "dzmx": "https://rescdn.apihz.cn/resimg/yuansu1/50.gif"
        }
    };
    
    // 返回对应的数据，如果没有则返回基本信息
    return simulatedData[atomicNumber] || {
        "id": atomicNumber.toString(),
        "zwmc": elements.find(e => e.number === atomicNumber)?.name || "未知元素",
        "ysfh": elements.find(e => e.number === atomicNumber)?.symbol || "?",
        "ywmc": "Unknown",
        "zt": "暂无数据",
        "fx": "信息待完善",
        "code": 200
    };
}

// 显示元素详细信息
function displayElementDetails(data) {
    const detailsContent = document.getElementById('details-content');
    
    // 清空内容
    detailsContent.innerHTML = '';
    
    // 首先添加电子模型图像（放在最开始位置）
    if (data.dzmx) {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'element-image';
        imageContainer.innerHTML = `
            <div class="image-title">${fieldMapping.dzmx || '电子模型'}</div>
            <img src="${data.dzmx}" alt="${data.zwmc}的电子模型" onerror="this.style.display='none'">
        `;
        detailsContent.appendChild(imageContainer);
    }
    
    // 定义显示顺序，确保重要信息在前面
    const displayOrder = [
        'id', 'zwmc', 'ysfh', 'ywmc', 'yzzl', 'yzbj', 'dzgx', 'gjbj', 
        'yztj', 'lzbj', 'yht', 'zt', 'rd', 'fd', 'md', 'br', 'rhr', 
        'zfr', 'drxs', 'ddl', 'sd', 'zrd', 'fx', 'ly', 'yt',
        'ty', 'diq', 'hsz', 'tpybm', 'tpysc', 'dxybm', 'dxysc', 
        'daq', 'zlsj', 'xie', 'gu', 'gan', 'jr', 'rsrl', 'rtzl'
    ];
    
    // 按照指定顺序显示属性
    displayOrder.forEach(key => {
        if (data.hasOwnProperty(key) && key !== 'code' && key !== 'dzmx') {
            const value = data[key];
            
            // 如果值为空，跳过不显示
            if (value === '' || value === null || value === undefined) return;
            
            // 获取字段的中文名称
            const chineseName = fieldMapping[key] || key;
            
            // 创建属性显示元素
            const propertyElement = document.createElement('div');
            propertyElement.className = 'property';
            
            // 格式化特殊字段的显示
            let displayValue = value;
            if (key === 'dzgx') {
                // 电子构型特殊格式化
                displayValue = value.replace(/\|/g, ' | ');
            } else if (key === 'yht') {
                // 氧化态格式化
                displayValue = value.replace(/,/g, ', ');
            }
            
            propertyElement.innerHTML = `
                <span class="property-name">${chineseName}:</span>
                <span class="property-value">${displayValue}</span>
            `;
            
            detailsContent.appendChild(propertyElement);
        }
    });
    
    // 添加其他未在排序列表中的字段
    for (const [key, value] of Object.entries(data)) {
        // 跳过已处理的字段和不需要显示的字段
        if (displayOrder.includes(key) || key === 'code' || key === 'dzmx') continue;
        
        // 如果值为空，跳过不显示
        if (value === '' || value === null || value === undefined) continue;
        
        // 获取字段的中文名称
        const chineseName = fieldMapping[key] || key;
        
        // 创建属性显示元素
        const propertyElement = document.createElement('div');
        propertyElement.className = 'property';
        propertyElement.innerHTML = `
            <span class="property-name">${chineseName}:</span>
            <span class="property-value">${value}</span>
        `;
        
        detailsContent.appendChild(propertyElement);
    }
    
    // 如果没有数据，显示提示信息
    if (detailsContent.children.length === 0) {
        detailsContent.innerHTML = '<div class="empty-state">暂无详细信息</div>';
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    initPeriodicTable();
    
    // 默认加载锡元素的数据
    fetchElementData(50);
});