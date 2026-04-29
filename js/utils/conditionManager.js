// js/utils/conditionManager.js
/**
 * @filepath: js/utils/conditionManager.js
 * @description: 条件显示管理器 - 独立于表单生成器，负责处理参数之间的条件依赖关系
 *               通过 data-condition 属性驱动，无需内嵌脚本
 * @usage: 在表单生成后调用 initConditionManager(container) 即可
 */

// 存储当前活跃的事件监听器，用于清理
let activeListeners = new Map();

/**
 * 解析条件字符串，支持多种格式
 * @param {string} conditionStr - 如 "include_fins=true" 或 "soil_type=sand&depth>5"
 * @returns {Object} 解析后的条件对象 { paramId: { operator, value } }
 */
function parseCondition(conditionStr) {
    if (!conditionStr) return {};
    
    const conditions = {};
    const parts = conditionStr.split('&');
    
    parts.forEach(part => {
        // 匹配各种运算符：=, ==, >, <, >=, <=
        const match = part.match(/(\w+)(==|=|>|<|>=|<=)(.+)/);
        if (match) {
            const [, key, operator, rawValue] = match;
            let parsedValue = rawValue;
            
            // 尝试解析布尔值
            if (rawValue === 'true') parsedValue = true;
            else if (rawValue === 'false') parsedValue = false;
            // 尝试解析数字
            else if (!isNaN(parseFloat(rawValue)) && isFinite(rawValue)) {
                parsedValue = parseFloat(rawValue);
            }
            
            conditions[key] = { operator, value: parsedValue };
        }
    });
    
    return conditions;
}

/**
 * 获取参数当前值（自动识别类型）
 * @param {string} paramId - 参数ID
 * @returns {any}
 */
function getParamValue(paramId) {
    const element = document.getElementById(`param_${paramId}`);
    if (!element) return undefined;
    
    if (element.tagName === 'SELECT') {
        const rawValue = element.value;
        // 尝试推断类型
        if (rawValue === 'true') return true;
        if (rawValue === 'false') return false;
        if (!isNaN(parseFloat(rawValue)) && isFinite(rawValue)) {
            return parseFloat(rawValue);
        }
        return rawValue;
    } else if (element.type === 'number') {
        const num = parseFloat(element.value);
        return isNaN(num) ? 0 : num;
    } else {
        return element.value;
    }
}

/**
 * 评估单个条件
 * @param {any} actualValue - 实际值
 * @param {Object} condition - { operator, value }
 * @returns {boolean}
 */
function evaluateCondition(actualValue, condition) {
    const { operator, value } = condition;
    
    switch (operator) {
        case '=':
        case '==':
            return actualValue == value;  // 宽松比较，处理类型差异
        case '>':
            return actualValue > value;
        case '<':
            return actualValue < value;
        case '>=':
            return actualValue >= value;
        case '<=':
            return actualValue <= value;
        default:
            return actualValue == value;
    }
}

/**
 * 检查目标元素是否应该显示
 * @param {HTMLElement} element - 带 data-condition 属性的元素
 * @returns {boolean}
 */
function shouldShowElement(element) {
    const conditionAttr = element.getAttribute('data-condition');
    if (!conditionAttr) return true;
    
    const conditions = parseCondition(conditionAttr);
    
    for (const [paramId, condition] of Object.entries(conditions)) {
        const currentValue = getParamValue(paramId);
        if (!evaluateCondition(currentValue, condition)) {
            return false;
        }
    }
    
    return true;
}

/**
 * 更新单个元素的可见性
 * @param {HTMLElement} element
 */
function updateElementVisibility(element) {
    const shouldBeVisible = shouldShowElement(element);
    element.style.display = shouldBeVisible ? '' : 'none';
}

/**
 * 获取元素依赖的参数ID列表
 * @param {HTMLElement} element
 * @returns {string[]}
 */
function getDependencies(element) {
    const conditionAttr = element.getAttribute('data-condition');
    if (!conditionAttr) return [];
    
    // 提取所有参数名（字母数字下划线开头，后跟运算符）
    const regex = /(\w+)(?==|>|<|>=|<=)/g;
    const matches = [...conditionAttr.matchAll(regex)];
    return [...new Set(matches.map(m => m[1]))];
}

/**
 * 为容器内的所有条件元素绑定监听器
 * @param {HTMLElement} container - 容器元素
 */
function bindListeners(container) {
    const conditionalElements = container.querySelectorAll('[data-condition]');
    if (conditionalElements.length === 0) return;
    
    // 收集所有需要监听的参数ID
    const allDependencies = new Set();
    conditionalElements.forEach(element => {
        const deps = getDependencies(element);
        deps.forEach(dep => allDependencies.add(dep));
    });
    
    // 为每个依赖参数绑定事件
    allDependencies.forEach(paramId => {
        const input = document.getElementById(`param_${paramId}`);
        if (!input) return;
        
        // 避免重复绑定
        if (activeListeners.has(input)) return;
        
        // 创建更新函数：更新所有依赖此参数的条件元素
        const updateHandler = () => {
            const dependents = container.querySelectorAll(`[data-condition*="${paramId}"]`);
            dependents.forEach(dep => updateElementVisibility(dep));
        };
        
        input.addEventListener('change', updateHandler);
        input.addEventListener('input', updateHandler);
        
        activeListeners.set(input, updateHandler);
    });
}

/**
 * 初始化条件管理器
 * @param {HTMLElement} container - 容器元素，默认为 document
 */
export function initConditionManager(container = document) {
    if (!container) return;
    
    // 只处理容器内的条件元素
    const conditionalElements = container.querySelectorAll('[data-condition]');
    if (conditionalElements.length === 0) return;
    
    // 绑定监听器
    bindListeners(container);
    
    // 立即应用当前状态
    conditionalElements.forEach(element => {
        updateElementVisibility(element);
    });
}

/**
 * 刷新指定容器内的所有条件显示（用于子场景切换后）
 * @param {HTMLElement} container - 容器元素
 */
export function refreshConditionManager(container = document) {
    if (!container) return;
    
    const conditionalElements = container.querySelectorAll('[data-condition]');
    conditionalElements.forEach(element => {
        updateElementVisibility(element);
    });
}

/**
 * 清理指定容器内的所有监听器（用于模块切换时避免内存泄漏）
 * @param {HTMLElement} container - 容器元素
 */
export function cleanupConditionManager(container = document) {
    if (!container) return;
    
    // 获取容器内的所有条件元素
    const conditionalElements = container.querySelectorAll('[data-condition]');
    if (conditionalElements.length === 0) return;
    
    // 收集需要清理的参数ID
    const allDependencies = new Set();
    conditionalElements.forEach(element => {
        const deps = getDependencies(element);
        deps.forEach(dep => allDependencies.add(dep));
    });
    
    // 移除事件监听
    allDependencies.forEach(paramId => {
        const input = document.getElementById(`param_${paramId}`);
        if (input && activeListeners.has(input)) {
            const handler = activeListeners.get(input);
            input.removeEventListener('change', handler);
            input.removeEventListener('input', handler);
            activeListeners.delete(input);
        }
    });
}