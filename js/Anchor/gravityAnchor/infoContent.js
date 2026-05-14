/**
 * @filepath: js/Anchor/gravityAnchor/infoContent.js
 * @description: 重力锚模块信息展示内容
 *              包含理论来源、核心公式、适用范围与假设、结构示意图及案例参数
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
                    <p class="mb-2"><strong>核心参考文献：</strong></p>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        <li>黄博晓. 深海重力锚在黏土中水平承载及抗拔性能的模型试验研究[D]. 天津大学, 2021. DOI: 10.27356/d.cnki.gtjdu.2021.000943.</li>
                        <li>Gourvenec, S., & Barnett, S. (2011). <em>Undrained failure envelope for skirted foundations under general loading</em>. Géotechnique, 61(3), 263-270.</li>
                    </ul>
                    <p class="mt-2 mb-2"><strong>参考规范：</strong></p>
                    <ul class="list-disc list-inside text-sm">
                        <li>DNVGL-RP-E303 (2017). <em>Geotechnical Design of Suction Anchors in Clay</em>. Det Norske Veritas, Oslo.</li>
                        <li>API RP 2GEO (2014). <em>Geotechnical and Foundation Design Considerations</em>. American Petroleum Institute, Washington, D.C.</li>
                    </ul>
                    <p class="mt-2 text-xs text-gray-500">※ 本模块基于黏土不排水分析框架开发，适用于深海重力锚基础设计</p>
                </div>
            </div>

            <!-- ========== 第2部分：核心公式 ========== -->
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-calculator"></i>
                    <span>核心公式</span>
                </div>
                <div class="module-info-text">
                    <p class="mb-2 text-sm text-gray-600">重力锚承载力由水平承载力、上拔力和防倾覆稳定性三方面控制：</p>
                    
                    <p class="font-semibold text-ocean-700 mt-3 mb-1">📌 水平承载力（带裙板）</p>
                    <div class="bg-gray-100 p-2 rounded font-mono text-sm overflow-x-auto my-2">
                        F<sub>h</sub> = s<sub>u</sub>(z)·A<sub>b</sub> + [2·s<sub>ua</sub>·z<sub>s</sub> + γ'·0.5·z<sub>s</sub>²]·B
                    </div>
                    <p class="text-xs text-gray-500 mt-1">式中：s<sub>u</sub>(z)—锚底部不排水抗剪强度，A<sub>b</sub>—锚底面积，z<sub>s</sub>—裙板贯入深度</p>
                    
                    <p class="font-semibold text-ocean-700 mt-3 mb-1">📌 上拔力（黏土不排水）</p>
                    <div class="bg-gray-100 p-2 rounded font-mono text-sm overflow-x-auto my-2">
                        V<sub>e</sub> = F·(N<sub>c</sub>·s<sub>u0</sub> + κ·B'/4)·K<sub>c</sub>·A'<br>
                        总上拔力 = V<sub>e</sub> + V<sub>s</sub> + W
                    </div>
                    <p class="text-xs text-gray-500 mt-1">式中：F—修正因子（与κB'/s<sub>u0</sub>相关），V<sub>s</sub>—侧向摩擦力，W—水中锚重量</p>
                    
                    <p class="font-semibold text-ocean-700 mt-3 mb-1">📌 防倾覆稳定性</p>
                    <div class="bg-gray-100 p-2 rounded font-mono text-sm overflow-x-auto my-2">
                        安全系数 = (W·L<sub>arm</sub>) / (T·A<sub>arm</sub>)
                    </div>
                    <p class="text-xs text-gray-500 mt-1">式中：L<sub>arm</sub>—抗倾覆力臂，A<sub>arm</sub>—倾覆力臂</p>

                    <p class="font-semibold text-ocean-700 mt-3 mb-1">📌 贯入阻力（黏土）</p>
                    <div class="bg-gray-100 p-2 rounded font-mono text-sm overflow-x-auto my-2">
                        Q<sub>tot</sub> = Q<sub>side</sub> + Q<sub>tip</sub> = α·s<sub>u</sub>(z)·A<sub>side</sub> + (N<sub>c</sub>·s<sub>u,tip</sub> + γ'·z)·A<sub>tip</sub>
                    </div>

                    <p class="font-semibold text-ocean-700 mt-3 mb-1">📌 塑性屈服包络线</p>
                    <div class="bg-gray-100 p-2 rounded font-mono text-sm overflow-x-auto my-2">
                        (H / H<sub>0</sub>)<sup>α</sup> + (V / V<sub>0</sub>)<sup>β</sup> = 1
                    </div>
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
                        <li>适用于饱和黏土地基中的重力锚（平底锚、带裙板锚）</li>
                        <li>适用于深海重力锚的静力承载力评估</li>
                        <li>适用于锚体放置于海床表面或浅埋状态</li>
                    </ul>
                    
                    <p class="font-medium text-ocean-700 mb-2">⚠️ 计算假设与局限性</p>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        <li>土体为饱和黏土，采用不排水抗剪强度分析框架（φ=0）</li>
                        <li>土体抗剪强度随深度线性增加：s<sub>u</sub>(z) = s<sub>u0</sub> + k·z</li>
                        <li>适用于正常固结或轻微超固结黏土</li>
                        <li>假定立即脱离条件，不考虑锚底吸力贡献</li>
                        <li>不适用于：砂土地基、循环加载、倾斜海床工况</li>
                        <li>裙板贯入深度建议不超过锚体高度的2/3</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}