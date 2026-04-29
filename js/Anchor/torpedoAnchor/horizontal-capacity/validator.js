/**
 * @filepath: js/Anchor/torpedoAnchor/horizontal-capacity/validator.js
 * @description: 鱼雷锚水平承载力参数校验规则
 *              依据ABS Guidance Notes (2017) 和 API RP 2A规范
 */

import { ValidationResult, baseRules } from '../../shared/baseValidator.js';

export function validate(params) {
    const result = new ValidationResult();
    
    // ========== 1. 正数校验（错误级别） ==========
    const positiveChecks = [
        { value: params.anchor_diameter, name: "锚体直径 D" },
        { value: params.anchor_length, name: "锚体总长度 L" },
        { value: params.undrained_shear_strength, name: "泥面处不排水抗剪强度 Su0" },
        { value: params.strength_gradient, name: "抗剪强度梯度 k" },
    ];
    
    for (const check of positiveChecks) {
        const error = baseRules.positive(check.value, check.name);
        if (error) result.addError(error);
    }
    
    // 承载力系数范围校验
    const Nc = params.bearing_capacity_factor;
    if (Nc !== undefined) {
        const ncError = baseRules.range(Nc, "承载力系数 Nc", 8, 12);
        if (ncError) result.addWarning(ncError);
    }
    
    // ========== 2. 几何合理性警告 ==========
    // 长径比检查
    const L = params.anchor_length;
    const D = params.anchor_diameter;
    if (L && D && D > 0) {
        const aspectRatio = L / D;
        if (aspectRatio < 5) {
            result.addWarning(`长径比 L/D = ${aspectRatio.toFixed(2)} < 5，鱼雷锚通常长径比较大`);
        }
        if (aspectRatio > 25) {
            result.addWarning(`长径比 L/D = ${aspectRatio.toFixed(2)} > 25，超出常规范围`);
        }
    }
    
    // ========== 3. 强度参数合理性 ==========
    const Su0 = params.undrained_shear_strength;
    const k_su = params.strength_gradient;
    const z_top = params.embedment_top_depth || 0;
    const L_val = params.anchor_length || 0;
    
    if (Su0 !== undefined && Su0 < 1.0) {
        result.addWarning(`泥面抗剪强度 Su0 = ${Su0} kPa 较小，软黏土特性明显`);
    }
    
    if (k_su !== undefined && k_su === 0 && Su0 > 0) {
        result.addInfo("强度梯度 k = 0，按均匀土层计算");
    }
    
    if (k_su !== undefined && k_su > 3.0) {
        result.addWarning(`强度梯度 k = ${k_su} kPa/m 较大，超出常见软黏土范围 (0.5~2.0 kPa/m)`);
    }
    
    // 埋深检查
    if (z_top < 0) {
        result.addError(`锚顶埋深 z_top = ${z_top} m 不能为负数`);
    }
    
    if (z_top >= 0 && z_top < 1.0) {
        result.addWarning(`锚顶埋深 = ${z_top.toFixed(2)} m 较浅（小于1m），ABS GN指出公式可能不适用（浅层破坏模式不同）`);
    }
    
    // ========== 4. 翼板参数校验 ==========
    const includeFins = params.include_fins === true || params.include_fins === 'true';
    
    if (includeFins) {
        const finCount = params.fin_count;
        const finLength = params.fin_length;
        const finWidth = params.fin_width;
        
        if (finCount !== undefined && finCount < 0) {
            result.addError("翼板数量不能为负数");
        }
        
        if (finCount !== undefined && finCount === 0) {
            result.addError("翼板数量为0，但选择了考虑翼板贡献");
        }
        
        if (finLength !== undefined && finLength > L) {
            result.addWarning(`翼板长度 ${finLength} m 大于锚体总长 ${L} m`);
        }
        
        // 提示信息
        result.addInfo("已选择考虑翼板贡献，ABS GN建议保守设计应忽略翼板");
    }
    
    // ========== 5. 承载力系数提示 ==========
    if (Nc !== undefined && Nc === 9.0) {
        result.addInfo("使用API RP 2A推荐承载力系数 Nc = 9.0");
    }
    
    // ========== 6. 强度取值方式提示 ==========
    const strengthMode = params.strength_average_mode;
    if (strengthMode === 'surface') {
        result.addInfo("使用泥面强度进行估算，结果可能偏保守");
    } else if (strengthMode === 'average') {
        result.addInfo("使用沿锚身平均强度，适用于强度随深度线性增加的情况");
    } else if (strengthMode === 'mid_depth') {
        result.addInfo("使用锚中点深度强度，为最常用的取值方法");
    }
    
    return result;
}