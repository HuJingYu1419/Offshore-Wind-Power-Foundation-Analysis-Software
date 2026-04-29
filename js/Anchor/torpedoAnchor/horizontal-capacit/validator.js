/**
 * @filepath: js/Anchor/torpedoAnchor/horizontal-capacity/validator.js
 * @description: 鱼雷锚水平承载力参数校验（占位）
 */

import { ValidationResult, baseRules } from '../../shared/baseValidator.js';

export function validate(params) {
    const result = new ValidationResult();
    
    const checks = [
        { value: params.D, name: "锚体直径 D" },
        { value: params.L, name: "锚体长度 L" },
        { value: params.embedment_depth, name: "埋入深度" },
        { value: params.su_avg, name: "平均不排水抗剪强度" },
        { value: params.gamma_soil_sub, name: "土体有效浮重度" }
    ];
    
    for (const check of checks) {
        const error = baseRules.positive(check.value, check.name);
        if (error) result.addError(error);
    }
    
    // 埋深合理性检查
    if (params.embedment_depth > params.L) {
        result.addWarning(`埋入深度 (${params.embedment_depth}m) 大于锚体长度 (${params.L}m)`);
    }
    
    result.addInfo("水平承载力模块开发中，当前为占位计算");
    
    return result;
}