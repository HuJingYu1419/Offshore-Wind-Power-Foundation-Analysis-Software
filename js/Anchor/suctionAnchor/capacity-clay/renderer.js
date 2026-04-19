/**
 * @filepath: js/Anchor/suctionAnchor/capacity-clay/renderer.js
 * @description: 吸力锚 - 承载力计算（黏土）占位渲染
 */

import { renderResultHeader, renderDetailsCard, renderParameterSummary, renderValidationAlert } from '../../shared/baseRenderer.js';

export function render(result, formulaModule, params, validation = null) {
    let fullHtml = '';
    if (validation) fullHtml += renderValidationAlert(validation);
    fullHtml += renderResultHeader("承载力计算（黏土）");
    fullHtml += renderDetailsCard('📊 计算结果', '<div class="text-center py-8 text-ocean-400">承载力计算（黏土）模块开发中</div>');
    fullHtml += renderParameterSummary(formulaModule, params);
    return fullHtml;
}