/**
 * @filepath: js/Anchor/pileAnchor/infoContent.js
 * @description: 桩锚模块信息展示内容
 *              包含理论来源、核心公式、适用范围与假设、示意图及验证图表
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
                        <li>黄挺, 罗成未, 焦澳, 戴国亮. 密实砂中刚性锚桩斜向抗拔承载特性[J]. 工业建筑, 2023, 53(03): 180-187. DOI: 10.13204/j.gyjzg22011905.</li>
                        <li>Zhang, L., Silva, F., & Grismala, R. (2005). Ultimate lateral resistance to piles in cohesionless soils. Journal of Geotechnical and Geoenvironmental Engineering, 131(1), 78-83.</li>
                        <li>Bang, S., & Cho, Y. (2005). Load-deflection response of suction piles in sand. Proceedings of the 15th International Offshore and Polar Engineering Conference, Seoul, 512-518.</li>
                    </ul>
                    <p class="mt-2 text-xs text-gray-500">※ 本模块基于刚性锚桩斜向抗拔破坏包络面理论开发</p>
                </div>
            </div>

            <!-- ========== 第2部分：核心公式 ========== -->
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-calculator"></i>
                    <span>核心公式</span>
                </div>
                <div class="module-info-text">
                    <p class="mb-2 text-sm text-gray-600">刚性锚桩斜向抗拔承载力采用破坏包络面模型，极限承载力由竖向分量和水平分量耦合确定：</p>
                    
                    <p class="font-semibold text-ocean-700 mt-3 mb-1">📌 竖向极限承载力 V<sub>u</sub></p>
                    <div class="bg-gray-100 p-2 rounded font-mono text-sm overflow-x-auto my-2">
                        <span class="text-xs text-gray-500">// δ ≤ 26°</span><br>
                        V<sub>u</sub> = G + (πD/2)·L²·K₀·tanδ<br><br>
                        <span class="text-xs text-gray-500">// 26° &lt; δ &lt; 39°</span><br>
                        V<sub>u</sub> = V<sub>vermeer</sub> + (1-m)·V<sub>interface</sub><br><br>
                        <span class="text-xs text-gray-500">// δ ≥ 39°</span><br>
                        V<sub>u</sub> = (1 + 2·(L·D/A<sub>b</sub>)·tanφ·cosφ'<sub>crit</sub>)·A<sub>b</sub>·γ·L
                    </div>

                    <p class="font-semibold text-ocean-700 mt-3 mb-1">📌 水平极限承载力 H<sub>u</sub></p>
                    <div class="bg-gray-100 p-2 rounded font-mono text-sm overflow-x-auto my-2">
                        H<sub>u</sub> = 0.3·(η·K<sub>p</sub>² + ξ·K·tanδ)·γ·a·D·(2.7a - 1.7L)
                    </div>

                    <p class="font-semibold text-ocean-700 mt-3 mb-1">📌 破坏包络面方程</p>
                    <div class="bg-gray-100 p-2 rounded font-mono text-sm overflow-x-auto my-2">
                        (H / H<sub>u</sub>)<sup>α</sup> + (V / V<sub>u</sub>)<sup>β</sup> = 1
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
                        <li>适用于密实砂土中的刚性锚桩（长径比 L/D ≤ 6）</li>
                        <li>适用于斜向抗拔加载工况（加载角 0° ~ 90°）</li>
                        <li>已通过Bang等开展的砂土中刚性短桩试验验证</li>
                    </ul>
                    
                    <p class="font-medium text-ocean-700 mb-2">⚠️ 计算假设与局限性</p>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        <li>桩体视为刚体，不考虑弹性变形</li>
                        <li>土体采用 Mohr-Coulomb 破坏准则</li>
                        <li>桩土界面摩擦角 δ 不应超过土体内摩擦角 φ</li>
                        <li>η、ξ、K 系数具有不确定性，建议通过工程经验确定</li>
                        <li>斜向抗拔承载力理论计算值偏大，最大误差约30%</li>
                        <li>不适用于：黏土地基、长柔性桩、循环加载工况</li>
                    </ul>
                </div>
            </div>

            <!-- ========== 第4部分：其他补充（示意图 + 验证图表） ========== -->
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-draw-polygon"></i>
                    <span>桩锚结构示意图</span>
                </div>
                <div class="module-info-text">
                    <p class="text-sm text-gray-600 mb-3 text-center">刚性锚桩几何参数与荷载示意图</p>
                    <div class="flex justify-center">
                        <img 
                            src="/assets/pics/pile_structure.png" 
                            alt="桩锚结构示意图"
                            class="rounded-lg border border-gray-200 shadow-sm"
                            style="max-width: 100%; width: auto; height: auto; max-height: 300px; object-fit: contain; display: block;"
                            onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\' viewBox=\'0 0 400 300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f0f9ff\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%230ea5e9\' font-size=\'14\'%3E图片加载失败%3C/text%3E%3C/svg%3E');"
                        >
                    </div>
                </div>
            </div>

        </div>
    `;
}