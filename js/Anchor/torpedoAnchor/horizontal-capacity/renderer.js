/**
 * @filepath: js/Anchor/torpedoAnchor/horizontal-capacity/renderer.js
 * @description: 鱼雷锚水平承载力专用渲染器
 *              依据ABS Guidance Notes (2017) 规范展示详细计算过程和结果
 */

import { 
    renderResultHeader, 
    renderDetailsCard, 
    renderGroupRow,
    renderParameterSummary,
    renderValidationAlert
} from '../../shared/baseRenderer.js';

/**
 * 渲染鱼雷锚水平承载力计算结果
 * @param {Object} result - 计算结果对象
 * @param {Object} formulaModule - 公式模块对象
 * @param {Object} params - 输入参数对象
 * @param {Object} validation - 校验结果对象
 * @returns {string} 完整的渲染HTML
 */
export function render(result, formulaModule, params, validation = null) {
    const details = result.details || {};
    let contentHtml = '';
    
    // ========== 1. 几何参数展示 ==========
    if (details.anchor_diameter && details.anchor_length) {
        contentHtml += renderGroupRow('📐 几何参数', [
            { key: '锚体直径 D', value: details.anchor_diameter, unit: 'm' },
            { key: '锚体长度 L', value: details.anchor_length, unit: 'm' },
            { key: '水平投影面积 As,h', value: details.projected_area_total, unit: 'm²' }
        ]);
    }
    
    // ========== 2. 翼板信息（如果考虑） ==========
    if (details.include_fins && details.fin_count > 0) {
        contentHtml += renderGroupRow('🛸 翼板参数', [
            { key: '翼板数量', value: details.fin_count, unit: '' },
            { key: '翼板长度', value: details.fin_length, unit: 'm' },
            { key: '翼板宽度', value: details.fin_width, unit: 'm' },
            { key: '翼板投影面积', value: details.projected_area_fins_total, unit: 'm²' }
        ]);
    }
    
    // ========== 3. 土体强度参数展示 ==========
    const soilItems = [];
    if (details.strength_at_top !== undefined) {
        soilItems.push({ key: '锚顶处强度', value: details.strength_at_top, unit: 'kPa' });
    }
    if (details.strength_at_mid !== undefined) {
        soilItems.push({ key: '锚中点处强度', value: details.strength_at_mid, unit: 'kPa' });
    }
    if (details.strength_at_bottom !== undefined) {
        soilItems.push({ key: '锚底处强度', value: details.strength_at_bottom, unit: 'kPa' });
    }
    if (details.strength_averaged !== undefined) {
        soilItems.push({ key: '沿锚身平均强度', value: details.strength_averaged, unit: 'kPa' });
    }
    
    if (soilItems.length > 0) {
        contentHtml += renderGroupRow('🌍 土体强度参数', soilItems);
    }
    
    
    // ========== 4. 总承载力（突出显示） ==========
    // 结果合理性检查
    let resultWarningHtml = '';
    const capacity = result.value;
    
    if (capacity !== undefined && capacity > 0) {
        if (capacity < 100) {
            resultWarningHtml = `
                <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 rounded mb-2 text-sm">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    承载力较小 (${capacity.toFixed(2)} kN)，请确认输入参数是否合理
                </div>
            `;
        } else if (capacity > 50000) {
            resultWarningHtml = `
                <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 rounded mb-2 text-sm">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    承载力较大 (${capacity.toFixed(2)} kN)，超出常规鱼雷锚范围，请确认输入参数
                </div>
            `;
        }
    }
    
    contentHtml += resultWarningHtml;
    
    // ========== 8. 组合完整结果 ==========
    let fullHtml = '';
    
    // 显示校验警告/提示（如果有）
    if (validation && (validation.warnings?.length > 0 || validation.infos?.length > 0)) {
        fullHtml += renderValidationAlert(validation);
    }
    
    // 显示结果中的警告和提示
    if (result.warnings && result.warnings.length > 0) {
        fullHtml += `
            <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded mb-4">
                <div class="font-bold flex items-center">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    计算警告
                </div>
                <ul class="list-disc list-inside text-sm mt-2">
                    ${result.warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (result.infos && result.infos.length > 0) {
        fullHtml += `
            <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-3 rounded mb-4">
                <div class="font-bold flex items-center">
                    <i class="fas fa-info-circle mr-2"></i>
                    计算说明
                </div>
                <ul class="list-disc list-inside text-sm mt-2">
                    ${result.infos.map(i => `<li>${escapeHtml(i)}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    fullHtml += renderResultHeader(result.text || `水平极限承载力: ${result.value?.toFixed(2)} ${result.unit}`);
    fullHtml += renderDetailsCard('📋 详细计算过程', contentHtml);
    fullHtml += renderParameterSummary(formulaModule, params);
    
    return fullHtml;
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