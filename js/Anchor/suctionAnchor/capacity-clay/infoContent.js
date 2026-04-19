/**
 * @filepath: js/Anchor/suctionAnchor/capacity-clay/infoContent.js
 * @description: 吸力锚 - 承载力计算（黏土）信息展示
 */

export function getInfoContent() {
    return `
        <div class="module-info-card">
            <div class="module-info-title">
                <i class="fas fa-info-circle"></i>
                <span>吸力锚承载力计算（黏土）</span>
            </div>
            <div class="module-info-text">
                <p>模块开发中，待实现：</p>
                <ul class="list-disc list-inside text-sm mt-2">
                    <li>端阻力计算</li>
                    <li>侧摩阻力计算</li>
                    <li>反向承载力分析</li>
                </ul>
            </div>
        </div>
    `;
}