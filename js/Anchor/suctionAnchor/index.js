/**
 * @filepath: js/Anchor/suctionAnchor/index.js
 * @description: 吸力锚模块入口，支持3个子场景切换
 */

import * as installationClay from './installation-clay/config.js';
import * as installationClayCalc from './installation-clay/calculator.js';
import * as installationClayValid from './installation-clay/validator.js';
import * as installationClayRender from './installation-clay/renderer.js';
import * as installationClayInfo from './installation-clay/infoContent.js';

import * as installationSand from './installation-sand/config.js';
import * as installationSandCalc from './installation-sand/calculator.js';
import * as installationSandValid from './installation-sand/validator.js';
import * as installationSandRender from './installation-sand/renderer.js';
import * as installationSandInfo from './installation-sand/infoContent.js';

import * as capacityClay from './capacity-clay/config.js';
import * as capacityClayCalc from './capacity-clay/calculator.js';
import * as capacityClayValid from './capacity-clay/validator.js';
import * as capacityClayRender from './capacity-clay/renderer.js';
import * as capacityClayInfo from './capacity-clay/infoContent.js';

// 子场景注册表
export const subScenarios = {
    'installation-clay': {
        id: installationClay.id,
        name: installationClay.name,
        description: installationClay.description,
        parameters: installationClay.parameters,
        calculate: installationClayCalc.calculate,
        validate: installationClayValid.validate,
        render: installationClayRender.render,
        getInfoContent: installationClayInfo.getInfoContent
    },
    'installation-sand': {
        id: installationSand.id,
        name: installationSand.name,
        description: installationSand.description,
        parameters: installationSand.parameters,
        calculate: installationSandCalc.calculate,
        validate: installationSandValid.validate,
        render: installationSandRender.render,
        getInfoContent: installationSandInfo.getInfoContent
    },
    'capacity-clay': {
        id: capacityClay.id,
        name: capacityClay.name,
        description: capacityClay.description,
        parameters: capacityClay.parameters,
        calculate: capacityClayCalc.calculate,
        validate: capacityClayValid.validate,
        render: capacityClayRender.render,
        getInfoContent: capacityClayInfo.getInfoContent
    }
};

// 默认子场景
export const defaultScenario = 'installation-clay';

// 当前激活的子场景（将在 main.js 中设置）
let currentScenario = defaultScenario;

export function setCurrentScenario(scenarioId) {
    if (subScenarios[scenarioId]) {
        currentScenario = scenarioId;
        return true;
    }
    return false;
}

export function getCurrentScenario() {
    return currentScenario;
}

export function getCurrentSubModule() {
    return subScenarios[currentScenario] || subScenarios[defaultScenario];
}

// 获取子场景列表（用于渲染切换器UI）
export function getSubScenarioList() {
    return [
        { id: 'installation-clay', name: '安装计算（黏土）', icon: '🏜️' },
        { id: 'installation-sand', name: '安装计算（砂土）', icon: '🏖️' },
        { id: 'capacity-clay', name: '承载力计算（黏土）', icon: '⚡' }
    ];
}

// ========== 以下是模块统一导出接口（供 Anchor/index.js 使用） ==========

// 注意：吸力锚模块对外暴露的是当前激活的子场景
// 但为了兼容现有架构，需要提供统一的 id, name, parameters, calculate, validate, render, getInfoContent
// 这些会动态返回当前子场景的值

export const id = 'suction';

export const name = '吸力锚';

export const description = '吸力锚分析计算（含安装计算和承载力计算）';

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
    return getCurrentSubModule().render(result, getCurrentSubModule(), params, validation);
}

export function getInfoContent() {
    return getCurrentSubModule().getInfoContent();
}