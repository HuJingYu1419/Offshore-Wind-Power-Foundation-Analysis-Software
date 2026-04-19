/**
 * @filepath: js/Anchor/shared/baseRenderer.js
 * @description: 锚固件通用渲染函数
 */

/**
 * 格式化数字，保留最多4位小数，去除尾随零
 * @param {number} value - 要格式化的数字
 * @param {string} unit - 单位（可选）
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(value, unit = '') {
    if (value === undefined || value === null) return '—';
    if (typeof value !== 'number') return String(value);
    if (!isFinite(value)) return value > 0 ? '∞' : '-∞';
    if (Math.abs(value) < 0.00005) return '0';
    
    let formatted;
    
    // 大数字：千位分隔符，不保留小数
    if (Math.abs(value) >= 1000) {
        formatted = Math.round(value).toLocaleString();
    } 
    // 中等数字：保留2位小数，去除尾随零
    else if (Math.abs(value) >= 10) {
        formatted = value.toFixed(2).replace(/\.?0+$/, '');
        // 如果结果恰好是整数，去掉小数部分
        if (formatted.endsWith('.')) formatted = formatted.slice(0, -1);
    } 
    // 小数字：保留3位小数，去除尾随零
    else if (Math.abs(value) >= 1) {
        formatted = value.toFixed(3).replace(/\.?0+$/, '');
        if (formatted.endsWith('.')) formatted = formatted.slice(0, -1);
    } 
    // 微小数字：保留4位小数，去除尾随零
    else {
        formatted = value.toFixed(4).replace(/\.?0+$/, '');
        if (formatted.endsWith('.')) formatted = formatted.slice(0, -1);
    }
    
    // 确保格式化后的数字不是空字符串
    if (formatted === '' || formatted === '-') formatted = '0';
    
    return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * 渲染键值对行
 */
export function renderKeyValueRow(key, value, unit = '') {
    return `
        <div class="flex justify-between">
            <span>${key}:</span>
            <span class="font-mono">${formatNumber(value, unit)}</span>
        </div>
    `;
}

/**
 * 渲染分组行
 */
export function renderGroupRow(title, items) {
    let html = `
        <div class="bg-ocean-100 p-2 rounded mb-2">
            <div class="font-semibold text-ocean-800 mb-1">${title}</div>
    `;
    items.forEach(item => {
        const boldClass = item.bold ? 'font-bold' : '';
        html += `
            <div class="flex justify-between ${boldClass}">
                <span>${item.key}:</span>
                <span class="font-mono">${formatNumber(item.value, item.unit)}</span>
            </div>
        `;
    });
    html += `</div>`;
    return html;
}

/**
 * 渲染结果头部
 */
export function renderResultHeader(text) {
    return `
        <div class="chart-container rounded-lg p-4 mb-4">
            <h3 class="font-bold text-ocean-800 mb-2">📊 计算结果</h3>
            <div class="result-value text-2xl font-bold text-ocean-700">${text}</div>
        </div>
    `;
}

/**
 * 渲染详情卡片
 */
export function renderDetailsCard(title, contentHtml) {
    return `
        <div class="bg-ocean-50 rounded-lg p-4 mb-4">
            <h3 class="font-bold text-ocean-800 mb-2">${title}</h3>
            <div class="text-sm text-ocean-700 space-y-2">
                ${contentHtml}
            </div>
        </div>
    `;
}

/**
 * 渲染参数摘要
 */
export function renderParameterSummary(formulaModule, params) {
    if (!formulaModule || !formulaModule.parameters) return '';
    
    const categories = {};
    formulaModule.parameters.forEach(param => {
        if (param.category) {
            if (!categories[param.category]) {
                categories[param.category] = [];
            }
            categories[param.category].push(param);
        }
    });
    
    const categoryNames = {
        geometry: '📐 几何参数',
        material: '🔧 材料参数',
        environment: '💧 环境参数',
        soil: '🌍 土体参数',
        coefficient: '📊 承载力系数',
        mode: '⚙️ 计算模式',
        anchor: '📦 锚体参数',
        load: '⚡ 荷载参数'
    };
    
    let summaryHtml = `
        <div class="bg-ocean-50 rounded-lg p-4">
            <h3 class="font-bold text-ocean-800 mb-2">📝 参数摘要</h3>
            <div class="max-h-64 overflow-y-auto space-y-2">
    `;
    
    for (const [key, paramsList] of Object.entries(categories)) {
        if (paramsList.length > 0) {
            summaryHtml += `
                <div class="bg-white rounded p-2">
                    <div class="font-semibold text-ocean-700 text-sm mb-1">${categoryNames[key] || key}</div>
                    <div class="space-y-1 text-sm">
            `;
            paramsList.forEach(param => {
                let displayValue = params[param.id];
                if (displayValue === undefined || displayValue === null) displayValue = '—';
                summaryHtml += `
                    <div class="flex justify-between">
                        <span class="text-ocean-600">${param.name}:</span>
                        <span class="font-mono">${displayValue} ${param.unit || ''}</span>
                    </div>
                `;
            });
            summaryHtml += `</div></div>`;
        }
    }
    
    summaryHtml += `</div></div>`;
    return summaryHtml;
}

/**
 * 渲染校验警告
 */
export function renderValidationAlert(validation) {
    if (!validation) return '';
    
    const { errors = [], warnings = [], infos = [] } = validation;
    
    if (errors.length === 0 && warnings.length === 0 && infos.length === 0) {
        return '';
    }
    
    let alertHtml = '<div class="mb-4 space-y-2">';
    
    if (errors.length > 0) {
        alertHtml += `
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded">
                <div class="font-bold flex items-center">
                    <i class="fas fa-times-circle mr-2"></i>
                    <span>输入错误（请修正后重新计算）</span>
                </div>
                <ul class="list-disc list-inside text-sm mt-2 space-y-1">
                    ${errors.map(e => escapeHtml(e)).join('')}
                </ul>
            </div>
        `;
    }
    
    if (warnings.length > 0) {
        alertHtml += `
            <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded">
                <div class="font-bold flex items-center">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    <span>参数提醒</span>
                </div>
                <ul class="list-disc list-inside text-sm mt-2 space-y-1">
                    ${warnings.map(w => escapeHtml(w)).join('')}
                </ul>
            </div>
        `;
    }
    
    if (infos.length > 0) {
        alertHtml += `
            <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-3 rounded">
                <div class="font-bold flex items-center">
                    <i class="fas fa-info-circle mr-2"></i>
                    <span>提示</span>
                </div>
                <ul class="list-disc list-inside text-sm mt-2 space-y-1">
                    ${infos.map(i => escapeHtml(i)).join('')}
                </ul>
            </div>
        `;
    }
    
    alertHtml += '</div>';
    return alertHtml;
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}