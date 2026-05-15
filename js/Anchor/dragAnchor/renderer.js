/**
 * @filepath: js/Anchor/dragAnchor/renderer.js
 * @description: 拖曳锚专用渲染器
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
    if (value === undefined || value === null) return '—';
    if (typeof value !== 'number') return String(value);
    if (!isFinite(value)) return value > 0 ? '∞' : '-∞';
    if (Math.abs(value) < 0.00005) return '0';
    if (Math.abs(value) >= 1000) return Math.round(value).toLocaleString();
    if (Math.abs(value) >= 10) return value.toFixed(2).replace(/\.?0+$/, '');
    if (Math.abs(value) >= 1) return value.toFixed(3).replace(/\.?0+$/, '');
    return value.toFixed(4).replace(/\.?0+$/, '');
}

export function render(result, formulaModule, params, validation = null) {
    const details = result.details;
    
    const zUedM = details.z_ued_m !== undefined ? formatNumberSmart(details.z_ued_m) : '—';
    const zUedMm = details.z_ued_mm !== undefined ? formatNumberSmart(details.z_ued_mm) : '—';
    const zUedRatio = details.z_ued_ratio !== undefined ? formatNumberSmart(details.z_ued_ratio) : '—';
    
    // 获取锚板尺寸用于深度比值判断
    const anchorLength = details.anchor_length_m;
    
    let depthHintHtml = '';
    if (details.z_ued_m && anchorLength) {
        const depthRatio = details.z_ued_m / anchorLength;
        if (depthRatio < 5) {
            depthHintHtml = `
                <div class="bg-yellow-50 border-l-4 border-yellow-500 p-2 rounded mb-3 text-sm">
                    <i class="fas fa-info-circle mr-1"></i>
                    嵌入深度与锚板长度比值为 ${formatNumberSmart(depthRatio)}，小于典型范围 (5-15)
                </div>
            `;
        } else if (depthRatio > 20) {
            depthHintHtml = `
                <div class="bg-yellow-50 border-l-4 border-yellow-500 p-2 rounded mb-3 text-sm">
                    <i class="fas fa-info-circle mr-1"></i>
                    嵌入深度与锚板长度比值为 ${formatNumberSmart(depthRatio)}，大于典型范围 (5-15)
                </div>
            `;
        }
    }
    
    // ========== 核心计算结果卡片 ==========
    let contentHtml = `
        <div class="space-y-3">
            ${depthHintHtml}        
            <!-- 分项计算结果 -->
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">🔧 分项计算结果</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">有效宽度 b:</span> <span class="font-mono">${formatNumberSmart(details.effective_width_b_m)} m</span></div>
                    <div><span class="text-ocean-600">Δz:</span> <span class="font-mono">${formatNumberSmart(details.delta_z_m)} m</span></div>
                    <div><span class="text-ocean-600">m₁:</span> <span class="font-mono">${formatNumberSmart(details.m1)}</span></div>
                    <div><span class="text-ocean-600">m₂:</span> <span class="font-mono">${formatNumberSmart(details.m2)}</span></div>
                    <div><span class="text-ocean-600">T = m₁·A<sub>b</sub> + m₂·A<sub>s</sub>:</span> <span class="font-mono">${formatNumberSmart(details.T)}</span></div>
                    <div><span class="text-ocean-600">t₁ = T/(2b):</span> <span class="font-mono">${formatNumberSmart(details.t1)}</span></div>
                </div>
            </div>
        </div>
    `;
    
    // 根据土体类型显示不同的参数卡片
    if (details.t2 !== undefined) {
        // 饱和粘土参数
        contentHtml += `
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">🏜️ 粘土中间参数</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">t₂ = s<sub>u0</sub>/k:</span> <span class="font-mono">${formatNumberSmart(details.t2)}</span></div>
                    <div><span class="text-ocean-600">sqrt(内项):</span> <span class="font-mono">${formatNumberSmart(details.sqrt_inner)}</span></div>
                    <div><span class="text-ocean-600">sqrt(结果):</span> <span class="font-mono">${formatNumberSmart(details.sqrt_term)}</span></div>
                </div>
            </div>
        `;
    } else if (details.Nq !== undefined) {
        // 饱和砂土参数
        contentHtml += `
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">🏖️ 砂土中间参数</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">N<sub>q</sub>:</span> <span class="font-mono">${formatNumberSmart(details.Nq)}</span></div>
                    <div><span class="text-ocean-600">tanδ:</span> <span class="font-mono">${formatNumberSmart(details.tan_delta)}</span></div>
                    <div><span class="text-ocean-600">sqrt(内项):</span> <span class="font-mono">${formatNumberSmart(details.sqrt_inner)}</span></div>
                    <div><span class="text-ocean-600">sqrt(结果):</span> <span class="font-mono">${formatNumberSmart(details.sqrt_term)}</span></div>
                </div>
            </div>
        `;
    }
    
    contentHtml += `</div>`;
    
    // ========== 图表容器（占位） ==========
    let chartHtml = '';
    if (shouldShowChart(params, result)) {
        chartHtml = `
            <div class="mt-6 pt-4 border-t border-ocean-200">
                <canvas id="drag-chart" style="max-height: 400px; width: 100%;"></canvas>
            </div>
        `;
    }
    
    // ========== 组装完整结果 ==========
    let fullHtml = '';
    
    if (validation && (validation.warnings?.length > 0 || validation.infos?.length > 0)) {
        fullHtml += renderValidationAlert(validation);
    }
    
    fullHtml += renderResultHeader(result.text);
    fullHtml += renderDetailsCard('📊 拖曳锚极限嵌入深度计算结果', contentHtml);
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
    
    const canvas = document.getElementById('drag-chart');
    if (!canvas) return;
    
    // 销毁已有的 Chart 实例（避免重复渲染）
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    
    // 生成图表配置
    const config = generateChartConfig(params, result, calculateFn);
    if (!config) return;
    
    // 创建新图表
    canvas.chart = new Chart(canvas, config);
}