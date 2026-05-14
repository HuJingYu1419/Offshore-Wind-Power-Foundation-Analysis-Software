/**
 * @filepath: js/Anchor/torpedoAnchor/vertical-capacity/infoContent.js
 * @description: 鱼雷锚竖向承载力模块信息展示内容
 *              包含理论来源、核心公式、适用范围与假设、几何示意图
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
                    <p class="mb-3 text-sm">API RP 2GEO (2014). <em>Geotechnical and Foundation Design Considerations</em>. American Petroleum Institute, Washington, D.C.</p>
                    
                    <p class="mb-2"><strong>参考文献：</strong></p>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        <li>Randolph, M. F., & Murphy, B. S. (1985). <em>Soil response to jack-up foundation units</em>. Proceedings of the 4th International Conference on Behaviour of Offshore Structures, Delft, 529-542.</li>
                        <li>Skempton, A. W. (1951). <em>The bearing capacity of clays</em>. Building Research Congress, London, 1, 180-189.</li>
                        <li>O'Loughlin, C. D., & Randolph, M. F. (2004). <em>Installation and pullout of dynamically embedded anchors in clay</em>. Proceedings of the 14th International Offshore and Polar Engineering Conference, Toulon, 506-513.</li>
                        <li>成思佳. (2020). <em>鱼雷锚在静荷载与循环荷载下的承载特性数值分析</em> [硕士学位论文]. 大连理工大学.</li>
                    </ul>
                    <p class="mt-2 text-xs text-gray-500">※ 本模块基于 API 规范及 Randolph & Murphy 侧摩阻力模型开发</p>
                </div>
            </div>

            <!-- ========== 第2部分：核心公式 ========== -->
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-calculator"></i>
                    <span>核心公式</span>
                </div>
                <div class="module-info-text">
                    <p class="mb-2 text-sm text-gray-600">竖向极限承载力由锚体浮重、端承阻力和侧壁摩擦力三部分构成：</p>
                    <div class="bg-gray-100 p-3 rounded font-mono text-sm text-center my-3">
                        F<sub>v</sub> = W<sub>s</sub> + F<sub>b</sub> + F<sub>f</sub>
                    </div>
                    <ul class="list-disc list-inside space-y-2 text-sm">
                        <li><strong>W<sub>s</sub></strong> — 锚体浮重（kN），钢材自重扣除海水浮力</li>
                        <li><strong>F<sub>b</sub></strong> — 端承阻力（kN）= N<sub>c</sub> × S<sub>ub</sub> × A<sub>p</sub>
                            <span class="block text-xs text-gray-500 ml-4">N<sub>c</sub>：锚尖取12.0，锚翼取7.5，锚眼取9.0</span>
                        </li>
                        <li><strong>F<sub>f</sub></strong> — 侧壁摩擦力（kN）= α × S<sub>uf</sub> × A<sub>s</sub>
                            <span class="block text-xs text-gray-500 ml-4">α 采用 Randolph & Murphy 公式计算</span>
                        </li>
                    </ul>
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
                        <li>适用于饱和黏土海床中的鱼雷锚竖向拉拔承载力计算</li>
                        <li>适用深度：埋深 ≥ 1.5倍锚长（满足深埋破坏模式）</li>
                        <li>适用于静载或准静态加载条件</li>
                    </ul>
                    
                    <p class="font-medium text-ocean-700 mb-2">⚠️ 计算假设与局限性</p>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        <li>假设锚体为刚体（弹性模量 E = 200 GPa）</li>
                        <li>土体假定为各向同性材料</li>
                        <li>短期承载力模式：摩擦系数 α = 1/S<sub>t</sub>（土体完全重塑）</li>
                        <li>长期承载力模式：摩擦系数 α 采用 R&amp;M 公式（超孔压消散后）</li>
                        <li>不适用于：砂土地基、循环加载、倾斜拉拔工况</li>
                        <li>端承系数 N<sub>c</sub> 取值基于有限元校准，实际工程建议进行参数敏感性分析</li>
                    </ul>
                </div>
            </div>

            <!-- ========== 第4部分：其他补充（几何示意图 + 承载力分量示意图） ========== -->
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-draw-polygon"></i>
                    <span>几何结构示意图</span>
                </div>
                <div class="module-info-text">
                    <p class="text-sm text-gray-600 mb-3 text-center">鱼雷锚结构尺寸示意图（含锚身、锚翼、锚尖参数标注）</p>
                    <div class="flex justify-center">
                        <img 
                            src="/assets/pics/tor_structure.png" 
                            alt="鱼雷锚结构示意图"
                            class="rounded-lg border border-gray-200 shadow-sm"
                            style="max-width: 100%; width: auto; height: auto; max-height: 400px; object-fit: contain; display: block;"
                            onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\' viewBox=\'0 0 400 300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f0f9ff\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%230ea5e9\' font-size=\'14\'%3E图片加载失败%3C/text%3E%3C/svg%3E');"
                        >
                    </div>
                    <p class="text-xs text-gray-500 mt-2 text-center">图1 鱼雷锚几何结构示意图</p>
                </div>
            </div>

            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-chart-bar"></i>
                    <span>承载力分量示意图</span>
                </div>
                <div class="module-info-text">
                    <p class="text-sm text-gray-600 mb-3 text-center">鱼雷锚竖向承载力分量示意图（浮重、端阻力、侧摩阻力）</p>
                    <div class="flex justify-center">
                        <img 
                            src="/assets/pics/tor_force.png" 
                            alt="鱼雷锚承载力分量示意图"
                            class="rounded-lg border border-gray-200 shadow-sm"
                            style="max-width: 100%; width: auto; height: auto; max-height: 500px; object-fit: contain; display: block;"
                            onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\' viewBox=\'0 0 400 300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f0f9ff\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%230ea5e9\' font-size=\'14\'%3E图片加载失败%3C/text%3E%3C/svg%3E');"
                        >
                    </div>
                    <p class="text-xs text-gray-500 mt-2 text-center">图2 鱼雷锚竖向承载力分量示意图</p>
                </div>
            </div>
    `;
}