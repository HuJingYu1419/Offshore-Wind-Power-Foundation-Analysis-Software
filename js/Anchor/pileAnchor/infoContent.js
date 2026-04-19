/**
 * @filepath: js/Anchor/pileAnchor/infoContent.js
 * @description: 桩锚模块信息展示内容
 */

export function getInfoContent() {
    return `
        <div class="space-y-4">
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-book-open"></i>
                    <span>理论来源</span>
                </div>
                <div class="module-info-text">
                    <p><strong>黄挺, 罗成未, 焦澳, 戴国亮. 密实砂中刚性锚桩斜向抗拔承载特性[J]. 工业建筑, 2023, 53(03): 180-187.</strong></p>
                    <p class="mt-2">参考文献：Zhang L, Silva F, Grismala R. Ultimate lateral resistance to piles in cohesionless soils[J]. Journal of Geotechnical and Geoenvironmental Engineering, 2005, 131(1): 78-83.</p>
                </div>
            </div>
            
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-chalkboard-teacher"></i>
                    <span>核心公式</span>
                </div>
                <div class="module-info-text">
                    <p class="font-semibold">竖向极限承载力 V<sub>u</sub>：</p>
                    <div class="formula-block my-2 p-2 bg-gray-50 rounded overflow-x-auto text-sm font-mono">
                        V<sub>u</sub> = G + (πD/2)·L²·K₀·tanδ &nbsp;&nbsp;(δ ≤ 26°)<br>
                        V<sub>u</sub> = V<sub>vermeer</sub> + (1-m)·V<sub>interface</sub> &nbsp;&nbsp;(26° < δ < 39°)<br>
                        V<sub>u</sub> = (1 + 2·(L·D/A<sub>b</sub>)·tanφ·cosφ'<sub>crit</sub>)·A<sub>b</sub>·γ·L &nbsp;&nbsp;(δ ≥ 39°)
                    </div>
                    <p class="font-semibold mt-3">水平极限承载力 H<sub>u</sub>：</p>
                    <div class="formula-block my-2 p-2 bg-gray-50 rounded overflow-x-auto text-sm font-mono">
                        H<sub>u</sub> = 0.3·(η·K<sub>p</sub>² + ξ·K·tanδ)·γ·a·D·(2.7a - 1.7L)
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
                        <div><span class="font-mono">L, D</span> — 桩长、桩径 (m)</div>
                        <div><span class="font-mono">e</span> — 荷载偏心距 (m)，负值表示桩顶以下</div>
                        <div><span class="font-mono">φ, γ, δ</span> — 土体参数</div>
                        <div><span class="font-mono">K₀</span> — 侧向土压力系数 (0.4~0.6)</div>
                        <div><span class="font-mono">η, ξ</span> — 经验形状系数 (推荐1.61)</div>
                        <div><span class="font-mono">θ</span> — 加载倾斜角 (°)，0°为水平，90°为竖向</div>
                    </div>
                </div>
            </div>
            
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-chart-line"></i>
                    <span>适用范围与假设</span>
                </div>
                <div class="module-info-text text-sm">
                    <ul class="list-disc list-inside space-y-1">
                        <li>适用于密实砂土中的刚性锚桩（长径比较小）</li>
                        <li>桩体视为刚体，不考虑弹性变形</li>
                        <li>土体采用Mohr-Coulomb破坏准则</li>
                        <li>竖向承载力分段公式适用于δ=26°~39°范围</li>
                    </ul>
                </div>
            </div>
            
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>注意事项</span>
                </div>
                <div class="module-info-text text-sm">
                    <ul class="list-disc list-inside space-y-1">
                        <li>η, ξ, K系数具有高度不确定性，建议通过工程经验确定</li>
                        <li>桩土界面摩擦角δ不应超过土体内部摩擦角φ</li>
                        <li>可选"使用论文Hu验证值"与论文第7页案例对比验证</li>
                        <li>⚠️ 本工具为研究性代码，实际工程应用需经专业校核</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}