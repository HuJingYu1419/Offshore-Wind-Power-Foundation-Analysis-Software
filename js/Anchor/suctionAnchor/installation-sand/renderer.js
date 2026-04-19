/**
 * @filepath: js/Anchor/suctionAnchor/installation-sand/renderer.js
 * @description: 吸力锚 - 安装计算（砂土）占位渲染
 */

import { renderResultHeader, renderDetailsCard, renderParameterSummary, renderValidationAlert } from '../../shared/baseRenderer.js';

export function render(result, formulaModule, params, validation = null) {
    let fullHtml = '';
    if (validation) fullHtml += renderValidationAlert(validation);
    fullHtml += renderResultHeader("安装计算（砂土）");
    fullHtml += renderDetailsCard('📊 计算结果', '<div class="text-center py-8 text-ocean-400">安装计算（砂土）模块开发中</div>');
    fullHtml += renderParameterSummary(formulaModule, params);
    return fullHtml;
}