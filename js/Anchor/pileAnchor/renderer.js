/**
 * @filepath: js/Anchor/pileAnchor/renderer.js
 * @description: 桩锚专用渲染器
 */

import { 
    renderResultHeader, 
    renderDetailsCard, 
    renderParameterSummary,
    renderValidationAlert,
    formatNumber
} from '../shared/baseRenderer.js';
import { generateEnvelopeChart, shouldShowChart } from './chart.js';

function formatNumberSmart(value) {
    return formatNumber(value, '');
}

export function render(result, formulaModule, params, validation = null) {
    const details = result.details;
    
    const L = details.L_m;
    const D = details.D_m;
    const e = details.e_m;
    const phi = details.phi_deg;
    const gamma = details.gamma_kN_m3;
    const delta = details.delta_deg;
    const eta = details.eta;
    const xi = details.xi;
    
    const a = details.a_m;
    const n = details.n_exp;
    const iDeg = details.i_deg;
    const Vu = details.Vu_kN;
    const Hu = details.Hu_kN;
    const HuMethod = details.Hu_calc_method;
    
    const theta = details.theta_deg;
    const H = details.H_kN;
    const V = details.V_kN;
    const HRatio = details.H_Hu_ratio;
    const VRatio = details.V_Vu_ratio;
    
    const typicalResults = details.typical_results;
    const aspectRatio = L / D;
    
    let aspectHintHtml = '';
    if (aspectRatio < 2) {
        aspectHintHtml = `
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-2 rounded mb-3 text-sm">
                <i class="fas fa-info-circle mr-1"></i>
                长径比 L/D = ${aspectRatio.toFixed(2)} < 2，桩体偏短，本模型假定为刚性桩，请确认适用性
            </div>
        `;
    } else if (aspectRatio > 10) {
        aspectHintHtml = `
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-2 rounded mb-3 text-sm">
                <i class="fas fa-info-circle mr-1"></i>
                长径比 L/D = ${aspectRatio.toFixed(2)} > 10，桩体偏长，可能产生弹性变形，本模型假定刚性桩
            </div>
        `;
    }
    
    // 构建典型角度表格
    let typicalTableHtml = `
        <table class="min-w-full text-xs">
            <thead class="bg-gray-100">
                <tr>
                    <th class="px-2 py-1 text-left">θ (°)</th>
                    <th class="px-2 py-1 text-left">H (kN)</th>
                    <th class="px-2 py-1 text-left">V (kN)</th>
                    <th class="px-2 py-1 text-left">H/H<sub>u</sub></th>
                    <th class="px-2 py-1 text-left">V/V<sub>u</sub></th>
                    <th class="px-2 py-1 text-left">i (°)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const angles = [0, 22.5, 45, 67.5, 90];
    for (const ang of angles) {
        const res = typicalResults[`theta_${ang}`];
        if (res) {
            typicalTableHtml += `
                <tr class="border-b border-gray-100">
                    <td class="px-2 py-1 font-mono">${ang}</td>
                    <td class="px-2 py-1">${formatNumberSmart(res.H)}</td>
                    <td class="px-2 py-1">${formatNumberSmart(res.V)}</td>
                    <td class="px-2 py-1">${formatNumberSmart(res.H_ratio)}</td>
                    <td class="px-2 py-1">${formatNumberSmart(res.V_ratio)}</td>
                    <td class="px-2 py-1">${formatNumberSmart(res.i)}</td>
                </tr>
            `;
        }
    }
    typicalTableHtml += `</tbody></table>`;
    
    let contentHtml = `
        <div class="space-y-3">
            ${aspectHintHtml}
            
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">📋 输入参数</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">桩长 L:</span> ${formatNumberSmart(L)} m</div>
                    <div><span class="text-ocean-600">桩径 D:</span> ${formatNumberSmart(D)} m</div>
                    <div><span class="text-ocean-600">长径比 L/D:</span> ${formatNumberSmart(aspectRatio)}</div>
                    <div><span class="text-ocean-600">偏心距 e:</span> ${formatNumberSmart(e)} m</div>
                    <div><span class="text-ocean-600">摩擦角 φ:</span> ${formatNumberSmart(phi)}°</div>
                    <div><span class="text-ocean-600">有效重度 γ':</span> ${formatNumberSmart(gamma)} kN/m³</div>
                    <div><span class="text-ocean-600">界面摩擦角 δ:</span> ${formatNumberSmart(delta)}°</div>
                    <div><span class="text-ocean-600">形状系数 η:</span> ${formatNumberSmart(eta)}</div>
                    <div><span class="text-ocean-600">形状系数 ξ:</span> ${formatNumberSmart(xi)}</div>
                    <div><span class="text-ocean-600">加载角 θ:</span> ${formatNumberSmart(theta)}°</div>
                </div>
            </div>
            
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">🔧 中间参数</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">旋转点深度 a:</span> ${formatNumberSmart(a)} m</div>
                    <div><span class="text-ocean-600">a/L 比值:</span> ${formatNumberSmart(a / L)}</div>
                    <div><span class="text-ocean-600">包络面指数 n:</span> ${formatNumberSmart(n)}</div>
                    <div><span class="text-ocean-600">归一化加载角 i:</span> ${formatNumberSmart(iDeg)}°</div>
                </div>
            </div>
            
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">📊 极限承载力</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">竖向承载力 V<sub>u</sub>:</span> <span class="font-bold text-ocean-700">${formatNumberSmart(Vu)} kN</span></div>
                    <div><span class="text-ocean-600">水平承载力 H<sub>u</sub>:</span> <span class="font-bold text-ocean-700">${formatNumberSmart(Hu)} kN</span></div>
                    <div><span class="text-ocean-600">Hu 计算方法:</span> ${HuMethod}</div>
                    <div><span class="text-ocean-600">Hu/Vu 比值:</span> ${formatNumberSmart(Hu / Vu)}</div>
                </div>
            </div>
            
            <div class="bg-ocean-100 p-3 rounded border-l-4 border-ocean-500">
                <div class="font-semibold text-ocean-800 mb-2">🎯 当前加载角 θ = ${formatNumberSmart(theta)}° 计算结果</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">水平分量 H:</span> <span class="font-bold text-ocean-700">${formatNumberSmart(H)} kN</span></div>
                    <div><span class="text-ocean-600">竖向分量 V:</span> <span class="font-bold text-ocean-700">${formatNumberSmart(V)} kN</span></div>
                    <div><span class="text-ocean-600">H/H<sub>u</sub>:</span> ${formatNumberSmart(HRatio)}</div>
                    <div><span class="text-ocean-600">V/V<sub>u</sub>:</span> ${formatNumberSmart(VRatio)}</div>
                </div>
            </div>
            
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">📈 典型加载角承载力对照表</div>
                <div class="overflow-x-auto">
                    ${typicalTableHtml}
                </div>
                <div class="text-xs text-ocean-500 mt-2">注：i 为归一化加载角，i = arctan[(H<sub>u</sub>/V<sub>u</sub>)·tanθ]</div>
            </div>
        </div>
    `;
    
    // ========== 图表容器（占位） ==========
    let chartHtml = '';
    if (shouldShowChart(params, result)) {
        chartHtml = `
            <div class="mt-6 pt-4 border-t border-ocean-200">
                <canvas id="pile-chart" style="max-height: 400px; width: 100%;"></canvas>
            </div>
        `;
    }
    
    let fullHtml = '';
    
    if (validation && (validation.warnings?.length > 0 || validation.infos?.length > 0)) {
        fullHtml += renderValidationAlert(validation);
    }
    
    fullHtml += renderResultHeader(result.text);
    fullHtml += renderDetailsCard('📊 桩锚承载力计算结果', contentHtml);
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
    
    const canvas = document.getElementById('pile-chart');
    if (!canvas) return;
    
    // 销毁已有的 Chart 实例（避免重复渲染）
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    
    // 生成图表配置
    const config = generateEnvelopeChart(params, result, calculateFn);
    if (!config) return;
    
    // 创建新图表
    canvas.chart = new Chart(canvas, config);
}