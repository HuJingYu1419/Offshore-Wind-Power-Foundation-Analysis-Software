/**
 * @filepath: js/Anchor/gravityAnchor/validator.js
 * @description: 重力锚参数校验规则
 */

import { ValidationResult, baseRules } from '../shared/baseValidator.js';

export function validate(params) {
    const result = new ValidationResult();
    
    // ========== 1. 正数校验 ==========
    const positiveChecks = [
        { value: params.L, name: "锚长度 L" },
        { value: params.B, name: "锚宽度 B" },
        { value: params.H, name: "锚高度 H" },
        { value: params.weight_in_water, name: "水中锚重量 W" },
        { value: params.Sum, name: "泥线处不排水抗剪强度 Sum" },
        { value: params.k, name: "抗剪强度梯度 k" },
        { value: params.gamma_b, name: "土体浮容重 γ'" },
        { value: params.alpha, name: "粘着系数 α" },
        { value: params.design_load_T, name: "设计水平荷载 T" },
        { value: params.A_arm, name: "倾覆力臂 A" },
        { value: params.L_arm, name: "抗倾覆力臂 L" }
    ];
    
    for (const check of positiveChecks) {
        if (check.value !== undefined && check.value !== null && check.value <= 0) {
            result.addError(`${check.name} 必须为正数（当前值: ${check.value}）`);
        }
    }
    
    // ========== 2. 几何参数合理性校验 ==========
    const aspectRatio = params.L / params.B;
    if (aspectRatio < 0.8 || aspectRatio > 1.2) {
        result.addWarning(`长宽比 L/B = ${aspectRatio.toFixed(2)}，偏离方形较多，重力锚通常接近方形`);
    }
    
    const heightRatio = params.H / params.B;
    if (heightRatio < 0.2) {
        result.addWarning(`高宽比 H/B = ${heightRatio.toFixed(2)} 过小，锚体偏扁平`);
    } else if (heightRatio > 1.0) {
        result.addWarning(`高宽比 H/B = ${heightRatio.toFixed(2)} 过大，重心偏高`);
    }
    
    if (params.anchor_type === 'skirted') {
        if (params.skirt_depth <= 0) {
            result.addWarning(`裙板深度 = ${params.skirt_depth}m，带裙板锚但贯入深度为零，将按平底锚计算`);
        } else if (params.skirt_depth > params.H) {
            result.addError(`裙板深度 (${params.skirt_depth}m) 不能大于锚高度 (${params.H}m)`);
        }
    }
    
    // ========== 3. 土体参数合理性校验 ==========
    if (params.Sum < 0.5) {
        result.addWarning(`泥线强度 Sum = ${params.Sum} kPa 过小，土体极软`);
    }
    if (params.Sum > 50) {
        result.addWarning(`泥线强度 Sum = ${params.Sum} kPa 过大，超出常见黏土范围`);
    }
    
    const gammaRange = baseRules.range(params.gamma_b, "土体浮容重 γ'", 3, 12);
    if (gammaRange) result.addWarning(gammaRange);
    
    const alphaRange = baseRules.range(params.alpha, "粘着系数 α", 0.2, 0.8);
    if (alphaRange) result.addWarning(alphaRange);
    
    // ========== 4. 荷载参数合理性校验 ==========
    if (params.A_arm > params.H * 1.5) {
        result.addWarning(`倾覆力臂 A = ${params.A_arm}m 大于锚高度 ${params.H}m，请确认输入`);
    }
    if (params.L_arm > params.L) {
        result.addWarning(`抗倾覆力臂 L = ${params.L_arm}m 大于锚长度 ${params.L}m，请确认输入`);
    }
    
    // ========== 5. 计算模式提示 ==========
    if (params.use_paper_nc) {
        result.addInfo(`使用论文 Nc = 6.095 进行上拔力和贯入阻力计算`);
    } else {
        result.addInfo(`使用规范 Nc = 9.0 进行上拔力和贯入阻力计算`);
    }
    
    if (params.contact_type === 'rough') {
        result.addInfo(`使用粗糙接触模型计算修正因子F`);
    } else {
        result.addInfo(`使用光滑接触模型计算修正因子F`);
    }
    
    return result;
}