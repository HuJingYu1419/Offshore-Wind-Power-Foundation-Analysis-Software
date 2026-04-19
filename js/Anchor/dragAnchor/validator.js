/**
 * @filepath: js/Anchor/dragAnchor/validator.js
 * @description: 拖曳锚参数校验规则
 */

import { ValidationResult, baseRules } from '../shared/baseValidator.js';

function validatePresetAnchor(params, result) {
    if (params.use_preset === true || params.use_preset === 'true') {
        const validTypes = ['small', 'medium', 'large'];
        if (!validTypes.includes(params.anchor_type)) {
            result.addError(`预定义锚板类型无效: ${params.anchor_type}，可选值: small, medium, large`);
        }
    }
}

function validateCustomAnchor(params, result) {
    if (!(params.use_preset === true || params.use_preset === 'true')) {
        const customChecks = [
            { value: params.custom_length, name: "自定义锚板长度" },
            { value: params.custom_width, name: "自定义锚板宽度" },
            { value: params.custom_thickness, name: "自定义锚板厚度" },
            { value: params.custom_A_bearing, name: "自定义端阻力面积 A_bearing" },
            { value: params.custom_A_shearing, name: "自定义剪切面积 A_shearing" },
            { value: params.custom_O, name: "自定义重心距离 O" }
        ];
        for (const check of customChecks) {
            if (check.value !== undefined && check.value !== null && check.value <= 0) {
                result.addError(`${check.name} 必须为正数（当前值: ${check.value}）`);
            }
        }
        if (params.custom_length && params.custom_width && params.custom_length < params.custom_width * 0.8) {
            result.addWarning(`锚板长度 (${params.custom_length}m) 明显小于宽度 (${params.custom_width}m)`);
        }
    }
}

function validateClayParams(params, result) {
    if (params.su0 !== undefined && params.su0 < 0) {
        result.addError(`泥面抗剪强度 s_u0 不能为负数（当前值: ${params.su0} kPa）`);
    }
    if (params.k !== undefined && params.k < 0) {
        result.addError(`抗剪强度梯度 k 不能为负数（当前值: ${params.k} kPa/m）`);
    }
    const alphaRange = baseRules.range(params.alpha, "粘滞系数 α", 0.2, 0.8);
    if (alphaRange) result.addWarning(alphaRange);
    const ncRange = baseRules.range(params.Nc, "承载力系数 Nc", 5, 12);
    if (ncRange) result.addWarning(ncRange);
}

function validateSandParams(params, result) {
    const gammaRange = baseRules.range(params.gamma, "土体浮容重 γ'", 3, 12);
    if (gammaRange) result.addWarning(gammaRange);
    const phiRange = baseRules.range(params.phi, "内摩擦角 φ", 15, 45);
    if (phiRange) result.addWarning(phiRange);
    const deltaFacRange = baseRules.range(params.delta_fac, "摩擦比 tanδ/tanφ", 0.3, 0.8);
    if (deltaFacRange) result.addWarning(deltaFacRange);
    const k0Range = baseRules.range(params.K0, "侧压力系数 K0", 0.3, 0.7);
    if (k0Range) result.addWarning(k0Range);
}

export function validate(params) {
    const result = new ValidationResult();
    
    if (params.c_deg !== undefined && params.c_deg <= 0) {
        result.addError(`系缆夹角 c 必须为正数（当前值: ${params.c_deg}°）`);
    }
    if (params.d !== undefined && params.d <= 0) {
        result.addError(`拖缆直径 d 必须为正数（当前值: ${params.d} m）`);
    }
    
    const cRange = baseRules.range(params.c_deg, "系缆夹角 c", 0, 90);
    if (cRange) result.addError(cRange);
    
    const thetaRange = baseRules.range(params.theta_m_deg, "锚板抬平角 θm", 0, 30);
    if (thetaRange) result.addWarning(thetaRange);
    
    const dRange = baseRules.range(params.d, "拖缆直径 d", 0.001, 0.05);
    if (dRange) result.addWarning(dRange);
    
    validatePresetAnchor(params, result);
    validateCustomAnchor(params, result);
    
    if (params.c_deg !== undefined && params.theta_m_deg !== undefined) {
        const angleDiff = params.c_deg - params.theta_m_deg;
        if (angleDiff <= 0) {
            result.addError(`系缆夹角 c (${params.c_deg}°) 必须大于抬平角 θm (${params.theta_m_deg}°)`);
        }
        if (params.theta_m_deg < 0) {
            result.addError(`抬平角 θm 需要为非负数`);
        }
    }
    
    if (params.soil_type === 'clay') {
        validateClayParams(params, result);
    } else if (params.soil_type === 'sand') {
        validateSandParams(params, result);
    } else {
        result.addError(`土体类型无效: ${params.soil_type}，可选值: clay, sand`);
    }
    
    return result;
}