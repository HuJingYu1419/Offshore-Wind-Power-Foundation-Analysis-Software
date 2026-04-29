/**
 * @filepath: js/Anchor/torpedoAnchor/penetration/renderer.js
 * @description: 鱼雷锚安装贯入深度渲染（占位）
 */

import { renderResultHeader, renderDetailsCard, renderParameterSummary } from '../../shared/baseRenderer.js';
import { renderValidationAlert } from '../../shared/baseRenderer.js';

export function render(result, formulaModule, params, validation = null) {
    const details = result.details;
    
    let fullHtml = '';
    
    if (validation && (validation.warnings?.length > 0 || validation.infos?.length > 0)) {
        fullHtml += renderValidationAlert(validation);
    }
    
    fullHtml += renderResultHeader(result.text);
    
    const detailsHtml = `
        <div class="bg-ocean-100 p-3 rounded mb-2">
            <div class="font-semibold text-ocean-700 mb-2">📊 计算结果</div>
            <div class="flex justify-between items-center mb-3">
                <span>预测贯入深度:</span>
                <span class="font-mono font-bold text-ocean-700 text-xl">${result.value.toFixed(2)} ${result.unit}</span>
            </div>
            <div class="border-t border-ocean-200 pt-2 mt-2">
                <div class="flex justify-between text-sm">
                    <span>触底动能:</span>
                    <span class="font-mono">${details.kinetic_energy} kJ</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span>平均贯入阻力:</span>
                    <span class="font-mono">${details.avg_resistance} kN</span>
                </div>
            </div>
        </div>
        <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 rounded text-sm">
            <i class="fas fa-code-branch mr-1"></i>
            该模块正在开发中，当前为占位计算，请替换为实际算法（如True或基于CPT的方法）
        </div>
    `;
    
    fullHtml += renderDetailsCard('📋 计算结果详情', detailsHtml);
    fullHtml += renderParameterSummary(formulaModule, params);
    
    return fullHtml;
}