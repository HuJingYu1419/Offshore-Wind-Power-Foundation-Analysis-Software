/**
 * @filepath: js/Anchor/torpedoAnchor/index.js
 * @description: 鱼雷锚模块入口，支持3个子场景切换
 *               子场景：竖向承载力、水平承载力、安装贯入深度预测
 */

// ========== 子场景1：竖向承载力 ==========
import * as verticalConfig from './vertical-capacity/config.js';
import * as verticalCalc from './vertical-capacity/calculator.js';
import * as verticalValid from './vertical-capacity/validator.js';
import * as verticalRender from './vertical-capacity/renderer.js';
import * as verticalInfo from './vertical-capacity/infoContent.js';

// ========== 子场景2：水平承载力（占位） ==========
import * as horizontalConfig from './horizontal-capacity/config.js';
import * as horizontalCalc from './horizontal-capacity/calculator.js';
import * as horizontalValid from './horizontal-capacity/validator.js';
import * as horizontalRender from './horizontal-capacity/renderer.js';
import * as horizontalInfo from './horizontal-capacity/infoContent.js';

// ========== 子场景3：安装贯入深度预测（占位） ==========
import * as penetrationConfig from './penetration/config.js';
import * as penetrationCalc from './penetration/calculator.js';
import * as penetrationValid from './penetration/validator.js';
import * as penetrationRender from './penetration/renderer.js';
import * as penetrationInfo from './penetration/infoContent.js';

// ========== 子场景注册表 ==========
export const subScenarios = {
    'vertical-capacity': {
        id: verticalConfig.id,
        name: verticalConfig.name,
        description: verticalConfig.description,
        parameters: verticalConfig.parameters,
        calculate: verticalCalc.calculate,
        validate: verticalValid.validate,
        render: verticalRender.render,
        getInfoContent: verticalInfo.getInfoContent
    },
    'horizontal-capacity': {
        id: horizontalConfig.id,
        name: horizontalConfig.name,
        description: horizontalConfig.description,
        parameters: horizontalConfig.parameters,
        calculate: horizontalCalc.calculate,
        validate: horizontalValid.validate,
        render: horizontalRender.render,
        getInfoContent: horizontalInfo.getInfoContent
    },
    'penetration': {
        id: penetrationConfig.id,
        name: penetrationConfig.name,
        description: penetrationConfig.description,
        parameters: penetrationConfig.parameters,
        calculate: penetrationCalc.calculate,
        validate: penetrationValid.validate,
        render: penetrationRender.render,
        getInfoContent: penetrationInfo.getInfoContent
    }
};

// 默认子场景（竖向承载力）
export const defaultScenario = 'vertical-capacity';

// 当前激活的子场景
let currentScenario = defaultScenario;

/**
 * 设置当前子场景
 * @param {string} scenarioId - 子场景ID
 * @returns {boolean} 是否设置成功
 */
export function setCurrentScenario(scenarioId) {
    if (subScenarios[scenarioId]) {
        currentScenario = scenarioId;
        return true;
    }
    return false;
}

/**
 * 获取当前子场景ID
 * @returns {string}
 */
export function getCurrentScenario() {
    return currentScenario;
}

/**
 * 获取当前激活的子场景模块对象
 * @returns {Object}
 */
export function getCurrentSubModule() {
    return subScenarios[currentScenario] || subScenarios[defaultScenario];
}

/**
 * 获取子场景列表（用于渲染切换器UI）
 * @returns {Array}
 */
export function getSubScenarioList() {
    return [
        { id: 'vertical-capacity', name: '竖向承载力计算', icon: '📊' },
        { id: 'horizontal-capacity', name: '水平承载力计算', icon: '↔️' },
        { id: 'penetration', name: '安装贯入深度预测', icon: '📉' }
    ];
}

// ========== 以下是模块统一导出接口（供 Anchor/index.js 使用） ==========

export const id = 'torpedo';

export const name = '鱼雷锚';

export const description = '鱼雷锚分析计算（竖向承载力、水平承载力、安装贯入深度）';

export function parameters() {
    return getCurrentSubModule().parameters;
}

export function calculate(params) {
    return getCurrentSubModule().calculate(params);
}

export function validate(params) {
    return getCurrentSubModule().validate(params);
}

export function render(result, formulaModule, params, validation) {
    // 注意：formulaModule 参数会被覆盖为当前子场景模块
    return getCurrentSubModule().render(result, getCurrentSubModule(), params, validation);
}

export function getInfoContent() {
    return getCurrentSubModule().getInfoContent();
}