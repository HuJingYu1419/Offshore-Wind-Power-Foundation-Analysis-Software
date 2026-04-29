// js/main.js
/**
 * @filepath: js/main.js
 * @description: 海洋岩土工程计算工具主入口模块，负责模块路由、事件绑定、初始化逻辑
 * @migration: 已适配新架构，从 Anchor/index.js 获取锚固件模块
 */

// 导入原有公式模块
import { bearing } from './bearing/bearing.js';
import { settlement } from './settlement/settlement.js';
import { wave } from './wave/wave.js';
import { slope } from './slope/slope.js';

// 导入新架构锚固件注册表
import { getAnchorModule } from './Anchor/index.js';

// 导入工具函数
import { generateStandardForm, generateGroupedForm, getParameterValues, resetFormToDefaults } from './utils/formGenerator.js';
import { renderResult } from './utils/resultRenderer.js';
import { validateModule, renderValidationOnly } from './utils/validator.js';

import { getSubScenarioList, setCurrentScenario, getCurrentSubModule, defaultScenario } from './Anchor/index.js';

// 子场景切换器变量
let currentSuctionScenario = defaultScenario;
let subScenarioSelectorHtml = '';

import { 
    getSubScenarioList as getTorpedoSubScenarioList, 
    setCurrentScenario as setTorpedoCurrentScenario, 
    getCurrentSubModule as getTorpedoCurrentSubModule,
    defaultScenario as torpedoDefaultScenario 
} from './Anchor/torpedoAnchor/index.js';

/**
 * 生成吸力锚子场景切换器的HTML
 */
function generateSubScenarioSelector() {
    const scenarios = getSubScenarioList();
    return `
        <div class="mb-4 bg-ocean-50 rounded-lg p-3">
            <div class="text-sm font-medium text-ocean-700 mb-2">📌 子场景选择</div>
            <div class="flex flex-wrap gap-2">
                ${scenarios.map(scenario => `
                    <button 
                        class="sub-scenario-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                            ${currentSuctionScenario === scenario.id 
                                ? 'bg-ocean-600 text-white shadow-md' 
                                : 'bg-white text-ocean-600 border border-ocean-300 hover:bg-ocean-50'}"
                        data-scenario="${scenario.id}"
                    >
                        ${scenario.icon || '📌'} ${scenario.name}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * 绑定吸力锚子场景切换事件
 */
function bindSubScenarioButtons() {
    const btns = document.querySelectorAll('.sub-scenario-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const scenarioId = btn.getAttribute('data-scenario');
            if (scenarioId && scenarioId !== currentSuctionScenario) {
                currentSuctionScenario = scenarioId;
                setCurrentScenario(scenarioId);
                // 重新加载当前模块（吸力锚）
                selectModule('suction');
            }
        });
    });
}

// 鱼雷锚子场景相关变量
let currentTorpedoScenario = torpedoDefaultScenario;

function generateTorpedoSubScenarioSelector() {
    const scenarios = getTorpedoSubScenarioList();
    return `
        <div class="mb-4 bg-ocean-50 rounded-lg p-3">
            <div class="text-sm font-medium text-ocean-700 mb-2">⚓ 子场景选择（鱼雷锚）</div>
            <div class="flex flex-wrap gap-2">
                ${scenarios.map(scenario => `
                    <button 
                        class="torpedo-sub-scenario-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                            ${currentTorpedoScenario === scenario.id 
                                ? 'bg-ocean-600 text-white shadow-md' 
                                : 'bg-white text-ocean-600 border border-ocean-300 hover:bg-ocean-50'}"
                        data-torpedo-scenario="${scenario.id}"
                    >
                        ${scenario.icon || '📌'} ${scenario.name}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function bindTorpedoSubScenarioButtons() {
    const btns = document.querySelectorAll('.torpedo-sub-scenario-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const scenarioId = btn.getAttribute('data-torpedo-scenario');
            if (scenarioId && scenarioId !== currentTorpedoScenario) {
                currentTorpedoScenario = scenarioId;
                setTorpedoCurrentScenario(scenarioId);
                // 重新加载鱼雷锚模块
                selectModule('torpedo');
            }
        });
    });
}

/**
 * 获取模块（兼容旧模块和锚固件模块）
 */
function getModule(moduleId) {
    // 原有公式模块
    const legacyModules = {
        bearing,
        settlement,
        wave,
        slope
    };
    
    if (legacyModules[moduleId]) {
        return legacyModules[moduleId];
    }
    
    // 锚固件模块（从新架构获取）
    const anchorIds = ['gravity', 'torpedo', 'plate', 'pile', 'drag', 'suction'];
    if (anchorIds.includes(moduleId)) {
        return getAnchorModule(moduleId);
    }
    
    return null;
}

// 模块映射表（延迟获取）
const modules = {
    bearing: () => getModule('bearing'),
    settlement: () => getModule('settlement'),
    wave: () => getModule('wave'),
    slope: () => getModule('slope'),
    gravity: () => getModule('gravity'),
    torpedo: () => getModule('torpedo'),
    plate: () => getModule('plate'),
    pile: () => getModule('pile'),
    drag: () => getModule('drag'),
    suction: () => getModule('suction')
};

// 当前选中的模块
let currentModule = null;

// 下拉菜单状态
let isDropdownOpen = false;

/**
 * 清空输出区，显示初始提示
 */
function clearResultSection() {
    const resultSection = document.getElementById('resultSection');
    if (resultSection) {
        resultSection.innerHTML = `
            <div class="text-center py-10 text-ocean-400">
                <i class="fas fa-calculator text-3xl mb-3"></i>
                <p>计算结果将显示在这里</p>
                <p class="text-sm mt-2">请先输入参数后点击"计算"</p>
            </div>
        `;
    }
}

/**
 * 重置输入参数到默认值
 */
function resetParameters() {
    if (!currentModule) return;
    resetFormToDefaults(currentModule);
}

/**
 * 关闭下拉菜单
 */
function closeDropdown() {
    const dropdownMenu = document.getElementById('anchorDropdownMenu');
    const dropdownIcon = document.getElementById('dropdownIcon');
    
    if (dropdownMenu) {
        dropdownMenu.classList.add('hidden');
        isDropdownOpen = false;
    }
    if (dropdownIcon) {
        dropdownIcon.style.transform = 'rotate(0deg)';
    }
}

/**
 * 选择公式模块
 */
function selectModule(moduleId) {
    const moduleGetter = modules[moduleId];
    if (!moduleGetter) {
        console.warn(`模块 ${moduleId} 未找到`);
        return;
    }
    
    currentModule = moduleGetter();
    if (!currentModule) {
        console.warn(`模块 ${moduleId} 加载失败`);
        return;
    }

        // 特殊处理：吸力锚需要插入子场景切换器
    if (moduleId === 'suction') {
        // 确保吸力锚使用正确的子场景
        const suctionSubModule = getCurrentSubModule();
        currentModule = suctionSubModule;
        
        // 生成表单
        let formHtml = generateGroupedForm(currentModule);
        
        // 在表单顶部插入子场景切换器
        const selectorHtml = generateSubScenarioSelector();
        formHtml = selectorHtml + formHtml;
        
        document.getElementById('parameterForm').innerHTML = formHtml;
        
        // 绑定子场景切换按钮
        bindSubScenarioButtons();
        
        // 更新信息展示区
        updateModuleInfo(currentModule);
        
        // 清空输出区
        clearResultSection();
        
        // 关闭下拉菜单
        closeDropdown();
        return;
    }

    // 特殊处理：鱼雷锚也需要子场景切换器
    if (moduleId === 'torpedo') {
        // 确保鱼雷锚使用正确的子场景
        const torpedoSubModule = getCurrentSubModule();  // 需要从 torpedoAnchor/index.js 导入
        currentModule = torpedoSubModule;
        
        // 生成表单
        let formHtml = generateGroupedForm(currentModule);
        
        // 在表单顶部插入子场景切换器
        const selectorHtml = generateTorpedoSubScenarioSelector();  // 类似吸力锚的实现
        formHtml = selectorHtml + formHtml;
        
        document.getElementById('parameterForm').innerHTML = formHtml;
        
        // 绑定子场景切换按钮
        bindTorpedoSubScenarioButtons();
        
        // 更新信息展示区
        updateModuleInfo(currentModule);
        
        // 清空输出区
        clearResultSection();
        
        // 关闭下拉菜单
        closeDropdown();
        return;
    }
    
    // 调试输出
    console.log(`已选择模块: ${moduleId}`, currentModule);
    
    let formHtml;
    // 锚固件模块使用分组表单，其他使用标准表单
    if (moduleId === 'gravity' || moduleId === 'suction' || moduleId === 'torpedo' || 
        moduleId === 'plate' || moduleId === 'drag' || moduleId === 'pile') {
        formHtml = generateGroupedForm(currentModule);
    } else {
        formHtml = generateStandardForm(currentModule);
    }
    
    const parameterForm = document.getElementById('parameterForm');
    if (parameterForm) {
        parameterForm.innerHTML = formHtml;
    }
    
    // 更新模块信息展示区
    updateModuleInfo(currentModule);
    
    // 切换模块时清空输出区
    clearResultSection();
    
    // 关闭下拉菜单
    closeDropdown();
}

/**
 * 执行计算（集成校验）
 */
function calculate() {
    if (!currentModule) {
        alert("请先选择一个计算公式");
        return;
    }
    
    const params = getParameterValues(currentModule);
    
    const validation = validateModule(currentModule, params);
    
    if (!validation.isValid) {
        renderValidationOnly(validation, currentModule);
        return;
    }
    
    const result = currentModule.calculate(params);
    renderResult(result, currentModule, params, validation);
}

/**
 * 绑定公式选择卡片点击事件
 */
function bindFormulaCards() {
    const cards = document.querySelectorAll('[data-formula]');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const formulaId = card.getAttribute('data-formula');
            selectModule(formulaId);
        });
    });
}

/**
 * 绑定锚固件下拉菜单
 */
function bindAnchorDropdown() {
    const dropdownBtn = document.getElementById('anchorDropdownBtn');
    const dropdownMenu = document.getElementById('anchorDropdownMenu');
    const dropdownIcon = document.getElementById('dropdownIcon');
    
    if (!dropdownBtn) return;
    
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isDropdownOpen = !isDropdownOpen;
        
        if (isDropdownOpen) {
            dropdownMenu.classList.remove('hidden');
            dropdownIcon.style.transform = 'rotate(180deg)';
        } else {
            dropdownMenu.classList.add('hidden');
            dropdownIcon.style.transform = 'rotate(0deg)';
        }
    });
    
    const menuItems = document.querySelectorAll('.anchor-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const anchorId = item.getAttribute('data-anchor');
            selectModule(anchorId);
            
            const anchorName = item.querySelector('span').textContent;
            const btnTitle = dropdownBtn.querySelector('h3');
            if (btnTitle) btnTitle.textContent = anchorName;
            
            closeDropdown();
        });
    });
}

/**
 * 点击页面其他区域关闭下拉菜单
 */
function bindClickOutside() {
    document.addEventListener('click', (e) => {
        const dropdownBtn = document.getElementById('anchorDropdownBtn');
        const dropdownMenu = document.getElementById('anchorDropdownMenu');
        
        if (dropdownBtn && dropdownMenu && !dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            closeDropdown();
        }
    });
}

/**
 * 折叠/展开模块信息区
 */
function bindModuleInfoToggle() {
    const toggleBtn = document.getElementById('moduleInfoToggle');
    const infoContent = document.getElementById('moduleInfoContent');
    const infoIcon = document.getElementById('moduleInfoIcon');
    
    if (!toggleBtn || !infoContent || !infoIcon) return;
    
    infoIcon.style.transform = 'rotate(0deg)';
    
    toggleBtn.addEventListener('click', () => {
        const isCollapsed = infoContent.classList.contains('collapsed');
        
        if (isCollapsed) {
            infoContent.classList.remove('collapsed');
            infoIcon.style.transform = 'rotate(0deg)';
        } else {
            infoContent.classList.add('collapsed');
            infoIcon.style.transform = 'rotate(180deg)';
        }
    });
}

/**
 * 更新模块信息展示区内容
 */
function updateModuleInfo(formulaModule) {
    const moduleNameBadge = document.getElementById('moduleNameBadge');
    const infoPlaceholder = document.getElementById('moduleInfoPlaceholder');
    const infoDynamic = document.getElementById('moduleInfoDynamic');
    
    if (!moduleNameBadge) return;
    
    if (formulaModule && formulaModule.name) {
        moduleNameBadge.textContent = formulaModule.name;
        moduleNameBadge.classList.remove('bg-ocean-200', 'text-ocean-700');
        moduleNameBadge.classList.add('bg-ocean-500', 'text-white');
    } else {
        moduleNameBadge.textContent = '未选择';
        moduleNameBadge.classList.remove('bg-ocean-500', 'text-white');
        moduleNameBadge.classList.add('bg-ocean-200', 'text-ocean-700');
    }
    
    const hasModuleInfo = formulaModule && typeof formulaModule.getInfoContent === 'function';
    
    if (hasModuleInfo && infoPlaceholder && infoDynamic) {
        infoPlaceholder.classList.add('hidden');
        infoDynamic.classList.remove('hidden');
        infoDynamic.innerHTML = formulaModule.getInfoContent();
        
        if (window.MathJax) {
            MathJax.typesetPromise([infoDynamic]).catch(err => {
                console.warn('MathJax 渲染失败:', err);
            });
        }
    } else if (infoPlaceholder && infoDynamic) {
        infoPlaceholder.classList.remove('hidden');
        infoDynamic.classList.add('hidden');
        infoDynamic.innerHTML = '';
    }
}

/**
 * 绑定计算按钮和重置按钮事件
 */
function bindActionButtons() {
    const calculateBtn = document.getElementById('calculateBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculate);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetParameters);
    }
}

/**
 * 页面初始化
 */
function init() {
    console.log('页面初始化开始...');
    
    bindFormulaCards();
    bindAnchorDropdown();
    bindClickOutside();
    bindModuleInfoToggle();
    bindActionButtons();
    
    console.log('页面初始化完成');
}

// 等待DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', init);