/**
 * @filepath: js/utils/validator.js
 * @description: 校验工具主入口
 */

import { getAnchorModule } from '../Anchor/index.js';
import { ValidationResult } from '../Anchor/shared/baseValidator.js';

export function validateModule(formulaModule, params) {
    if (!formulaModule || !formulaModule.id) {
        return { isValid: true, errors: [], warnings: [], infos: [] };
    }
    
    const moduleId = formulaModule.id;
    const anchorParentIds = ['gravity', 'torpedo', 'plate', 'pile', 'drag', 'suction'];
    
    // 方案一：优先检查模块自身是否有 validate 方法
    if (typeof formulaModule.validate === 'function') {
        const result = formulaModule.validate(params);
        if (result && typeof result.toObject === 'function') {
            return result.toObject();
        }
        return result || { isValid: true, errors: [], warnings: [], infos: [] };
    }
    
    // 兼容旧逻辑：检查是否属于父模块ID
    if (anchorParentIds.includes(moduleId)) {
        const anchorModule = getAnchorModule(moduleId);
        if (anchorModule && typeof anchorModule.validate === 'function') {
            const result = anchorModule.validate(params);
            if (result && typeof result.toObject === 'function') {
                return result.toObject();
            }
            return result || { isValid: true, errors: [], warnings: [], infos: [] };
        }
        return { isValid: true, errors: [], warnings: [], infos: [] };
    }
    
    // 非锚固件模块：通用校验
    return validateGeneric(params, formulaModule.parameters);
}

function validateGeneric(params, parameters) {
    const errors = [];
    
    if (!parameters || !Array.isArray(parameters)) {
        return { isValid: true, errors: [], warnings: [], infos: [] };
    }
    
    for (const param of parameters) {
        const value = params[param.id];
        if (value === undefined || value === null) {
            errors.push(`${param.name} 未填写`);
        } else if (typeof value === 'number' && value <= 0 && !param.options) {
            errors.push(`${param.name} 必须为正数（当前值: ${value}）`);
        }
    }
    
    return { isValid: errors.length === 0, errors, warnings: [], infos: [] };
}

export function renderValidationOnly(validation, formulaModule) {
    const resultSection = document.getElementById('resultSection');
    if (!resultSection) return;
    
    // 动态导入避免循环依赖
    import('../Anchor/shared/baseRenderer.js').then(({ renderValidationAlert }) => {
        const alertHtml = renderValidationAlert(validation);
        const moduleName = formulaModule?.name || '当前模块';
        
        resultSection.innerHTML = `
            ${alertHtml}
            <div class="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                <i class="fas fa-ban text-2xl mb-2"></i>
                <p>${moduleName} 计算已阻止</p>
                <p class="text-sm mt-1">请根据上方提示修正输入参数后重新计算</p>
            </div>
        `;
    }).catch(() => {
        // fallback
        resultSection.innerHTML = `
            <div class="bg-red-100 p-3 rounded mb-4">
                <div class="font-bold">输入错误</div>
                <ul>${validation.errors.map(e => `<li>${e}</li>`).join('')}</ul>
            </div>
        `;
    });
}