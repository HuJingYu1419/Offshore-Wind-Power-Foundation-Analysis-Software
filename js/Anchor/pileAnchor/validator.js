/**
 * @filepath: js/Anchor/pileAnchor/validator.js
 * @description: 桩锚参数校验规则
 */

import { ValidationResult, baseRules } from '../shared/baseValidator.js';

export function validate(params) {
    const result = new ValidationResult();
    
    // ========== 1. 正数校验 ==========
    const positiveChecks = [
        { value: params.L, name: "桩长 L" },
        { value: params.D, name: "桩径 D" },
        { value: params.m_pile, name: "桩质量 m_pile" },
        { value: params.gamma, name: "土体有效重度 γ'" },
        { value: params.K0, name: "侧向土压力系数 K0" },
        { value: params.eta, name: "桩前土压力形状系数 η" },
        { value: params.xi, name: "侧剪阻力形状系数 ξ" }
    ];
    
    for (const check of positiveChecks) {
        const error = baseRules.positive(check.value, check.name);
        if (error) result.addError(error);
    }
    
    // ========== 2. 角度参数范围校验 ==========
    const phiRange = baseRules.range(params.phi_deg, "砂土峰值摩擦角 φ", 15, 45);
    if (phiRange) result.addWarning(phiRange);
    
    const deltaRange = baseRules.range(params.delta_deg, "桩土界面摩擦角 δ", 10, 45);
    if (deltaRange) result.addWarning(deltaRange);
    
    const phiCritRange = baseRules.range(params.phi_crit_deg, "临界状态摩擦角 φ'_crit", 25, 40);
    if (phiCritRange) result.addWarning(phiCritRange);
    
    const thetaRange = baseRules.range(params.theta_deg, "加载倾斜角 θ", 0, 90);
    if (thetaRange) result.addError(thetaRange);
    
    // ========== 3. 参数间物理一致性校验 ==========
    if (params.delta_deg > params.phi_deg) {
        result.addWarning(`桩土界面摩擦角 δ (${params.delta_deg}°) 大于土体摩擦角 φ (${params.phi_deg}°)，建议 δ ≤ φ`);
    }
    
    // ========== 4. 几何参数合理性校验 ==========
    const aspectRatio = params.L / params.D;
    if (aspectRatio < 2) {
        result.addWarning(`长径比 L/D = ${aspectRatio.toFixed(2)} < 2，桩体偏短，可能不属于刚性桩范畴`);
    } else if (aspectRatio > 10) {
        result.addWarning(`长径比 L/D = ${aspectRatio.toFixed(2)} > 10，桩体偏长，本模型假定刚性桩`);
    }
    
    if (params.L < 1) {
        result.addError(`桩长 L = ${params.L}m 过短，无法形成有效的锚固效应`);
    }
    
    // ========== 5. 偏心距检查 ==========
    if (params.e !== undefined && params.e !== null) {
        if (Math.abs(params.e) > params.L) {
            result.addWarning(`偏心距 |e| = ${Math.abs(params.e)}m 大于桩长 L = ${params.L}m`);
        }
    }
    
    // ========== 6. 经验系数合理性校验 ==========
    const etaRange = baseRules.range(params.eta, "桩前土压力形状系数 η", 0.5, 2.5);
    if (etaRange) result.addWarning(etaRange);
    
    const xiRange = baseRules.range(params.xi, "侧剪阻力形状系数 ξ", 0.5, 2.5);
    if (xiRange) result.addWarning(xiRange);
    
    const k0Range = baseRules.range(params.K0, "侧向土压力系数 K0", 0.2, 0.8);
    if (k0Range) result.addWarning(k0Range);
    
    // ========== 7. 竖向承载力分段公式适用性提示 ==========
    if (params.delta_deg <= 26) {
        result.addInfo(`δ = ${params.delta_deg}° ≤ 26°，采用桩土界面破坏模式计算竖向承载力`);
    } else if (params.delta_deg < 39) {
        result.addInfo(`δ = ${params.delta_deg}° (26°~39°)，采用加权组合模式计算竖向承载力`);
    } else {
        result.addInfo(`δ = ${params.delta_deg}° ≥ 39°，采用Vermeer法计算竖向承载力`);
    }
    
    // ========== 8. 论文验证模式提示 ==========
    if (params.use_paper_hu === true || params.use_paper_hu === "true") {
        result.addInfo("已启用「论文验证Hu值」模式，水平承载力 Hu 将使用论文验证值 3349.85 kN");
    }
    
    return result;
}