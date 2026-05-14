/**
 * @filepath: js/Anchor/dragAnchor/infoContent.js
 * @description: 拖曳锚模块信息展示内容
 *              包含理论来源、核心公式、适用范围与假设、预定义锚板尺寸表
 */

export function getInfoContent() {
    const clayTex = `
        \\begin{align} 
        z_{UED} &= \\frac{m_1 A_b + m_2 A_s}{2b} - \\frac{s_{u0}}{k} + \\Delta z + \\sqrt{ \\left(\\frac{m_1 A_b + m_2 A_s}{2b}\\right)^2 + \\left(\\frac{s_{u0}}{k}\\right)^2 + 2\\Delta z \\cdot \\frac{m_1 A_b + m_2 A_s}{2b} } \\\\[4pt]
        \\text{其中: } & m_1 = \\frac{(c-\\theta_m)^2}{\\cos(c-\\theta_m)}, \\quad 
        m_2 = \\frac{\\alpha (c-\\theta_m)^2}{N_c \\cos(c-\\theta_m)}, \\quad 
        \\Delta z = O \\cdot \\sin(c-\\theta_m)
        \\end{align}
    `;
    
    const sandTex = `
        \\begin{align}
        z_{UED} &= \\frac{m_1 A_b + m_2 A_s}{2b} + \\Delta z + \\sqrt{ \\left(\\frac{m_1 A_b + m_2 A_s}{2b}\\right)^2 + 2\\Delta z \\cdot \\frac{m_1 A_b + m_2 A_s}{2b} } \\\\[4pt]
        \\text{其中: } & N_q = e^{\\pi \\tan\\phi} \\tan^2\\left(45^\\circ + \\frac{\\phi}{2}\\right), \\quad 
        m_1 = \\frac{K_0 (c-\\theta_m)^2}{\\cos(c-\\theta_m)}, \\quad 
        m_2 = \\frac{\\tan\\delta (c-\\theta_m)^2}{N_q \\cos(c-\\theta_m)}
        \\end{align}
    `;
    
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
                        <li>杨涵婷. 拖曳锚嵌入运动轨迹的理论预测模型[D]. 天津大学, 2009.</li>
                        <li>DNVGL-RP-E303 (2017). <em>Recommended Practice for Geotechnical Design and Installation of Plate Anchors</em>. Det Norske Veritas, Oslo.（拖曳锚安装分析参考）</li>
                    </ul>
                    <p class="mt-2 text-xs text-gray-500">※ 本模块基于极限嵌入深度（UED）理论模型开发，适用于拖曳锚安装轨迹预测</p>
                </div>
            </div>

            <!-- ========== 第2部分：核心公式 ========== -->
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-calculator"></i>
                    <span>核心公式</span>
                </div>
                <div class="module-info-text">
                    <p class="mb-2 text-sm text-gray-600">拖曳锚极限嵌入深度（UED）由锚板尺寸、土体强度和拖缆参数共同决定：</p>
                    
                    <p class="font-semibold text-ocean-700 mt-3 mb-1">📌 饱和黏土（公式4-23）</p>
                    <div class="bg-gray-100 p-2 rounded font-mono text-xs overflow-x-auto my-2">
                        ${clayTex}
                    </div>
                    
                    <p class="font-semibold text-ocean-700 mt-3 mb-1">📌 饱和砂土（公式4-44）</p>
                    <div class="bg-gray-100 p-2 rounded font-mono text-xs overflow-x-auto my-2">
                        ${sandTex}
                    </div>
                    
                    <p class="mt-2 text-xs text-gray-500">※ 极限嵌入深度（UED）指锚板在拖曳过程中达到的最大埋深</p>
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
                        <li>适用于饱和黏土和饱和砂土地基中的拖曳锚安装分析</li>
                        <li>适用于法向承力锚（如拖曳嵌入式板锚）的极限嵌入深度预测</li>
                        <li>适用于钢索或钢链拖曳工况</li>
                    </ul>
                    
                    <p class="font-medium text-ocean-700 mb-2">⚠️ 计算假设与局限性</p>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        <li>假设锚板在拖曳过程中保持稳定姿态（恒定攻角）</li>
                        <li>忽略锚胫（shank）的阻力贡献（A<sub>sb</sub>=0，A<sub>sf</sub>=0）</li>
                        <li>黏土中采用总应力分析，不排水抗剪强度 s<sub>u</sub> 随深度线性增长</li>
                        <li>砂土中采用有效应力分析，承载力系数 N<sub>q</sub> 基于被动土压力理论</li>
                        <li>不适用于：循环加载、复杂海床条件（成层土、含气土）</li>
                        <li>模型预测结果建议结合数值模拟或模型试验验证</li>
                    </ul>
                </div>
            </div>

            <!-- ========== 第4部分：其他补充（预定义锚板尺寸表 + 参数说明） ========== -->
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-table"></i>
                    <span>预定义锚板尺寸（论文第61页 表4-1）</span>
                </div>
                <div class="module-info-text overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="px-3 py-2 text-left">型号</th>
                                <th class="px-3 py-2 text-left">长×宽×厚 (mm)</th>
                                <th class="px-3 py-2 text-left">A<sub>b</sub> (cm²)</th>
                                <th class="px-3 py-2 text-left">A<sub>s</sub> (cm²)</th>
                                <th class="px-3 py-2 text-left">O (mm)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-b border-gray-100">
                                <td class="px-3 py-2 font-medium">小锚板 A<sub>s</sub></td>
                                <td class="px-3 py-2">200×200×12</td>
                                <td class="px-3 py-2">24</td>
                                <td class="px-3 py-2">848</td>
                                <td class="px-3 py-2">240</td>
                            </tr>
                            <tr class="border-b border-gray-100">
                                <td class="px-3 py-2 font-medium">中锚板 A<sub>m</sub></td>
                                <td class="px-3 py-2">250×250×14</td>
                                <td class="px-3 py-2">35</td>
                                <td class="px-3 py-2">1320</td>
                                <td class="px-3 py-2">300</td>
                            </tr>
                            <tr>
                                <td class="px-3 py-2 font-medium">大锚板 A<sub>l</sub></td>
                                <td class="px-3 py-2">300×300×16</td>
                                <td class="px-3 py-2">48</td>
                                <td class="px-3 py-2">1896</td>
                                <td class="px-3 py-2">360</td>
                            </tr>
                        </tbody>
                    </table>
                    <p class="text-xs text-gray-500 mt-2">注：A<sub>b</sub>—锚板投影面积，A<sub>s</sub>—锚板侧面积，O—系缆点至锚板重心距离</p>
                </div>
            </div>

            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-info-circle"></i>
                    <span>参数补充说明</span>
                </div>
                <div class="module-info-text text-sm">
                    <div class="grid grid-cols-2 gap-2">
                        <div><span class="font-mono font-semibold">b</span> — 拖缆有效宽度</div>
                        <div><span class="font-mono font-semibold">c</span> — 系缆点张力与锚板夹角</div>
                        <div><span class="font-mono font-semibold">α</span> — 黏滞系数（0.2~0.8）</div>
                        <div><span class="font-mono font-semibold">N<sub>c</sub></span> — 黏土承载力系数（≈7.6）</div>
                        <div><span class="font-mono font-semibold">K₀</span> — 侧压力系数（0.4~0.6）</div>
                        <div><span class="font-mono font-semibold">φ</span> — 砂土内摩擦角（°）</div>
                        <div><span class="font-mono font-semibold">δ</span> — 桩土界面摩擦角（°）</div>
                        <div><span class="font-mono font-semibold">γ</span> — 土体有效重度（kN/m³）</div>
                    </div>
                    <div class="mt-3 p-2 bg-gray-50 rounded text-xs">
                        <p class="font-semibold">📌 拖缆有效宽度取值：</p>
                        <p>· 钢索：b = d（d为拖缆直径）</p>
                        <p>· 钢链：b = 2.5d</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}