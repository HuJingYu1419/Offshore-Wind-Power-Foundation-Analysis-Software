// js/utils/formGenerator.js
/**
 * @filepath: js/utils/formGenerator.js
 * @description: 表单生成工具模块，负责生成各类参数输入表单的HTML，并提供表单重置功能
 *               支持 number 和 select 两种输入类型
 *               条件显示功能由独立的 conditionManager.js 管理
 */

/**
 * 生成单个参数输入框的HTML
 * @param {Object} param - 参数定义对象
 * @returns {string} HTML字符串
 */
export function generateParamInputHtml(param) {
    // 生成 data-condition 属性（如果存在条件依赖）
    let conditionAttr = '';
    if (param.condition) {
        const conditions = [];
        for (const [key, value] of Object.entries(param.condition)) {
            // 将条件转换为字符串格式，如 "include_fins=true"
            conditions.push(`${key}=${value}`);
        }
        conditionAttr = `data-condition="${conditions.join('&')}"`;
    }
    
    // 检查是否为 select 类型（有 options 字段）
    if (param.options && Array.isArray(param.options)) {
        let optionsHtml = '';
        param.options.forEach((opt, idx) => {
            const label = param.optionsLabel && param.optionsLabel[idx] ? param.optionsLabel[idx] : opt;
            // 处理布尔值，转换为字符串用于 option value
            const optValue = typeof opt === 'boolean' ? String(opt) : opt;
            const selected = param.default === opt ? 'selected' : '';
            optionsHtml += `<option value="${optValue}" ${selected}>${label}</option>`;
        });
        
        return `
            <div class="parameter-input bg-ocean-50 p-3 rounded-lg" ${conditionAttr}>
                <label class="block text-ocean-700 font-medium mb-1">
                    ${param.name}
                    ${param.note ? `<span class="text-xs text-ocean-400 ml-1">(${param.note})</span>` : ''}
                </label>
                <select 
                    id="param_${param.id}" 
                    class="w-full p-2 border border-ocean-300 rounded focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent bg-white"
                >
                    ${optionsHtml}
                </select>
                <span class="text-xs text-ocean-600 block mt-1">${param.unit || '选择'}</span>
            </div>
        `;
    }
    
    // 数字输入框
    const minAttr = param.min !== undefined ? `min="${param.min}"` : '';
    const maxAttr = param.max !== undefined ? `max="${param.max}"` : '';
    const stepAttr = param.step !== undefined ? `step="${param.step}"` : 'step="any"';
    
    return `
        <div class="parameter-input bg-ocean-50 p-3 rounded-lg" ${conditionAttr}>
            <label class="block text-ocean-700 font-medium mb-1">
                ${param.name}
                ${param.note ? `<span class="text-xs text-ocean-400 ml-1">(${param.note})</span>` : ''}
            </label>
            <input 
                type="number" 
                id="param_${param.id}" 
                value="${param.default}"
                ${minAttr}
                ${maxAttr}
                ${stepAttr}
                class="w-full p-2 border border-ocean-300 rounded focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
            >
            <span class="text-xs text-ocean-600 block mt-1">${param.unit}</span>
        </div>
    `;
}

/**
 * 生成标准表单（无分组）
 */
export function generateStandardForm(formulaModule) {
    let formHtml = `
        <div class="bg-ocean-50 p-4 rounded-lg mb-4">
            <h3 class="font-bold text-ocean-700">${formulaModule.name}</h3>
            <p class="text-ocean-600 mt-1">${formulaModule.description}</p>
            <div class="mt-2 p-3 bg-white rounded font-mono text-sm overflow-x-auto">
                ${formulaModule.formula || ''}
            </div>
        </div>
    `;
    
    formHtml += `<div class="param-grid" id="paramGrid">`;
    formulaModule.parameters.forEach(param => {
        formHtml += generateParamInputHtml(param);
    });
    formHtml += `</div>`;
    
    return formHtml;
}

/**
 * 生成分组表单（按 category 分组）
 */
export function generateGroupedForm(formulaModule) {
    let formHtml = `
        <div class="bg-ocean-50 p-4 rounded-lg mb-4">
            <h3 class="font-bold text-ocean-700">${formulaModule.name}</h3>
        </div>
    `;
    
    // 按分类分组参数
    const categories = {};
    formulaModule.parameters.forEach(param => {
        if (param.category) {
            if (!categories[param.category]) {
                categories[param.category] = [];
            }
            categories[param.category].push(param);
        } else {
            // 没有 category 的参数放到 'other' 组
            if (!categories['other']) {
                categories['other'] = [];
            }
            categories['other'].push(param);
        }
    });
    
    const categoryNames = {
        anchor: '📦 锚体参数',
        soil: '🌍 土体参数',
        geometry: '📐 几何参数',
        load: '⚡ 荷载参数',
        material: '🔧 材料参数',
        environment: '💧 环境参数',
        coefficient: '📊 承载力系数',
        mode: '⚙️ 计算模式',
        other: '📋 其他参数'
    };
    
    for (const [key, params] of Object.entries(categories)) {
        if (params.length > 0) {
            formHtml += `
                <div class="bg-ocean-100 p-3 rounded-lg mb-4" data-category="${key}">
                    <h4 class="font-bold text-ocean-800 mb-3">${categoryNames[key] || key}</h4>
                    <div class="param-grid" data-category-grid="${key}">
            `;
            params.forEach(param => {
                formHtml += generateParamInputHtml(param);
            });
            formHtml += `</div></div>`;
        }
    }
    
    return formHtml;
}

/**
 * 获取表单参数值
 * @param {Object} formulaModule - 公式模块对象
 * @returns {Object} 参数键值对
 */
export function getParameterValues(formulaModule) {
    const params = {};
    if (!formulaModule || !formulaModule.parameters) {
        return params;
    }
    
    formulaModule.parameters.forEach(param => {
        const input = document.getElementById(`param_${param.id}`);
        if (input) {
            if (input.type === 'select-one') {
                // 处理布尔值
                if (param.default === true || param.default === false) {
                    params[param.id] = input.value === 'true';
                } else {
                    params[param.id] = input.value;
                }
            } else {
                params[param.id] = parseFloat(input.value) || 0;
            }
        }
    });
    return params;
}

/**
 * 重置表单所有参数为默认值
 * @param {Object} formulaModule - 公式模块对象
 */
export function resetFormToDefaults(formulaModule) {
    if (!formulaModule || !formulaModule.parameters) return;
    
    formulaModule.parameters.forEach(param => {
        const input = document.getElementById(`param_${param.id}`);
        if (input) {
            if (input.type === 'select-one') {
                // 处理布尔值的字符串表示
                const defaultValue = typeof param.default === 'boolean' ? String(param.default) : param.default;
                input.value = defaultValue;
            } else {
                input.value = param.default;
            }
        }
    });
    
    // 触发 change 事件，让条件管理器更新
    const event = new Event('change', { bubbles: true });
    document.querySelectorAll('[id^="param_"]').forEach(el => {
        el.dispatchEvent(event);
    });
}