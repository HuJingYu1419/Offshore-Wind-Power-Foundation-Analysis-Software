/**
 * @filepath: js/Anchor/plateAnchor/renderer.js
 * @description: 板锚专用渲染器
 */

import { 
    renderResultHeader, 
    renderDetailsCard, 
    renderParameterSummary,
    renderValidationAlert,
    formatNumber
} from '../shared/baseRenderer.js';
import { generateChartConfig, shouldShowChart } from './chart.js';

function formatNumberSmart(value) {
    return formatNumber(value, '');
}

export function render(result, formulaModule, params, validation = null) {
    const details = result.details;
    
    const shape = details.shape || '—';
    const anchorType = details.anchor_type || '—';
    const width = details.width_m;
    const length = details.length_m;
    const embedmentDepth = details.embedment_depth_m;
    const embedmentRatio = details.embedment_ratio;
    const su = details.undrained_strength_kPa;
    const gamma = details.unit_weight_kN_m3;
    const reductionFactor = details.reduction_factor_used;
    
    const shapeFactor = details.shape_factor_S;
    const nC0 = details.N_c0;
    const overburdenTerm = details.overburden_term;
    const nCCalc = nC0 + overburdenTerm;
    const ncStar = details.N_c_star;
    const nCFinal = details.N_c_final;
    
    const quReduced = details.qu_reduced_kPa;
    const quUnreduced = details.qu_unreduced_kPa;
    const QuReduced = details.Qu_reduced_kN;
    const QuUnreduced = details.Qu_unreduced_kN;
    const area = details.area_m2;
    
    const warning = details.warning;
    
    // 构建锚板几何信息
    let geometryStr = '';
    if (shape === '矩形锚') {
        geometryStr = `${formatNumberSmart(width)} m (B) × ${formatNumberSmart(length)} m (L)`;
    } else if (shape === '方形锚') {
        geometryStr = `${formatNumberSmart(width)} m × ${formatNumberSmart(width)} m`;
    } else {
        geometryStr = `直径 ${formatNumberSmart(width)} m`;
    }
    
    let contentHtml = '';
    
    // 计算警告
    if (warning) {
        contentHtml += `
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded mb-3">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                    <span class="text-yellow-700 text-sm">${warning}</span>
                </div>
            </div>
        `;
    }
    
    contentHtml += `
        <div class="space-y-3">
            <!-- 输入参数摘要 -->
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">📋 输入参数</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">锚板形状:</span> ${shape}</div>
                    <div><span class="text-ocean-600">锚板尺寸:</span> ${geometryStr}</div>
                    <div><span class="text-ocean-600">锚板面积 A:</span> ${formatNumberSmart(area)} m²</div>
                    <div><span class="text-ocean-600">埋深 H:</span> ${formatNumberSmart(embedmentDepth)} m</div>
                    <div><span class="text-ocean-600">埋深比 H/B (H/D):</span> ${formatNumberSmart(embedmentRatio)}</div>
                    <div><span class="text-ocean-600">s<sub>u</sub>:</span> ${formatNumberSmart(su)} kPa</div>
                    <div><span class="text-ocean-600">γ':</span> ${formatNumberSmart(gamma)} kN/m³</div>
                    <div><span class="text-ocean-600">折减系数 η:</span> ${formatNumberSmart(reductionFactor)}</div>
                </div>
            </div>
            
            <!-- 中间计算结果 -->
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">🔧 中间计算结果</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">形状因子 S:</span> ${formatNumberSmart(shapeFactor)}</div>
                    <div><span class="text-ocean-600">N<sub>c0</sub>:</span> ${formatNumberSmart(nC0)}</div>
                    <div><span class="text-ocean-600">γH/s<sub>u</sub>:</span> ${formatNumberSmart(overburdenTerm)}</div>
                    <div><span class="text-ocean-600">计算 N<sub>c</sub>:</span> ${formatNumberSmart(nCCalc)}</div>
                    <div><span class="text-ocean-600">深锚极限 N<sub>c</sub><sup>*</sup>:</span> ${formatNumberSmart(ncStar)}</div>
                    <div><span class="text-ocean-600">最终 N<sub>c</sub>:</span> ${formatNumberSmart(nCFinal)}</div>
                    <div><span class="text-ocean-600">锚板类型:</span> ${anchorType}</div>
                </div>
            </div>
            
            <!-- 承载力计算结果 -->
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">⚡ 承载力计算结果</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">未折减承载力 q<sub>u</sub>:</span></div>
                    <div class="font-mono">${formatNumberSmart(quUnreduced)} kPa</div>
                    <div><span class="text-ocean-600">未折减抗拔力 Q<sub>u</sub>:</span></div>
                    <div class="font-mono">${formatNumberSmart(QuUnreduced)} kN</div>
                    <div class="border-t border-ocean-200 pt-1"><span class="text-ocean-600 font-semibold">折减后承载力 q<sub>u</sub>:</span></div>
                    <div class="border-t border-ocean-200 pt-1 font-mono font-bold text-ocean-700">${formatNumberSmart(quReduced)} kPa</div>
                    <div><span class="text-ocean-600 font-semibold">折减后抗拔力 Q<sub>u</sub>:</span></div>
                    <div class="font-mono font-bold text-ocean-700">${formatNumberSmart(QuReduced)} kN</div>
                </div>
            </div>
        </div>
    `;
    
    // ========== 图表容器（占位） ==========
    let chartHtml = '';
    if (shouldShowChart(params, result)) {
        chartHtml = `
            <div class="mt-6 pt-4 border-t border-ocean-200">
                <canvas id="plate-chart" style="max-height: 400px; width: 100%;"></canvas>
            </div>
            <p class="text-xs text-gray-500 mt-1">提示：当埋深比足够大时，深锚的承载力系数确实会趋近于一个渐近值（约为11.9~12.56）</p>
            <p class="text-xs text-gray-500 mt-1">软件中将该渐近过程简化为一个临界的常数表示</p>
        `;
        
    }
    
    // 组装完整结果
    let fullHtml = '';
    
    if (validation && (validation.warnings?.length > 0 || validation.infos?.length > 0)) {
        fullHtml += renderValidationAlert(validation);
    }
    
    fullHtml += renderResultHeader(result.text);
    fullHtml += renderDetailsCard('📊 计算结果详情', contentHtml);
    fullHtml += renderParameterSummary(formulaModule, params);
    fullHtml += chartHtml;  // 图表放在参数摘要之后
    
    return fullHtml;
}

/**
 * 渲染图表（在 DOM 更新后调用）
 * @param {Object} params - 输入参数
 * @param {Object} result - 计算结果
 * @param {Function} calculateFn - 计算函数引用
 */
export function renderChart(params, result, calculateFn) {
    if (!shouldShowChart(params, result)) return;
    
    const canvas = document.getElementById('plate-chart');
    if (!canvas) return;
    
    // 销毁已有的 Chart 实例（避免重复渲染）
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    
    // 生成图表配置
    const config = generateChartConfig(params, result, calculateFn);
    
    // 创建新图表
    canvas.chart = new Chart(canvas, config);
}