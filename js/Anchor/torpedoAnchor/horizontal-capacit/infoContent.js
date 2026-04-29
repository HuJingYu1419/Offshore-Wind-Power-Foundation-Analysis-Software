/**
 * @filepath: js/Anchor/torpedoAnchor/horizontal-capacity/infoContent.js
 * @description: 鱼雷锚水平承载力模块信息展示（占位）
 */

export function getInfoContent() {
    return `
        <div class="space-y-4">
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-code-branch"></i>
                    <span>开发状态</span>
                </div>
                <div class="module-info-text">
                    <p>水平承载力计算模块正在开发中。</p>
                    <p class="mt-2 text-sm text-blue-600">预计算法：基于极限平衡法或p-y曲线法</p>
                </div>
            </div>
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-flask"></i>
                    <span>参考公式（待定）</span>
                </div>
                <div class="module-info-text">
                    <p class="font-mono text-sm bg-gray-100 p-2 rounded text-center">
                        H<sub>u</sub> = N<sub>p</sub> × S<sub>u</sub> × D × L<sub>e</sub>
                    </p>
                    <p class="text-xs text-gray-500 mt-1">N<sub>p</sub> 为水平承载力系数，通常取 8~12</p>
                </div>
            </div>
        </div>
    `;
}