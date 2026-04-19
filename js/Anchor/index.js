/**
 * @filepath: js/Anchor/index.js
 * @description: 锚固件模块注册表 - 所有6个锚固件已完整迁移
 */

import * as torpedoModule from './torpedoAnchor/index.js';
import * as plateModule from './plateAnchor/index.js';
import * as pileModule from './pileAnchor/index.js';
import * as gravityModule from './gravityAnchor/index.js';
import * as dragModule from './dragAnchor/index.js';
import * as suctionModule from './suctionAnchor/index.js';

export const anchorModules = {
    torpedo: torpedoModule,
    plate: plateModule,
    pile: pileModule,
    gravity: gravityModule,
    drag: dragModule,
    suction: suctionModule
};

export function getAnchorModule(anchorId) {
    const module = anchorModules[anchorId];
    if (!module) {
        console.warn(`未找到锚固件模块: ${anchorId}`);
        return {
            id: anchorId,
            name: anchorId,
            description: '未知模块',
            parameters: [],
            calculate: () => ({ value: 0, unit: 'kN', text: '模块未找到' }),
            validate: () => ({ errors: [], warnings: [], infos: [], isValid: true }),
            render: () => `<div class="text-center py-8 text-ocean-400">模块 ${anchorId} 未找到</div>`,
            getInfoContent: () => `<div class="text-center py-8 text-ocean-400">模块信息未找到</div>`
        };
    }
    return module;
}

// 导出吸力锚的子场景相关函数（供 main.js 使用）
export { getSubScenarioList, setCurrentScenario, getCurrentSubModule, defaultScenario } from './suctionAnchor/index.js';