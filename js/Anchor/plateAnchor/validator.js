/**
 * @filepath: js/Anchor/plateAnchor/validator.js
 * @description: 板锚参数校验规则
 */

import { ValidationResult, baseRules } from '../shared/baseValidator.js';

export function validate(params) {
    const result = new ValidationResult();
    
    // ========== 1. 正数校验（错误级别） ==========
    const positiveChecks = [
        { value: params.width, name: "特征尺寸 B/D" },
        { value: params.embedment_depth, name: "锚板埋深 H" },
        { value: params.undrained_strength, name: "不排水抗剪强度 s_u" },
        { value: params.unit_weight, name: "土体浮容重 γ'" },
        { value: params.reduction_factor, name: "土壤扰动折减系数 η" }
    ];
    
    for (const check of positiveChecks) {
        const error = baseRules.positive(check.value, check.name);
        if (error) result.addError(error);
    }
    
    // 矩形锚特有参数校验
    if (params.shape === 'rectangular') {
        if (params.length === undefined || params.length === null) {
            result.addError("矩形锚需要填写长边 L");
        } else {
            const lengthError = baseRules.positive(params.length, "矩形锚长边 L");
            if (lengthError) result.addError(lengthError);
            
            if (params.length < params.width) {
                result.addError(`矩形锚长边 L (${params.length}m) 不能小于短边 B (${params.width}m)`);
            }
        }
    }
    
    // ========== 2. 物理合理性校验 ==========
    const suRange = baseRules.range(params.undrained_strength, "不排水抗剪强度 s_u", 5, 200);
    if (suRange) result.addWarning(suRange);
    
    const gammaRange = baseRules.range(params.unit_weight, "土体浮容重 γ'", 3, 12);
    if (gammaRange) result.addWarning(gammaRange);
    
    const etaRange = baseRules.range(params.reduction_factor, "土壤扰动折减系数 η", 0.5, 1.0);
    if (etaRange) result.addError(etaRange);
    
    const widthRange = baseRules.range(params.width, "特征尺寸 B/D", 0.05, 5.0);
    if (widthRange) result.addWarning(widthRange);
    
    // ========== 3. 工程合理性警告 ==========
    const embedmentRatio = params.embedment_depth / params.width;
    
    if (embedmentRatio < 1.0) {
        result.addWarning(`埋深比 H/B = ${embedmentRatio.toFixed(2)} < 1.0，超出形状因子多项式拟合范围（推荐 1~10）`);
    } else if (embedmentRatio > 10.0) {
        result.addWarning(`埋深比 H/B = ${embedmentRatio.toFixed(2)} > 10.0，超出形状因子多项式拟合范围（推荐 1~10）`);
    }
    
    if (embedmentRatio < 0.5) {
        result.addWarning(`埋深比过小 (${embedmentRatio.toFixed(2)})，锚板可能接近泥面`);
    }
    
    // 矩形锚长宽比检查
    if (params.shape === 'rectangular' && params.length && params.width) {
        const aspectRatio = params.length / params.width;
        
        if (aspectRatio > 20) {
            result.addWarning(`矩形锚长宽比 L/B = ${aspectRatio.toFixed(2)} > 20，超出常见工程范围`);
        } else if (aspectRatio >= 10) {
            result.addInfo(`矩形锚长宽比 L/B = ${aspectRatio.toFixed(2)} ≥ 10，按条形锚极限值 N_c* = 11.16 计算`);
        }
    }
    
    return result;
}