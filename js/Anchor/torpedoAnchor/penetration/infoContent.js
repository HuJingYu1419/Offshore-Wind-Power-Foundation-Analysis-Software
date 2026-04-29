/**
 * @filepath: js/Anchor/torpedoAnchor/penetration/infoContent.js
 * @description: 鱼雷锚安装贯入深度模块信息展示（占位）
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
                    <p>安装贯入深度预测模块正在开发中。</p>
                    <p class="mt-2 text-sm text-blue-600">预计算法：能量法 + 土体阻力模型（True或基于CPT）</p>
                </div>
            </div>
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-book"></i>
                    <span>参考理论</span>
                </div>
                <div class="module-info-text">
                    <p>鱼雷锚安装贯入过程满足能量守恒：</p>
                    <div class="bg-gray-100 p-2 rounded font-mono text-sm text-center my-2">
                        E<sub>k</sub> = ½mv² = ∫ R(z) dz
                    </div>
                    <p>其中 R(z) 为深度z处的总贯入阻力。</p>
                </div>
            </div>
        </div>
    `;
}