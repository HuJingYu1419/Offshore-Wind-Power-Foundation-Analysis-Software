/**
 * @filepath: js/utils/resultRenderer.js
 * @description: 结果渲染工具主入口
 *               功能：渲染计算结果、导出数据（参数+结果）、导出图表
 *               支持跨平台保存（浏览器 / Tauri 桌面应用）
 */

import { getAnchorModule } from '../Anchor/index.js';
import { renderValidationAlert, renderParameterSummary, formatNumber } from '../Anchor/shared/baseRenderer.js';
import { saveTextFile, saveImageFile } from './fileSaver.js';

// ========== 辅助函数 ==========

/**
 * 清理文本（去除多余空格和特殊字符）
 */
function cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').replace(/[<>]/g, '').trim();
}

/**
 * 判断元素是否可见
 */
function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
}

/**
 * 获取当前模块名称
 */
function getCurrentModuleName() {
    const moduleNameBadge = document.getElementById('moduleNameBadge');
    if (moduleNameBadge && moduleNameBadge.innerText !== '未选择') {
        return moduleNameBadge.innerText;
    }
    return '计算模块';
}

/**
 * 获取时间戳字符串（用于文件名）
 */
function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hour}${minute}${second}`;
}

// ========== 参数提取函数 ==========

/**
 * 从当前 DOM 中提取参数摘要数据
 */
function extractParamsFromDOM() {
    const paramsList = [];
    
    // 使用唯一的 class 精确定位参数摘要容器
    const paramContainer = document.querySelector('#resultSection .parameter-summary-container');
    
    if (!paramContainer) {
        console.log('extractParamsFromDOM: 未找到 .parameter-summary-container');
        return paramsList;
    }
    
    console.log('extractParamsFromDOM: 找到参数摘要容器');
    
    // 查找所有分类卡片
    const categoryCards = paramContainer.querySelectorAll('.bg-white.rounded.p-2');
    
    for (const card of categoryCards) {
        // 获取分类名称
        let category = '其他参数';
        const titleElem = card.querySelector('.font-semibold');
        if (titleElem) {
            category = cleanText(titleElem.innerText);
            category = category.replace(/[📐🔧💧🌍📊⚙️📦⚡📝]/g, '').replace(/:/g, '').trim();
        }
        
        // 提取参数行
        const paramRows = card.querySelectorAll('.flex.justify-between');
        const params = [];
        
        for (const row of paramRows) {
            const spans = row.querySelectorAll('span');
            if (spans.length >= 2) {
                let key = cleanText(spans[0].innerText);
                let value = cleanText(spans[1].innerText);
                key = key.replace(/[：:]/g, '');
                if (key && value && !key.includes('注') && !key.includes('说明')) {
                    params.push({ key, value });
                }
            }
        }
        
        if (params.length > 0) {
            paramsList.push({ category, params });
        }
    }
    
    console.log(`extractParamsFromDOM: 找到 ${paramsList.length} 个分类，共 ${paramsList.reduce((sum, p) => sum + p.params.length, 0)} 个参数`);
    return paramsList;
}

/**
 * 从当前 DOM 中提取计算结果数据
 */
function extractResultsFromDOM() {
    const resultsList = [];
    
    // 1. 提取主结果（结果头部）
    const resultHeader = document.querySelector('#resultSection .chart-container');
    if (resultHeader) {
        const resultValue = resultHeader.querySelector('.result-value');
        if (resultValue) {
            const mainText = cleanText(resultValue.innerText);
            if (mainText && !mainText.includes('计算结果将显示')) {
                resultsList.push({
                    category: '★ 主结果',
                    items: [{ key: '计算结果', value: mainText }]
                });
            }
        }
    }
    
    // 2. 查找所有结果卡片（排除参数摘要容器）
    const allCards = document.querySelectorAll('#resultSection .bg-ocean-50.rounded-lg.p-4');
    
    for (const card of allCards) {
        // 跳过参数摘要容器
        if (card.classList.contains('parameter-summary-container')) {
            continue;
        }
        
        const cardTitle = card.querySelector('h3');
        if (cardTitle && (cardTitle.innerText.includes('参数摘要') || cardTitle.innerText.includes('输入参数'))) {
            continue;
        }
        
        let category = '计算结果';
        if (cardTitle) {
            const cleanTitle = cardTitle.innerText.replace(/[📊🔧🏗️📐🌍⚙️🏜️🏖️📈📍⚖️]/g, '').trim();
            if (cleanTitle && !cleanTitle.includes('参数')) {
                category = cleanTitle;
            }
        }
        
        const items = [];
        
        // 提取 flex justify-between 布局
        const flexRows = card.querySelectorAll('.flex.justify-between');
        for (const row of flexRows) {
            const spans = row.querySelectorAll('span');
            if (spans.length >= 2) {
                let key = cleanText(spans[0].innerText);
                let value = cleanText(spans[1].innerText);
                key = key.replace(/[：:]/g, '');
                if (key && value && !key.includes('注')) {
                    items.push({ key, value });
                }
            }
        }
        
        // 提取 grid-cols-2 布局
        const gridContainers = card.querySelectorAll('.grid-cols-2');
        for (const grid of gridContainers) {
            const rows = grid.querySelectorAll(':scope > div');
            for (const row of rows) {
                const text = cleanText(row.innerText);
                const colonIndex = text.indexOf(':');
                if (colonIndex > 0) {
                    let key = text.substring(0, colonIndex).trim();
                    let value = text.substring(colonIndex + 1).trim();
                    if (key && value && !key.includes('注')) {
                        items.push({ key, value });
                    }
                }
            }
        }
        
        if (items.length > 0) {
            resultsList.push({ category, items });
        }
    }
    
    // 3. 额外查找土体特定卡片
    const soilCards = document.querySelectorAll('#resultSection .bg-ocean-50.p-3.rounded');
    for (const card of soilCards) {
        const cardTitle = card.querySelector('.font-semibold');
        let category = '计算结果';
        if (cardTitle) {
            category = cleanText(cardTitle.innerText);
        }
        
        const items = [];
        const gridContainers = card.querySelectorAll('.grid-cols-2');
        for (const grid of gridContainers) {
            const rows = grid.querySelectorAll(':scope > div');
            for (const row of rows) {
                const text = cleanText(row.innerText);
                const colonIndex = text.indexOf(':');
                if (colonIndex > 0) {
                    let key = text.substring(0, colonIndex).trim();
                    let value = text.substring(colonIndex + 1).trim();
                    if (key && value && !key.includes('注')) {
                        items.push({ key, value });
                    }
                }
            }
        }
        
        if (items.length > 0) {
            resultsList.push({ category, items });
        }
    }
    
    console.log(`extractResultsFromDOM: 找到 ${resultsList.length} 个结果分类`);
    return resultsList;
}

/**
 * 构建导出内容
 */
function buildExportContent() {
    const moduleName = getCurrentModuleName();
    const timestamp = new Date().toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    
    const separator = '='.repeat(60);
    const thinSeparator = '-'.repeat(60);
    
    let content = `${separator}\n`;
    content += `${moduleName} - 计算结果导出\n`;
    content += `导出时间: ${timestamp}\n`;
    content += `${separator}\n\n`;
    
    // 输入参数
    const paramsList = extractParamsFromDOM();
    if (paramsList.length > 0 && paramsList.some(p => p.params.length > 0)) {
        content += `【输入参数】\n`;
        content += `${thinSeparator}\n`;
        for (const group of paramsList) {
            content += `\n📁 ${group.category}\n`;
            for (const param of group.params) {
                content += `  ${param.key}: ${param.value}\n`;
            }
        }
        content += `\n`;
    } else {
        content += `【输入参数】\n${thinSeparator}\n  （当前无参数摘要数据）\n\n`;
    }
    
    // 计算结果
    const resultsList = extractResultsFromDOM();
    if (resultsList.length > 0 && resultsList.some(r => r.items.length > 0)) {
        content += `【计算结果】\n`;
        content += `${thinSeparator}\n`;
        for (const group of resultsList) {
            content += `\n📁 ${group.category}\n`;
            for (const item of group.items) {
                content += `  ${item.key}: ${item.value}\n`;
            }
        }
        content += `\n`;
    } else {
        content += `【计算结果】\n${thinSeparator}\n  （当前无计算结果数据）\n\n`;
    }
    
    content += `${separator}\n`;
    content += `导出工具: 海上风电基础分析软件\n`;
    content += `版权属华南理工大学海洋科学与工程学院\n`;
    content += `${separator}`;
    
    return content;
}

/**
 * 检查是否有可导出的结果数据
 */
function hasExportableResults() {
    const paramsList = extractParamsFromDOM();
    const resultsList = extractResultsFromDOM();
    
    const hasParams = paramsList.length > 0 && paramsList.some(p => p.params.length > 0);
    const hasResults = resultsList.length > 0 && resultsList.some(r => r.items.length > 0);
    
    return hasParams || hasResults;
}

/**
 * 检查是否有可导出的图表
 */
function hasExportableChart() {
    const canvasSelectors = [
        'canvas[id$="-chart"]',
        '#gravity-chart', '#torpedo-vertical-chart', '#torpedo-horizontal-chart',
        '#plate-chart', '#pile-chart', '#drag-chart', '#suction-chart',
        '#resultSection canvas', '.result-content canvas'
    ];
    
    for (const selector of canvasSelectors) {
        const canvas = document.querySelector(selector);
        if (canvas && isElementVisible(canvas) && canvas.width > 0 && canvas.height > 0) {
            return true;
        }
    }
    return false;
}

/**
 * 获取当前可见的图表 canvas 元素
 */
function getCurrentChartCanvas() {
    const canvasIds = [
        'gravity-chart', 'torpedo-vertical-chart', 'torpedo-horizontal-chart',
        'plate-chart', 'pile-chart', 'drag-chart', 'suction-chart'
    ];
    
    for (const id of canvasIds) {
        const canvas = document.getElementById(id);
        if (canvas && isElementVisible(canvas) && canvas.width > 0 && canvas.height > 0) {
            return canvas;
        }
    }
    
    return document.querySelector('#resultSection canvas, .result-content canvas');
}

// ========== 导出功能 ==========

/**
 * 导出数据为文件
 */
async function exportDataToTXT() {
    if (!hasExportableResults()) {
        alert('⚠️ 当前未识别到可导出的内容\n\n请先完成计算并确保输出区显示有参数摘要和计算结果');
        return;
    }
    
    const content = buildExportContent();
    const filename = `${getCurrentModuleName()}_计算结果_${getTimestamp()}.txt`;
    
    const success = await saveTextFile(content, filename);
    if (success) {
        console.log('✅ 数据导出成功:', filename);
    } else {
        alert('导出失败，请重试或检查权限设置');
    }
}

/**
 * 导出图表为图片
 */
async function exportChartAsImage() {
    if (!hasExportableChart()) {
        alert('⚠️ 当前未识别到可导出的图表\n\n请先完成计算并确保图表已正确渲染');
        return;
    }
    
    const canvas = getCurrentChartCanvas();
    if (!canvas) {
        alert('未找到图表元素');
        return;
    }
    
    const imageDataUrl = canvas.toDataURL('image/png');
    const filename = `${getCurrentModuleName()}_图表_${getTimestamp()}.png`;
    
    const success = await saveImageFile(imageDataUrl, filename);
    if (success) {
        console.log('✅ 图表导出成功:', filename);
    } else {
        alert('导出失败，请重试或检查权限设置');
    }
}

// ========== 按钮管理 ==========

/**
 * 在输出区添加导出按钮
 */
function addExportButtons() {
    if (document.querySelector('.export-btn-group')) {
        console.log('addExportButtons: 按钮已存在，跳过');
        return;
    }
    
    console.log('addExportButtons: 开始添加按钮');
    
    // 查找计算结果标题
    let titleElement = null;
    const resultSection = document.getElementById('resultSection');
    
    if (resultSection && resultSection.parentElement) {
        titleElement = resultSection.parentElement.querySelector('h2.flex.items-center');
        if (!titleElement) {
            titleElement = resultSection.parentElement.querySelector('h2');
        }
    }
    
    if (!titleElement) {
        const allH2 = document.querySelectorAll('h2');
        for (const h2 of allH2) {
            if (h2.innerText.includes('计算结果')) {
                titleElement = h2;
                break;
            }
        }
    }
    
    if (!titleElement) {
        console.warn('addExportButtons: 未找到计算结果标题');
        return;
    }
    
    // 创建 flex 包装器
    let titleContainer = titleElement;
    const parent = titleElement.parentElement;
    
    if (parent && parent.classList.contains('flex') && 
        (parent.classList.contains('justify-between') || parent.style.justifyContent === 'space-between')) {
        titleContainer = parent;
    } else if (parent && parent.classList.contains('flex') && parent.classList.contains('items-center')) {
        titleContainer = parent;
    } else {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-center justify-between mb-4 w-full';
        titleElement.parentNode.insertBefore(wrapper, titleElement);
        wrapper.appendChild(titleElement);
        titleContainer = wrapper;
    }
    
    // 创建按钮组
    const btnGroup = document.createElement('div');
    btnGroup.className = 'export-btn-group flex items-center space-x-2';
    btnGroup.innerHTML = `
        <button id="export-data-btn" class="text-xs bg-ocean-500 hover:bg-ocean-600 text-white px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm flex items-center space-x-1" title="导出本次计算的参数和结果为TXT文件">
            <i class="fas fa-download text-xs"></i>
            <span>导出数据</span>
        </button>
        <button id="export-chart-btn" class="text-xs bg-ocean-500 hover:bg-ocean-600 text-white px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm flex items-center space-x-1" title="导出分析图表为PNG图片">
            <i class="fas fa-image text-xs"></i>
            <span>导出图表</span>
        </button>
    `;
    
    titleContainer.appendChild(btnGroup);
    
    // 绑定事件
    const dataBtn = document.getElementById('export-data-btn');
    const chartBtn = document.getElementById('export-chart-btn');
    
    if (dataBtn) {
        const newDataBtn = dataBtn.cloneNode(true);
        dataBtn.parentNode.replaceChild(newDataBtn, dataBtn);
        newDataBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            await exportDataToTXT();
        });
    }
    
    if (chartBtn) {
        const newChartBtn = chartBtn.cloneNode(true);
        chartBtn.parentNode.replaceChild(newChartBtn, chartBtn);
        newChartBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            await exportChartAsImage();
        });
    }
    
    console.log('addExportButtons: 按钮添加完成');
}

/**
 * 移除导出按钮
 */
function removeExportButtons() {
    const btnGroup = document.querySelector('.export-btn-group');
    if (btnGroup) {
        btnGroup.remove();
        console.log('removeExportButtons: 按钮已移除');
    }
}

// ========== 结果内容容器管理 ==========

function getResultContentContainer() {
    let container = document.getElementById('resultContent');
    if (container) return container;
    
    const resultSection = document.getElementById('resultSection');
    if (!resultSection) return null;
    
    let existingContent = resultSection.querySelector('.result-content');
    if (existingContent) return existingContent;
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'result-content';
    
    const originalContent = resultSection.innerHTML;
    resultSection.innerHTML = '';
    resultSection.appendChild(contentContainer);
    
    if (originalContent.trim()) {
        const placeholderDiv = document.createElement('div');
        placeholderDiv.innerHTML = originalContent;
        contentContainer.appendChild(placeholderDiv);
    }
    
    return contentContainer;
}

// ========== 通用渲染函数 ==========

function renderGenericResult(result, formulaModule, params, validation) {
    const alertHtml = validation ? renderValidationAlert(validation) : '';
    
    let contentHtml = '';
    if (result.value !== undefined) {
        contentHtml = `
            <div class="chart-container rounded-lg p-4 mb-4">
                <h3 class="font-bold text-ocean-800 mb-2">📊 计算结果</h3>
                <div class="text-3xl font-bold text-ocean-700 result-value">${formatNumber(result.value, result.unit)}</div>
                <div class="text-ocean-500 mt-2">${result.text || ''}</div>
            </div>
        `;
    } else {
        contentHtml = '<div class="text-center py-4 text-ocean-400">计算结果将显示在这里</div>';
    }
    
    const paramSummaryHtml = formulaModule.parameters ? renderParameterSummary(formulaModule, params) : '';
    
    return `
        ${alertHtml}
        ${contentHtml}
        ${paramSummaryHtml}
    `;
}

// ========== 主渲染函数 ==========

export function renderResult(result, formulaModule, params, validation = null) {
    if (!formulaModule || !formulaModule.id) {
        console.warn('renderResult: 无效的模块对象');
        return;
    }
    
    const contentContainer = getResultContentContainer();
    if (!contentContainer) {
        console.warn('renderResult: 未找到内容容器');
        return;
    }
    
    const moduleId = formulaModule.id;
    const anchorParentIds = ['gravity', 'torpedo', 'plate', 'pile', 'drag', 'suction'];
    
    let resultHtml = '';
    
    if (typeof formulaModule.render === 'function') {
        resultHtml = formulaModule.render(result, formulaModule, params, validation);
    } else if (anchorParentIds.includes(moduleId)) {
        const anchorModule = getAnchorModule(moduleId);
        if (anchorModule && typeof anchorModule.render === 'function') {
            resultHtml = anchorModule.render(result, formulaModule, params, validation);
        } else {
            resultHtml = renderGenericResult(result, formulaModule, params, validation);
        }
    } else {
        resultHtml = renderGenericResult(result, formulaModule, params, validation);
    }
    
    contentContainer.innerHTML = resultHtml;
    
    // 渲染完成后添加导出按钮
    setTimeout(() => {
        addExportButtons();
    }, 100);
}

// 导出按钮管理函数
export { removeExportButtons, addExportButtons };