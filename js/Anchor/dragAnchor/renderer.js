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
    
    const soilType = details.soil_type || '—';
    const anchorName = details.anchor_name || '—';
    const cDeg = details.c_deg !== undefined ? formatNumberSmart(details.c_deg) : '—';
    const dMm = details.d_mm !== undefined ? formatNumberSmart(details.d_mm) : '—';
    const chainType = details.chain_type || '—';
    
    const anchorLength = details.anchor_length_m;
    const anchorWidth = details.anchor_width_m;
    const anchorThickness = details.anchor_thickness_mm;
    const ABearing = details.A_bearing_cm2;
    const AShearing = details.A_shearing_cm2;
    const O = details.O_mm;
    
    const effectiveWidth = details.effective_width_b_m;
    const deltaZ = details.delta_z_m;
    const m1 = details.m1;
    const m2 = details.m2;
    const T = details.T;
    const t1 = details.t1;
    
    const zUedM = details.z_ued_m !== undefined ? formatNumberSmart(details.z_ued_m) : '—';
    const zUedMm = details.z_ued_mm !== undefined ? formatNumberSmart(details.z_ued_mm) : '—';
    const zUedRatio = details.z_ued_ratio !== undefined ? formatNumberSmart(details.z_ued_ratio) : '—';
    
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
    
    let contentHtml = `
        <div class="space-y-3">
            ${depthHintHtml}
            
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">📋 输入参数</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">土体类型:</span> ${soilType}</div>
                    <div><span class="text-ocean-600">锚板规格:</span> ${anchorName}</div>
                    <div><span class="text-ocean-600">系缆夹角 c:</span> ${cDeg}°</div>
                    <div><span class="text-ocean-600">拖缆直径:</span> ${dMm} mm</div>
                    <div><span class="text-ocean-600">拖缆类型:</span> ${chainType}</div>
                </div>
            </div>
            
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">📐 锚板几何参数</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">长度 × 宽度:</span> ${formatNumberSmart(anchorLength)} m × ${formatNumberSmart(anchorWidth)} m</div>
                    <div><span class="text-ocean-600">厚度:</span> ${formatNumberSmart(anchorThickness)} mm</div>
                    <div><span class="text-ocean-600">端面积 A<sub>b</sub>:</span> ${formatNumberSmart(ABearing)} cm²</div>
                    <div><span class="text-ocean-600">剪切面积 A<sub>s</sub>:</span> ${formatNumberSmart(AShearing)} cm²</div>
                    <div><span class="text-ocean-600">重心距离 O:</span> ${formatNumberSmart(O)} mm</div>
                </div>
            </div>
            
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">🔧 中间参数</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">有效宽度 b:</span> ${formatNumberSmart(effectiveWidth)} m</div>
                    <div><span class="text-ocean-600">Δz:</span> ${formatNumberSmart(deltaZ)} m</div>
                    <div><span class="text-ocean-600">m₁:</span> ${formatNumberSmart(m1)}</div>
                    <div><span class="text-ocean-600">m₂:</span> ${formatNumberSmart(m2)}</div>
                    <div><span class="text-ocean-600">T = m₁·A<sub>b</sub> + m₂·A<sub>s</sub>:</span> ${formatNumberSmart(T)}</div>
                    <div><span class="text-ocean-600">t₁ = T/(2b):</span> ${formatNumberSmart(t1)}</div>
                </div>
            </div>
    `;
    
    if (details.t2 !== undefined) {
        contentHtml += `
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">🏜️ 粘土参数</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">t₂ = s<sub>u0</sub>/k:</span> ${formatNumberSmart(details.t2)}</div>
                    <div><span class="text-ocean-600">s<sub>u0</sub>:</span> ${formatNumberSmart(details.su0)} kPa</div>
                    <div><span class="text-ocean-600">k:</span> ${formatNumberSmart(details.k)} kPa/m</div>
                    <div><span class="text-ocean-600">α:</span> ${formatNumberSmart(details.alpha)}</div>
                    <div><span class="text-ocean-600">N<sub>c</sub>:</span> ${formatNumberSmart(details.Nc)}</div>
                </div>
            </div>
        `;
    } else {
        contentHtml += `
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">🏖️ 砂土参数</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">N<sub>q</sub>:</span> ${formatNumberSmart(details.Nq)}</div>
                    <div><span class="text-ocean-600">tanδ:</span> ${formatNumberSmart(details.tan_delta)}</div>
                    <div><span class="text-ocean-600">φ:</span> ${formatNumberSmart(details.phi)}°</div>
                    <div><span class="text-ocean-600">K<sub>0</sub>:</span> ${formatNumberSmart(details.K0)}</div>
                    <div><span class="text-ocean-600">γ:</span> ${formatNumberSmart(details.gamma)} kN/m³</div>
                </div>
            </div>
        `;
    }
    
    contentHtml += `
            <div class="bg-ocean-100 p-3 rounded border-l-4 border-ocean-500">
                <div class="font-semibold text-ocean-800 mb-2">📈 极限嵌入深度计算结果</div>
                <div class="grid grid-cols-3 gap-2 text-sm">
                    <div><span class="text-ocean-600">深度 (m):</span> <span class="font-bold text-ocean-700 text-lg">${zUedM}</span> m</div>
                    <div><span class="text-ocean-600">深度 (mm):</span> <span class="font-bold text-ocean-700">${zUedMm}</span> mm</div>
                    <div><span class="text-ocean-600">z/L 比值:</span> <span class="font-mono">${zUedRatio}</span></div>
                </div>
            </div>
        </div>
    `;
    
    let fullHtml = '';
    if (validation && (validation.warnings?.length > 0 || validation.infos?.length > 0)) {
        fullHtml += renderValidationAlert(validation);
    }
    fullHtml += renderResultHeader(result.text);
    fullHtml += renderDetailsCard('📊 拖曳锚极限嵌入深度计算详情', contentHtml);
    fullHtml += renderParameterSummary(formulaModule, params);
    
    return fullHtml;
}