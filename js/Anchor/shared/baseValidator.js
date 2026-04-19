/**
 * @filepath: js/Anchor/shared/baseValidator.js
 * @description: 锚固件校验基础模块
 */

export class ValidationResult {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.infos = [];
    }
    
    get isValid() {
        return this.errors.length === 0;
    }
    
    addError(message) {
        this.errors.push(message);
    }
    
    addWarning(message) {
        this.warnings.push(message);
    }
    
    addInfo(message) {
        this.infos.push(message);
    }
    
    toObject() {
        return {
            isValid: this.isValid,
            errors: [...this.errors],
            warnings: [...this.warnings],
            infos: [...this.infos]
        };
    }
}

export const baseRules = {
    positive(value, name) {
        if (value === undefined || value === null) return `${name} 未填写`;
        if (value <= 0) return `${name} 必须为正数（当前值: ${value}）`;
        return null;
    },
    
    nonNegative(value, name) {
        if (value === undefined || value === null) return `${name} 未填写`;
        if (value < 0) return `${name} 不能为负数（当前值: ${value}）`;
        return null;
    },
    
    range(value, name, min, max) {
        if (value === undefined || value === null) return `${name} 未填写`;
        if (value < min || value > max) {
            return `${name} 应在 ${min} ~ ${max} 范围内（当前值: ${value}）`;
        }
        return null;
    },
    
    aspectRatio(L, D, name = "长径比", min = 3, max = 20) {
        if (L <= 0 || D <= 0) return null;
        const ratio = L / D;
        if (ratio < min) return `${name} = ${ratio.toFixed(2)}，小于建议最小值 ${min}`;
        if (ratio > max) return `${name} = ${ratio.toFixed(2)}，大于建议最大值 ${max}`;
        return null;
    }
};

export function createValidationResult() {
    return new ValidationResult();
}