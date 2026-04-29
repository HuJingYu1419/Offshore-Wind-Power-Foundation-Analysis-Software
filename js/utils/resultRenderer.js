/**
 * @filepath: js/utils/resultRenderer.js
 * @description: 结果渲染工具主入口
 */

import { getAnchorModule } from '../Anchor/index.js';
import { renderValidationAlert, renderParameterSummary, formatNumber } from '../Anchor/shared/baseRenderer.js';

// resultRenderer.js - 修改 renderResult 函数
export function renderResult(result, formulaModule, params, validation = null) {
    if (!formulaModule || !formulaModule.id) {
        console.warn('renderResult: 无效的模块对象');
        return;
    }
    
    const moduleId = formulaModule.id;
    const anchorParentIds = ['gravity', 'torpedo', 'plate', 'pile', 'drag', 'suction'];
    
    // 方案一：优先检查模块自身是否有 render 方法
    if (typeof formulaModule.render === 'function') {
        const resultHtml = formulaModule.render(result, formulaModule, params, validation);
        const resultSection = document.getElementById('resultSection');
        if (resultSection) resultSection.innerHTML = resultHtml;
        return;
    }
    
    // 兼容旧逻辑：检查是否属于父模块ID
    if (anchorParentIds.includes(moduleId)) {
        const anchorModule = getAnchorModule(moduleId);
        if (anchorModule && typeof anchorModule.render === 'function') {
            const resultHtml = anchorModule.render(result, formulaModule, params, validation);
            const resultSection = document.getElementById('resultSection');
            if (resultSection) resultSection.innerHTML = resultHtml;
            return;
        }
    }
    
    // 通用渲染
    const fallbackHtml = renderGenericResult(result, formulaModule, params, validation);
    const resultSection = document.getElementById('resultSection');
    if (resultSection) resultSection.innerHTML = fallbackHtml;
}

function renderGenericResult(result, formulaModule, params, validation) {
    const alertHtml = validation ? renderValidationAlert(validation) : '';
    
    let contentHtml = '';
    if (result.value !== undefined) {
        contentHtml = `
            <div class="text-center py-4">
                <div class="text-3xl font-bold text-ocean-700">${formatNumber(result.value, result.unit)}</div>
                <div class="text-ocean-500 mt-2">${result.text || ''}</div>
            </div>
        `;
    } else {
        contentHtml = '<div class="text-center py-4 text-ocean-400">计算结果将显示在这里</div>';
    }
    
    const paramSummaryHtml = formulaModule.parameters ? renderParameterSummary(formulaModule, params) : '';
    
    return `
        ${alertHtml}
        <div class="chart-container rounded-lg p-4 mb-4">
            <h3 class="font-bold text-ocean-800 mb-2">📊 计算结果</h3>
            ${contentHtml}
        </div>
        ${paramSummaryHtml}
    `;
}