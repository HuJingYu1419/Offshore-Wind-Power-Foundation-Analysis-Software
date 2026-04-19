/**
 * @filepath: js/Anchor/gravityAnchor/renderer.js
 * @description: 重力锚专用渲染器
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
    
    let contentHtml = `
        <div class="space-y-3">
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">📋 输入参数摘要</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">锚类型:</span> ${details.anchor_type}</div>
                    <div><span class="text-ocean-600">锚尺寸 L×B×H:</span> ${formatNumberSmart(details.L_m)}m × ${formatNumberSmart(details.B_m)}m × ${formatNumberSmart(details.H_m)}m</div>
                    <div><span class="text-ocean-600">基底面积 A<sub>b</sub>:</span> ${formatNumberSmart(details.A_base_m2)} m²</div>
                    <div><span class="text-ocean-600">裙板深度:</span> ${formatNumberSmart(details.skirt_depth_m)} m</div>
                    <div><span class="text-ocean-600">水中锚重量 W:</span> ${formatNumberSmart(details.weight_in_water_kN)} kN</div>
                </div>
            </div>
    `;
    
    // 水平承载力
    if (details.horizontal_capacity) {
        const hc = details.horizontal_capacity;
        contentHtml += `
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">📐 水平承载力计算结果</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">底部强度 s<sub>u</sub>(z):</span> ${formatNumberSmart(hc.su_at_base_kPa)} kPa</div>
                    <div><span class="text-ocean-600">平均强度 s<sub>ua</sub>:</span> ${formatNumberSmart(hc.average_su_kPa)} kPa</div>
                    <div><span class="text-ocean-600">底部粘着力:</span> ${formatNumberSmart(hc.term1_base_adhesion_kN)} kN</div>
                    <div><span class="text-ocean-600">侧向/裙板阻力:</span> ${formatNumberSmart(hc.term2_lateral_resistance_kN || hc.term2_skirt_resistance_kN)} kN</div>
                    <div class="col-span-2 pt-2 border-t border-ocean-200">
                        <span class="font-bold text-ocean-800">📈 水平承载力 F<sub>h</sub>:</span>
                        <span class="font-bold text-ocean-700 text-lg ml-2">${formatNumberSmart(hc.horizontal_capacity_kN)} kN</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 上拔力
    if (details.uplift_capacity) {
        const uc = details.uplift_capacity;
        contentHtml += `
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">⬆️ 上拔力计算结果</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">修正因子 F:</span> ${formatNumberSmart(uc.factor_F)}</div>
                    <div><span class="text-ocean-600">修正因子 K<sub>c</sub>:</span> ${formatNumberSmart(uc.factor_Kc)}</div>
                    <div><span class="text-ocean-600">底部承载力 V<sub>e</sub>:</span> ${formatNumberSmart(uc.ve_base_capacity_kN)} kN</div>
                    <div><span class="text-ocean-600">侧向摩擦力 V<sub>s</sub>:</span> ${formatNumberSmart(uc.vs_skirt_friction_kN)} kN</div>
                    <div><span class="text-ocean-600">锚自重 W:</span> ${formatNumberSmart(uc.anchor_weight_kN)} kN</div>
                    <div class="col-span-2 pt-2 border-t border-ocean-200">
                        <span class="font-bold text-ocean-800">📈 总上拔力:</span>
                        <span class="font-bold text-ocean-700 text-lg ml-2">${formatNumberSmart(uc.uplift_capacity_kN)} kN</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 贯入阻力
    if (details.penetration_resistance) {
        const pr = details.penetration_resistance;
        contentHtml += `
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">🔨 贯入阻力计算结果</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">侧边阻力 Q<sub>side</sub>:</span> ${formatNumberSmart(pr.qside_side_resistance_kN)} kN</div>
                    <div><span class="text-ocean-600">端部阻力 Q<sub>tip</sub>:</span> ${formatNumberSmart(pr.qtip_tip_resistance_kN)} kN</div>
                    <div class="col-span-2 pt-2 border-t border-ocean-200">
                        <span class="font-bold text-ocean-800">📈 总贯入阻力:</span>
                        <span class="font-bold text-ocean-700 text-lg ml-2">${formatNumberSmart(pr.penetration_resistance_kN)} kN</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 防倾覆稳定性
    if (details.overturning_stability) {
        const os = details.overturning_stability;
        const stabilityColor = os.is_stable ? 'text-green-700' : 'text-red-700';
        const stabilityBg = os.is_stable ? 'bg-green-50' : 'bg-red-50';
        contentHtml += `
            <div class="bg-ocean-50 p-3 rounded">
                <div class="font-semibold text-ocean-800 mb-2">⚖️ 防倾覆稳定性计算结果</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-ocean-600">倾覆力矩 M<sub>O</sub>:</span> ${formatNumberSmart(os.overturning_moment_MO_kN_m)} kN·m</div>
                    <div><span class="text-ocean-600">抗倾覆力矩 M<sub>R</sub>:</span> ${formatNumberSmart(os.resisting_moment_MR_kN_m)} kN·m</div>
                    <div><span class="text-ocean-600">安全系数:</span> ${formatNumberSmart(os.safety_factor)}</div>
                </div>
                <div class="mt-3 ${stabilityBg} p-2 rounded text-center">
                    <span class="font-bold ${stabilityColor}">${os.stability_status}</span>
                </div>
            </div>
        `;
    }
    
    contentHtml += `</div>`;
    
    let fullHtml = '';
    if (validation && (validation.warnings?.length > 0 || validation.infos?.length > 0)) {
        fullHtml += renderValidationAlert(validation);
    }
    
    fullHtml += renderResultHeader(result.text);
    fullHtml += renderDetailsCard('📊 重力锚承载力计算结果', contentHtml);
    fullHtml += renderParameterSummary(formulaModule, params);
    
    return fullHtml;
}