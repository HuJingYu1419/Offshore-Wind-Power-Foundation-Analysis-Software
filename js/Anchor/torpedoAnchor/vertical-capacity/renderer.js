/**
 * @filepath: js/Anchor/torpedoAnchor/vertical-capacity/renderer.js
 * @description: 鱼雷锚竖向承载力模块专用渲染器，负责鱼雷锚计算结果的详细展示，集成校验警告信息展示
 */

import { 
    renderResultHeader, 
    renderDetailsCard, 
    renderGroupRow,
    renderParameterSummary 
} from '../shared/baseRenderer.js';
import { renderValidationAlert } from '../shared/baseRenderer.js';

/**
 * 渲染鱼雷锚计算结果
 * @param {Object} result - 计算结果对象
 * @param {Object} formulaModule - 公式模块对象
 * @param {Object} params - 输入参数对象
 * @param {Object} validation - 校验结果对象（可选，包含 warnings 和 infos）
 * @returns {string} 完整的渲染HTML
 */
export function render(result, formulaModule, params, validation = null) {
    const details = result.details;
    let contentHtml = '';
    
    // ========== 1. 埋深信息 ==========
    if (details.embedment_tip && details.embedment_top) {
        contentHtml += renderGroupRow('📍 埋深信息', [
            { key: '锚尖深度', value: details.embedment_tip, unit: 'm' },
            { key: '锚顶深度', value: details.embedment_top, unit: 'm' }
        ]);
    }
    
    // ========== 2. 浮重分量 ==========
    if (details.Ws !== undefined) {
        contentHtml += renderGroupRow('⚖️ 浮重分量', [
            { key: '锚体浮重 (Ws)', value: details.Ws, unit: 'kN' }
        ]);
    }
    
    // ========== 3. 端阻力分量 ==========
    if (details.Qb_tip !== undefined || details.Qb_eye !== undefined || details.Qb_fin !== undefined) {
        const endBearingItems = [];
        if (details.Qb_tip !== undefined) {
            endBearingItems.push({ key: '锚尖端阻力', value: details.Qb_tip, unit: 'kN' });
        }
        if (details.Qb_eye !== undefined) {
            endBearingItems.push({ key: '锚顶端阻力', value: details.Qb_eye, unit: 'kN' });
        }
        if (details.Qb_fin !== undefined) {
            endBearingItems.push({ key: '锚翼端阻力', value: details.Qb_fin, unit: 'kN' });
        }
        if (details.Qb_total !== undefined) {
            endBearingItems.push({ key: '端阻力合计 (Qb)', value: details.Qb_total, unit: 'kN', bold: true });
        }
        
        contentHtml += renderGroupRow('🏗️ 端阻力分量', endBearingItems);
    }
    
    // ========== 4. 侧摩阻力分量 ==========
    if (details.Qf_fin !== undefined || details.Qf_top !== undefined || details.Qf_mid !== undefined) {
        const frictionItems = [];
        if (details.Qf_fin !== undefined) {
            frictionItems.push({ key: '锚翼段摩阻力', value: details.Qf_fin, unit: 'kN' });
        }
        if (details.Qf_top !== undefined) {
            frictionItems.push({ key: '锚顶-锚翼段', value: details.Qf_top, unit: 'kN' });
        }
        if (details.Qf_mid !== undefined) {
            frictionItems.push({ key: '锚翼-圆锥段', value: details.Qf_mid, unit: 'kN' });
        }
        if (details.Qf_total !== undefined) {
            frictionItems.push({ key: '侧摩阻力合计 (Qf)', value: details.Qf_total, unit: 'kN', bold: true });
        }
        
        contentHtml += renderGroupRow('📐 侧摩阻力分量', frictionItems);
    }
    
    // ========== 5. 土体强度信息 ==========
    if (details.Su_tip !== undefined || details.Su_top !== undefined || details.Su_fin_avg !== undefined) {
        const soilItems = [];
        if (details.Su_tip !== undefined) {
            soilItems.push({ key: '锚尖处强度', value: details.Su_tip, unit: 'kPa' });
        }
        if (details.Su_top !== undefined) {
            soilItems.push({ key: '锚顶处强度', value: details.Su_top, unit: 'kPa' });
        }
        if (details.Su_fin_avg !== undefined) {
            soilItems.push({ key: '锚翼平均强度', value: details.Su_fin_avg, unit: 'kPa' });
        }
        
        contentHtml += renderGroupRow('🌍 土体强度', soilItems);
    }
    
    // ========== 6. 计算模式 ==========
    if (details.calc_mode !== undefined) {
        contentHtml += renderGroupRow('⚙️ 计算模式', [
            { key: '当前模式', value: details.calc_mode, unit: '' }
        ]);
    }
    
    // ========== 7. 分项占比分析（可选，帮助用户理解主导因素） ==========
    if (details.total && parseFloat(details.total) > 0) {
        const total = parseFloat(details.total);
        const ws = details.Ws ? parseFloat(details.Ws) : 0;
        const qb = details.Qb_total ? parseFloat(details.Qb_total) : 0;
        const qf = details.Qf_total ? parseFloat(details.Qf_total) : 0;
        
        const wsPct = (ws / total * 100).toFixed(1);
        const qbPct = (qb / total * 100).toFixed(1);
        const qfPct = (qf / total * 100).toFixed(1);
        
        // 主导因素提示
        let dominantHint = '';
        if (qbPct > 60) {
            dominantHint = '<span class="text-xs text-blue-600 ml-2">⚠️ 端阻力占主导</span>';
        } else if (qfPct > 60) {
            dominantHint = '<span class="text-xs text-green-600 ml-2">⚠️ 侧摩阻力占主导</span>';
        } else if (wsPct > 40) {
            dominantHint = '<span class="text-xs text-orange-600 ml-2">⚠️ 浮重占比较高，请确认锚体尺寸合理性</span>';
        }
        
        contentHtml += `
            <div class="bg-ocean-50 p-3 rounded mt-2">
                <div class="font-semibold text-ocean-700 text-sm mb-2">📊 分项占比分析</div>
                <div class="space-y-1 text-sm">
                    <div class="flex justify-between">
                        <span>浮重占比:</span>
                        <span class="font-mono">${wsPct}%</span>
                    </div>
                    <div class="flex justify-between">
                        <span>端阻力占比:</span>
                        <span class="font-mono">${qbPct}%</span>
                    </div>
                    <div class="flex justify-between">
                        <span>侧摩阻力占比:</span>
                        <span class="font-mono">${qfPct}%</span>
                        ${dominantHint}
                    </div>
                </div>
            </div>
        `;
    }
    
    // ========== 8. 总承载力（突出显示） ==========
    // 结果合理性检查
    let resultWarningHtml = '';
    if (details.total && parseFloat(details.total) > 0) {
        const totalValue = parseFloat(details.total);
        if (totalValue < 100) {
            resultWarningHtml = `
                <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 rounded mb-2 text-sm">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    承载力较小 (${totalValue.toFixed(2)} kN)，请确认锚体尺寸和土体参数是否合理
                </div>
            `;
        } else if (totalValue > 50000) {
            resultWarningHtml = `
                <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 rounded mb-2 text-sm">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    承载力较大 (${totalValue.toFixed(2)} kN)，超出常规鱼雷锚范围，请确认输入参数
                </div>
            `;
        }
    }
    
    contentHtml += resultWarningHtml;
    
    contentHtml += `
        <div class="bg-ocean-200 p-3 rounded mt-2">
            <div class="flex justify-between items-center">
                <span class="font-bold text-ocean-800 text-base">📈 总极限承载力:</span>
                <span class="font-mono font-bold text-ocean-700 text-xl">${details.total} ${result.unit}</span>
            </div>
        </div>
    `;
    
    // ========== 9. 组合完整结果 ==========
    let fullHtml = '';
    
    // 优先显示校验警告/提示（如果有）
    if (validation && (validation.warnings?.length > 0 || validation.infos?.length > 0)) {
        fullHtml += renderValidationAlert(validation);
    }
    
    fullHtml += renderResultHeader(result.text);
    fullHtml += renderDetailsCard('📋 分项计算结果', contentHtml);
    fullHtml += renderParameterSummary(formulaModule, params);
    
    return fullHtml;
}