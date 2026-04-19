/**
 * @filepath: js/Anchor/plateAnchor/infoContent.js
 * @description: 板锚模块信息展示内容
 */

export function getInfoContent() {
    const squareTex = `
        \\begin{align}
        q_u &= s_u \\cdot N_c \\\\[4pt]
        N_c &= N_{c0} + \\frac{\\gamma' H}{s_u} \\\\[4pt]
        N_{c0} &= S \\cdot \\left[ 2.56 \\ln\\left(\\frac{2H}{B}\\right) \\right] \\\\[4pt]
        N_c^* &= 11.9 \\quad (\\text{深锚方形极限值})
        \\end{align}
    `;
    
    const circularTex = `
        \\begin{align}
        q_u &= s_u \\cdot N_c \\\\[4pt]
        N_c &= N_{c0} + \\frac{\\gamma' H}{s_u} \\\\[4pt]
        N_{c0} &= S \\cdot \\left[ 2.56 \\ln\\left(\\frac{2H}{D}\\right) \\right] \\\\[4pt]
        N_c^* &= 12.56 \\quad (\\text{深锚圆形极限值})
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
                    <p><strong>Merfield, R.S., Lyamin, A.V., Sloan, S.W., & Yu, H.S. (2003).</strong></p>
                    <p>"Three-Dimensional Lower Bound Solutions for Stability of Plate Anchors in Clay"</p>
                    <p class="italic">Journal of Geotechnical and Geoenvironmental Engineering, 129(3), 243-253.</p>
                    
                    <p class="mt-3 font-semibold">方形/矩形锚承载力公式：</p>
                    <div class="formula-block my-2 p-2 bg-gray-50 rounded overflow-x-auto">
                        $$ ${squareTex} $$
                    </div>
                    
                    <p class="mt-3 font-semibold">圆形锚承载力公式：</p>
                    <div class="formula-block my-2 p-2 bg-gray-50 rounded overflow-x-auto">
                        $$ ${circularTex} $$
                    </div>
                </div>
            </div>
            
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-ruler-combined"></i>
                    <span>参数说明</span>
                </div>
                <div class="module-info-text">
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div><span class="font-mono">s<sub>u</sub></span> — 不排水抗剪强度 (kPa)</div>
                        <div><span class="font-mono">γ'</span> — 土体浮容重 (kN/m³)</div>
                        <div><span class="font-mono">H</span> — 锚板埋深 (m)</div>
                        <div><span class="font-mono">B</span> — 方形锚边长 / 矩形锚短边 (m)</div>
                        <div><span class="font-mono">D</span> — 圆形锚直径 (m)</div>
                        <div><span class="font-mono">L</span> — 矩形锚长边 (m)</div>
                        <div><span class="font-mono">S</span> — 形状因子（经验拟合多项式）</div>
                        <div><span class="font-mono">N<sub>c</sub></span> — 最终承载系数</div>
                        <div><span class="font-mono">η</span> — 土壤扰动折减系数 (默认0.75)</div>
                    </div>
                </div>
            </div>
            
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-chart-line"></i>
                    <span>形状因子 S 拟合说明</span>
                </div>
                <div class="module-info-text text-sm">
                    <ul class="list-disc list-inside mt-2 space-y-1">
                        <li><strong>方形锚</strong>：8次多项式拟合，适用范围 H/B ≈ 1~10</li>
                        <li><strong>圆形锚</strong>：10次多项式拟合，适用范围 H/D ≈ 1~10</li>
                        <li><strong>矩形锚</strong>：通过方形锚形状因子与条形锚极限值线性插值得到</li>
                    </ul>
                </div>
            </div>
            
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-flask"></i>
                    <span>计算假设与适用范围</span>
                </div>
                <div class="module-info-text text-sm">
                    <ul class="list-disc list-inside space-y-1">
                        <li>土体为均质、各向同性黏土</li>
                        <li>Tresca屈服准则，完美塑性本构</li>
                        <li>立即脱离条件，不考虑锚板底部吸力</li>
                        <li>锚板粗糙，粗糙度已隐含在公式中</li>
                        <li>适用范围：H/B 或 H/D 约 1~10</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}