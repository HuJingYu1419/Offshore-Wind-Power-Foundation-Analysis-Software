/**
 * @filepath: js/Anchor/torpedoAnchor/horizontal-capacity/infoContent.js
 * @description: 鱼雷锚水平承载力模块信息展示内容
 *              包含规范依据、计算公式、适用范围和局限性说明
 */

export function getInfoContent() {
    return `
        <div class="space-y-4">
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-book-open"></i>
                    <span>规范依据与理论来源</span>
                </div>
                <div class="module-info-text">
                    <p class="mb-2">依据规范：<strong>ABS Guidance Notes on Dynamically Installed Piles (2017)</strong></p>
                    <p class="mb-2">核心公式 Section 3.5.3, Eq.(4)：</p>
                    <div class="bg-gray-100 p-2 rounded font-mono text-sm text-center my-2">
                        F<sub>h</sub> = N<sub>c</sub> × S<sub>u</sub> × A<sub>s,h</sub>
                    </div>
                    <p>其中：</p>
                    <ul class="list-disc list-inside space-y-1 text-sm mt-2">
                        <li><strong>F<sub>h</sub></strong> — 水平极限承载力 (kN)</li>
                        <li><strong>N<sub>c</sub></strong> — 水平承载力系数，推荐 9.0 (范围 8~12)</li>
                        <li><strong>S<sub>u</sub></strong> — 土体不排水抗剪强度 (kPa)</li>
                        <li><strong>A<sub>s,h</sub></strong> — 水平投影面积 = D × L (m²)</li>
                    </ul>
                    <p class="mt-2 text-xs text-gray-500">※ API RP 2A (2005) 第6.8节亦有相同规定</p>
                </div>
            </div>

            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>适用范围与局限性</span>
                </div>
                <div class="module-info-text">
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        <li>✅ 适用于饱和黏土中的静态水平加载</li>
                        <li>✅ 埋深足够深（非浅层破坏模式）</li>
                        <li>⚠️ 保守设计：忽略翼板水平投影面积贡献</li>
                        <li>⚠️ 不适用于循环加载（需进行循环修正）</li>
                        <li>⚠️ 浅层埋深时公式可能不适用</li>
                        <li>⚠️ 砂土中不适用（需使用不同方法）</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}