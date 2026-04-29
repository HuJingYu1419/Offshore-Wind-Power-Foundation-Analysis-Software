/**
 * @filepath: js/Anchor/torpedoAnchor/vertical-capacity/infoContent.js
 * @description: 鱼雷锚竖向承载力模块信息展示内容
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
                    <p class="mb-2">基于论文：<strong>《鱼雷锚在静荷载与循环荷载下的承载特性数值分析》</strong>（成思佳 等）</p>
                    <p class="mb-2">侧摩阻力系数 α 采用 <strong>Randolph & Murphy (R&M) 公式</strong>：</p>
                    <div class="bg-gray-100 p-2 rounded font-mono text-sm text-center my-2">
                        α = 0.5 × √(S<sub>u</sub> / σ'<sub>v</sub>)
                    </div>
                    <p>该公式考虑了土体不排水抗剪强度 S<sub>u</sub> 与有效上覆压力 σ'<sub>v</sub> 的关系。</p>
                </div>
            </div>

            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-calculator"></i>
                    <span>承载力计算公式</span>
                </div>
                <div class="module-info-text">
                    <p class="font-mono text-sm bg-gray-100 p-3 rounded text-center mb-3">
                        Q<sub>u</sub> = W<sub>s</sub> + Q<sub>b</sub> + Q<sub>f</sub>
                    </p>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        <li><strong>W<sub>s</sub></strong> — 锚体浮重（kN）</li>
                        <li><strong>Q<sub>b</sub></strong> — 端承阻力（kN）= Σ(N<sub>c</sub> × S<sub>u</sub> × A)</li>
                        <li><strong>Q<sub>f</sub></strong> — 侧壁摩擦力（kN）= ∫(α × S<sub>u</sub> × 周长) dz</li>
                    </ul>
                    <p class="mt-2 text-xs text-gray-500">※ 端承系数 N<sub>c</sub>：锚尖取12.0，锚翼取7.5，锚眼取9.0</p>
                </div>
            </div>

            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-exchange-alt"></i>
                    <span>计算模式说明</span>
                </div>
                <div class="module-info-text">
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div class="bg-blue-50 p-2 rounded">
                            <span class="font-bold text-blue-700">📊 短期模式</span>
                            <p class="text-xs mt-1">α = 1 / S<sub>t</sub><br>适用于瞬时加载</p>
                        </div>
                        <div class="bg-green-50 p-2 rounded">
                            <span class="font-bold text-green-700">📈 长期模式</span>
                            <p class="text-xs mt-1">α = 0.5 × √(S<sub>u</sub>/σ'<sub>v</sub>)<br>推荐用于常规设计</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-draw-polygon"></i>
                    <span>几何信息示意图</span>
                </div>
                <div class="module-info-text">
                    <p class="text-sm text-gray-600 mb-3 text-center">鱼雷锚结构尺寸示意图（含锚身、锚翼、锚尖参数标注）</p>
                    <div class="flex justify-center">
                        <div class="flex justify-center w-full">
                            <img 
                                src="/assets/pics/tor_structure.png" 
                                alt="鱼雷锚结构示意图"
                                class="rounded-lg border border-gray-200 shadow-sm"
                                style="max-width: 100%; width: auto; height: auto; max-height: 400px; object-fit: contain; display: block;"
                                onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\' viewBox=\'0 0 400 300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f0f9ff\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%230ea5e9\' font-size=\'14\'%3E图片加载失败%3C/text%3E%3C/svg%3E');"
                            >
                        </div>
                    </div>
                    <p class="text-xs text-gray-500 mt-2 text-center">鱼雷锚和土体参数示意图</p>
                </div>
            </div>

            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-chart-bar"></i>
                    <span>承载力示意图</span>
                </div>
                <div class="module-info-text">
                    <p class="text-sm text-gray-600 mb-3 text-center">鱼雷锚承载力分量示意图</p>
                    <div class="flex justify-center">
                        <img 
                            src="/assets/pics/tor_force.png" 
                            alt="鱼雷锚承载力分量示意图"
                            class="rounded-lg border border-gray-200 shadow-sm"
                            style="max-width: 100%; width: auto; height: auto; max-height: 500px; object-fit: contain; display: block;"
                            onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\' viewBox=\'0 0 400 300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f0f9ff\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%230ea5e9\' font-size=\'14\'%3E图片加载失败%3C/text%3E%3C/svg%3E');"
                        >
                    </div>
                </div>
            </div>
        </div>
    `;
}