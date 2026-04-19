/**
 * @filepath: js/Anchor/suctionAnchor/installation-clay/infoContent.js
 * @description: 吸力锚 - 安装计算（黏土）信息展示
 */

export function getInfoContent() {
    return `
        <div class="module-info-card">
            <div class="module-info-title">
                <i class="fas fa-info-circle"></i>
                <span>吸力锚安装计算（黏土）</span>
            </div>
            <div class="module-info-text">
                <p>模块开发中，待实现：</p>
                <ul class="list-disc list-inside text-sm mt-2">
                    <li>安装阻力计算（端阻力 + 侧摩阻力）</li>
                    <li>负压沉贯分析</li>
                    <li>土塞效应评估</li>
                </ul>
            </div>
        </div>
    `;
}