/**
 * @filepath: js/Anchor/torpedoAnchor/horizontal-capacity/infoContent.js
 * @description: 鱼雷锚水平承载力模块信息展示内容
 *              包含理论来源、核心公式、适用范围与假设
 */

export function getInfoContent() {
    return `
        <div class="space-y-4">
            <!-- ========== 第1部分：理论来源 ========== -->
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-book-open"></i>
                    <span>理论来源</span>
                </div>
                <div class="module-info-text">
                    <p class="mb-2"><strong>规范依据：</strong></p>
                    <p class="mb-3 text-sm">ABS (2017). <em>Guidance Notes on Dynamically Installed Piles</em>. American Bureau of Shipping, Houston.</p>
                    <p class="mb-3 text-sm">API RP 2A-WSD (2005). <em>Recommended Practice for Planning, Designing and Constructing Fixed Offshore Platforms—Working Stress Design</em>. American Petroleum Institute, Washington, D.C.（Section 6.8）</p>
                    
                    <p class="mb-2"><strong>参考文献：</strong></p>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        <li>O'Loughlin, C. D., & Randolph, M. F. (2004). <em>Installation and pullout of dynamically embedded anchors in clay</em>. Proceedings of the 14th International Offshore and Polar Engineering Conference, Toulon, 506-513.</li>
                        <li>API RP 2GEO (2014). <em>Geotechnical and Foundation Design Considerations</em>. American Petroleum Institute, Washington, D.C.</li>
                    </ul>
                    <p class="mt-2 text-xs text-gray-500">※ 本模块基于塑性极限分析方法（N<sub>c</sub> = 9.0 为黏土中圆柱体水平承载力系数）</p>
                </div>
            </div>

            <!-- ========== 第2部分：核心公式 ========== -->
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-calculator"></i>
                    <span>核心公式</span>
                </div>
                <div class="module-info-text">
                    <p class="mb-2 text-sm text-gray-600">水平极限承载力基于塑性极限分析，采用API推荐的水平承载力系数：</p>
                    <div class="bg-gray-100 p-3 rounded font-mono text-sm text-center my-3">
                        F<sub>h</sub> = N<sub>c</sub> × S<sub>ur</sub> × A<sub>s,h</sub>
                    </div>
                    <ul class="list-disc list-inside space-y-2 text-sm">
                        <li><strong>N<sub>c</sub></strong> — 水平承载力系数，取 9.0（适用范围 8~12）</li>
                        <li><strong>S<sub>ur</sub></strong> — 锚体埋深范围内的平均不排水抗剪强度（kPa）</li>
                        <li><strong>A<sub>s,h</sub></strong> — 水平投影面积（m²）= D × L（锚体直径 × 锚长）</li>
                    </ul>
                    <p class="mt-2 text-xs text-gray-500">※ 公式假定锚体为完全刚性体，且破坏模式为土体全流动破坏</p>
                </div>
            </div>

            <!-- ========== 第3部分：适用范围与计算假设 ========== -->
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>适用范围与计算假设</span>
                </div>
                <div class="module-info-text">
                    <p class="font-medium text-ocean-700 mb-2">✅ 适用范围</p>
                    <ul class="list-disc list-inside space-y-1 text-sm mb-3">
                        <li>适用于饱和黏土中的静态水平加载</li>
                        <li>埋深足够深（确保非浅层破坏模式，建议埋深 ≥ 3倍锚径）</li>
                        <li>适用于海洋工程中鱼雷锚的水平承载评估</li>
                    </ul>
                    
                    <p class="font-medium text-ocean-700 mb-2">⚠️ 计算假设与局限性</p>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        <li>保守设计：忽略锚翼水平投影面积的贡献</li>
                        <li>不适用于循环加载（需进行循环强度折减修正）</li>
                        <li>浅层埋深时公式可能高估承载力</li>
                        <li>仅适用于黏土地基，砂土中不适用（需采用不同的计算方法）</li>
                        <li>假定土体为均质或线性强度增长，未考虑土层成层性</li>
                    </ul>
                </div>
            </div>

            <!-- ========== 第4部分：其他补充 ========== -->
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-info-circle"></i>
                    <span>其他说明</span>
                </div>
                <div class="module-info-text">
                    <p class="text-sm">本模块提供的水平承载力计算结果为极限承载力（单位：kN）。实际设计中建议：</p>
                    <ul class="list-disc list-inside space-y-1 text-sm mt-2">
                        <li>采用安全系数 FS = 2.0~3.0 获得容许承载力</li>
                        <li>对于循环加载工况，建议参考 DNVGL-RP-C212 进行循环强度折减</li>
                        <li>复杂海况下建议结合数值模拟验证</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}