/**
 * @filepath: js/Anchor/torpedoAnchor/penetration/validator.js
 * @description: 鱼雷锚安装贯入深度参数校验（占位）
 */

import { ValidationResult, baseRules } from '../../shared/baseValidator.js';

export function validate(params) {
    const result = new ValidationResult();
    
    const checks = [
        { value: params.W, name: "锚体自重 W" },
        { value: params.H_drop, name: "投放高度" },
        { value: params.v_impact, name: "触底速度" },
        { value: params.D, name: "锚体直径 D" },
        { value: params.su_avg, name: "平均不排水抗剪强度" },
        { value: params.k_su, name: "抗剪强度梯度" }
    ];
    
    for (const check of checks) {
        const error = baseRules.positive(check.value, check.name);
        if (error) result.addError(error);
    }
    
    result.addInfo("安装贯入深度模块开发中，当前为占位计算");
    
    return result;
}