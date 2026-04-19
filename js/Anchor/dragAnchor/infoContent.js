/**
 * @filepath: js/Anchor/dragAnchor/infoContent.js
 * @description: 拖曳锚模块信息展示内容
 */

export function getInfoContent() {
    const clayTex = `
        \\begin{align} 
        z_{UED} &= \\frac{m_1 A_b + m_2 A_s}{2b} - \\frac{s_{u0}}{k} + \\Delta z + \\sqrt{ \\left(\\frac{m_1 A_b + m_2 A_s}{2b}\\right)^2 + \\left(\\frac{s_{u0}}{k}\\right)^2 + 2\\Delta z \\cdot \\frac{m_1 A_b + m_2 A_s}{2b} } \\\\
        \\text{其中: } & m_1 = \\frac{(c-\\theta_m)^2}{\\cos(c-\\theta_m)}, \\quad 
        m_2 = \\frac{\\alpha (c-\\theta_m)^2}{N_c \\cos(c-\\theta_m)}, \\quad 
        \\Delta z = O \\cdot \\sin(c-\\theta_m)
        \\end{align}
    `;
    
    const sandTex = `
        \\begin{align}
        z_{UED} &= \\frac{m_1 A_b + m_2 A_s}{2b} + \\Delta z + \\sqrt{ \\left(\\frac{m_1 A_b + m_2 A_s}{2b}\\right)^2 + 2\\Delta z \\cdot \\frac{m_1 A_b + m_2 A_s}{2b} } \\\\
        \\text{其中: } & N_q = e^{\\pi \\tan\\phi} \\tan^2\\left(45^\\circ + \\frac{\\phi}{2}\\right), \\quad 
        m_1 = \\frac{K_0 (c-\\theta_m)^2}{\\cos(c-\\theta_m)}, \\quad 
        m_2 = \\frac{\\tan\\delta (c-\\theta_m)^2}{N_q \\cos(c-\\theta_m)}
        \\end{align}
    `;
    
    return `
        <div class="space-y-4">
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-book-open"></i>
                    <span>理论来源</span>
                </div>
                <div class="module-info-text">
                    <p><strong>杨涵婷. 拖曳锚嵌入运动轨迹的理论预测模型[D]. 天津大学, 2009.</strong></p>
                    <p class="mt-2 font-semibold">饱和粘土极限嵌入深度公式 (论文第54页 公式4-23)：</p>
                    <div class="formula-block my-2 p-2 bg-gray-50 rounded overflow-x-auto">
                        $$ ${clayTex} $$
                    </div>
                    <p class="mt-3 font-semibold">饱和砂土极限嵌入深度公式 (论文第60页 公式4-44)：</p>
                    <div class="formula-block my-2 p-2 bg-gray-50 rounded overflow-x-auto">
                        $$ ${sandTex} $$
                    </div>
                </div>
            </div>
            
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-table"></i>
                    <span>预定义锚板尺寸 (论文第61页 表4-1)</span>
                </div>
                <div class="module-info-text overflow-x-auto">
                    <table class="min-w-full text-xs">
                        <thead class="bg-gray-100">
                            <tr><th class="px-2 py-1">型号</th><th class="px-2 py-1">长×宽×厚 (mm)</th><th class="px-2 py-1">A<sub>b</sub> (cm²)</th><th class="px-2 py-1">A<sub>s</sub> (cm²)</th><th class="px-2 py-1">O (mm)</th></tr>
                        </thead>
                        <tbody>
                            <tr><td class="px-2 py-1">小锚板 A<sub>s</sub></td><td class="px-2 py-1">200×200×12</td><td class="px-2 py-1">24</td><td class="px-2 py-1">848</td><td class="px-2 py-1">240</td></tr>
                            <tr><td class="px-2 py-1">中锚板 A<sub>m</sub></td><td class="px-2 py-1">250×250×14</td><td class="px-2 py-1">35</td><td class="px-2 py-1">1320</td><td class="px-2 py-1">300</td></tr>
                            <tr><td class="px-2 py-1">大锚板 A<sub>l</sub></td><td class="px-2 py-1">300×300×16</td><td class="px-2 py-1">48</td><td class="px-2 py-1">1896</td><td class="px-2 py-1">360</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-info-circle"></i>
                    <span>拖缆有效宽度</span>
                </div>
                <div class="module-info-text text-sm">
                    <p>· <strong>钢索</strong>：b = d (d为拖缆直径)</p>
                    <p>· <strong>钢链</strong>：b = 2.5d</p>
                </div>
            </div>
        </div>
    `;
}