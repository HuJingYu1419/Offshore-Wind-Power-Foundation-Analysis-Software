/**
 * @filepath: js/Anchor/torpedoAnchor/validator.js
 * @description: 鱼雷锚参数校验规则
 */

import { ValidationResult, baseRules } from '../shared/baseValidator.js';

export function validate(params) {
    const result = new ValidationResult();
    
    // ========== 1. 正数校验（错误级别） ==========
    const positiveChecks = [
        { value: params.L, name: "锚体总长度 L" },
        { value: params.D, name: "锚体直径 D" },
        { value: params.Lt, name: "锚尖圆锥长度 Lt" },
        { value: params.n_fins, name: "锚翼数量 n_fins" },
        { value: params.L_fin, name: "锚翼总长度 L_fin" },
        { value: params.W_fin, name: "锚翼宽度 W_fin" },
        { value: params.t_fin, name: "锚翼厚度 t_fin" },
        { value: params.rho_steel, name: "钢材密度 ρ_steel" },
        { value: params.gamma_w, name: "水容重 γ_w" },
        { value: params.gamma_soil_sub, name: "土体有效浮重度 γ_sub" },
        { value: params.su0, name: "泥面处不排水抗剪强度 su0" },
        { value: params.k_su, name: "抗剪强度梯度 k_su" },
        { value: params.embedment_ratio, name: "埋深倍数" },
        { value: params.Nc_tip, name: "锚尖端承系数 Nc_tip" },
        { value: params.Nc_fin, name: "锚翼端承系数 Nc_fin" },
        { value: params.Nc_eye, name: "锚顶端承系数 Nc_eye" }
    ];
    
    for (const check of positiveChecks) {
        const error = baseRules.positive(check.value, check.name);
        if (error) result.addError(error);
    }
    
    // 特殊处理：抗剪强度梯度可以为零（均匀土层）
    if (params.k_su === 0 && params.su0 > 0) {
        result.addWarning("抗剪强度梯度 k_su = 0，土体强度不随深度变化（均匀土层）");
    }
    
    // ========== 2. 工程合理性警告 ==========
    const aspectWarning = baseRules.aspectRatio(params.L, params.D, "长径比 L/D", 3, 20);
    if (aspectWarning) result.addWarning(aspectWarning);
    
    if (params.embedment_ratio < 0.5) {
        result.addWarning(`埋深倍数 = ${params.embedment_ratio} < 0.5，锚体可能未完全埋入`);
    }
    if (params.embedment_ratio > 5) {
        result.addWarning(`埋深倍数 = ${params.embedment_ratio} > 5，超出常见工程范围`);
    }
    
    // 圆锥长度合理性
    if (params.Lt > params.L) {
        result.addError(`圆锥长度 Lt (${params.Lt}m) 不能大于锚体总长 L (${params.L}m)`);
    }
    
    // 锚翼长度合理性
    if (params.L_fin > params.L) {
        result.addError(`锚翼长度 L_fin (${params.L_fin}m) 不能大于锚体总长 L (${params.L}m)`);
    }
    
    // ========== 3. 计算模式校验 ==========
    if (params.calc_mode !== 0 && params.calc_mode !== 1) {
        result.addError(`计算模式 calc_mode 只能为 0（短期模式）或 1（长期模式），当前值: ${params.calc_mode}`);
    }
    
    if (params.calc_mode === 0) {
        const stCheck = baseRules.range(params.sensitivity_St, "土体敏感度 St", 1, 10);
        if (stCheck) result.addWarning(stCheck);
    }
    
    // ========== 4. 承载力系数合理性检查 ==========
    const ncChecks = [
        { value: params.Nc_tip, name: "锚尖端承系数 Nc_tip", min: 9, max: 15 },
        { value: params.Nc_fin, name: "锚翼端承系数 Nc_fin", min: 5, max: 12 },
        { value: params.Nc_eye, name: "锚顶端承系数 Nc_eye", min: 7, max: 12 }
    ];
    
    for (const check of ncChecks) {
        const rangeError = baseRules.range(check.value, check.name, check.min, check.max);
        if (rangeError) result.addWarning(rangeError);
    }
    
    return result;
}