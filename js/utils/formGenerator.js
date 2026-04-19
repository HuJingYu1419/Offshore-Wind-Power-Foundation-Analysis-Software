// js/utils/formGenerator.js
/**
 * @filepath: js/utils/formGenerator.js
 * @description: 表单生成工具模块，负责生成各类参数输入表单的HTML，并提供表单重置功能
 *               支持 number 和 select 两种输入类型
 */

/**
 * 生成单个参数输入框的HTML
 * @param {Object} param - 参数定义对象
 * @returns {string} HTML字符串
 */
export function generateParamInputHtml(param) {
    // 检查是否为 select 类型（有 options 字段）
    if (param.options && Array.isArray(param.options)) {
        // 生成下拉选择框
        let optionsHtml = '';
        param.options.forEach((opt, idx) => {
            const label = param.optionsLabel && param.optionsLabel[idx] ? param.optionsLabel[idx] : opt;
            const selected = param.default === opt ? 'selected' : '';
            optionsHtml += `<option value="${opt}" ${selected}>${label}</option>`;
        });
        
        return `
            <div class="parameter-input bg-ocean-50 p-3 rounded-lg">
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
        <div class="parameter-input bg-ocean-50 p-3 rounded-lg">
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
 * 检查参数是否满足条件显示（根据 condition 字段）
 * @param {Object} param - 参数定义对象
 * @param {Object} currentValues - 当前表单值
 * @returns {boolean} 是否显示
 */
function shouldShowParam(param, currentValues) {
    if (!param.condition) return true;
    for (const [key, value] of Object.entries(param.condition)) {
        if (currentValues[key] !== value) return false;
    }
    return true;
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
                ${formulaModule.formula}
            </div>
        </div>
    `;
    
    formHtml += `<div class="param-grid" id="paramGrid">`;
    formulaModule.parameters.forEach(param => {
        formHtml += generateParamInputHtml(param);
    });
    formHtml += `</div>`;
    
    // 添加条件显示逻辑
    const scriptId = `param_script_${Date.now()}`;
    formHtml += `
        <script id="${scriptId}">
            (function() {
                const container = document.getElementById('paramGrid');
                if (!container) return;
                
                const params = ${JSON.stringify(formulaModule.parameters)};
                const conditionParams = params.filter(p => p.condition);
                if (conditionParams.length === 0) return;
                
                function updateVisibility() {
                    // 获取当前所有值
                    const currentValues = {};
                    params.forEach(p => {
                        const el = document.getElementById('param_' + p.id);
                        if (el) {
                            if (el.type === 'select-one') {
                                currentValues[p.id] = el.value;
                            } else {
                                currentValues[p.id] = parseFloat(el.value);
                            }
                        }
                    });
                    
                    // 更新每个条件参数的可见性
                    params.forEach(p => {
                        if (!p.condition) return;
                        const paramDiv = document.getElementById('param_' + p.id)?.closest('.parameter-input');
                        if (!paramDiv) return;
                        
                        let shouldShow = true;
                        for (const [condKey, condValue] of Object.entries(p.condition)) {
                            if (currentValues[condKey] !== condValue) {
                                shouldShow = false;
                                break;
                            }
                        }
                        paramDiv.style.display = shouldShow ? '' : 'none';
                    });
                }
                
                // 监听所有影响条件显示的参数变化
                const watchIds = [...new Set(conditionParams.flatMap(p => Object.keys(p.condition)))];
                watchIds.forEach(id => {
                    const el = document.getElementById('param_' + id);
                    if (el) {
                        el.addEventListener('change', updateVisibility);
                        el.addEventListener('input', updateVisibility);
                    }
                });
                
                updateVisibility();
            })();
        </script>
    `;
    
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
        mode: '⚙️ 计算模式'
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
    
    // 添加条件显示逻辑
    const conditionParams = formulaModule.parameters.filter(p => p.condition);
    if (conditionParams.length > 0) {
        const scriptId = `param_script_${Date.now()}`;
        formHtml += `
            <script id="${scriptId}">
                (function() {
                    const params = ${JSON.stringify(formulaModule.parameters)};
                    const conditionParams = params.filter(p => p.condition);
                    if (conditionParams.length === 0) return;
                    
                    function updateVisibility() {
                        // 获取当前所有值
                        const currentValues = {};
                        params.forEach(p => {
                            const el = document.getElementById('param_' + p.id);
                            if (el) {
                                if (el.type === 'select-one') {
                                    currentValues[p.id] = el.value;
                                } else {
                                    currentValues[p.id] = parseFloat(el.value);
                                }
                            }
                        });
                        
                        // 更新每个条件参数的可见性
                        params.forEach(p => {
                            if (!p.condition) return;
                            const paramDiv = document.getElementById('param_' + p.id)?.closest('.parameter-input');
                            if (!paramDiv) return;
                            
                            let shouldShow = true;
                            for (const [condKey, condValue] of Object.entries(p.condition)) {
                                if (currentValues[condKey] !== condValue) {
                                    shouldShow = false;
                                    break;
                                }
                            }
                            paramDiv.style.display = shouldShow ? '' : 'none';
                        });
                    }
                    
                    // 监听所有影响条件显示的参数变化
                    const watchIds = [...new Set(conditionParams.flatMap(p => Object.keys(p.condition)))];
                    watchIds.forEach(id => {
                        const el = document.getElementById('param_' + id);
                        if (el) {
                            el.addEventListener('change', updateVisibility);
                            el.addEventListener('input', updateVisibility);
                        }
                    });
                    
                    updateVisibility();
                })();
            </script>
        `;
    }
    
    return formHtml;
}

/**
 * 获取表单参数值
 */
export function getParameterValues(formulaModule) {
    const params = {};
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
 */
export function resetFormToDefaults(formulaModule) {
    if (!formulaModule || !formulaModule.parameters) return;
    
    formulaModule.parameters.forEach(param => {
        const input = document.getElementById(`param_${param.id}`);
        if (input) {
            if (input.type === 'select-one') {
                input.value = param.default;
            } else {
                input.value = param.default;
            }
        }
    });
    
    // 触发条件显示更新
    const event = new Event('change');
    document.querySelectorAll('[id^="param_"]').forEach(el => {
        el.dispatchEvent(event);
    });
}