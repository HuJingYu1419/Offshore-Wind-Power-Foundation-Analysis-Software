/**
 * @filepath: js/Anchor/gravityAnchor/infoContent.js
 * @description: 重力锚模块信息展示内容
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
                    <p><strong>黄博晓. 深海重力锚在黏土中水平承载及抗拔性能的模型试验研究[D]. 天津大学, 2021.</strong></p>
                    <p class="mt-2">参考规范：</p>
                    <ul class="list-disc list-inside text-sm">
                        <li>DNVGL-RP-E303: Geotechnical Design of Suction Anchors in Clay</li>
                        <li>API RP 2GEO: Geotechnical and Foundation Design Considerations</li>
                    </ul>
                </div>
            </div>
            
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-chalkboard-teacher"></i>
                    <span>核心公式</span>
                </div>
                <div class="module-info-text">
                    <p class="font-semibold">水平承载力 (带裙板)：</p>
                    <div class="formula-block my-2 p-2 bg-gray-50 rounded overflow-x-auto text-sm font-mono">
                        F<sub>h</sub> = s<sub>u</sub>(z)·A<sub>b</sub> + [2·s<sub>ua</sub>·z<sub>s</sub> + γ'·0.5·z<sub>s</sub>²]·B
                    </div>
                    
                    <p class="font-semibold mt-3">上拔力：</p>
                    <div class="formula-block my-2 p-2 bg-gray-50 rounded overflow-x-auto text-sm font-mono">
                        V<sub>e</sub> = F·(N<sub>c</sub>·s<sub>u0</sub> + κ·B'/4)·K<sub>c</sub>·A'<br>
                        总上拔力 = V<sub>e</sub> + V<sub>s</sub> + W
                    </div>
                    
                    <p class="font-semibold mt-3">防倾覆稳定性：</p>
                    <div class="formula-block my-2 p-2 bg-gray-50 rounded overflow-x-auto text-sm font-mono">
                        安全系数 = (W·L<sub>arm</sub>) / (T·A<sub>arm</sub>)
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
                        <div><span class="font-mono">L, B, H</span> — 锚长、宽、高 (m)</div>
                        <div><span class="font-mono">z<sub>s</sub></span> — 裙板贯入深度 (m)</div>
                        <div><span class="font-mono">W</span> — 水中锚重量 (kN)</div>
                        <div><span class="font-mono">s<sub>u</sub></span> — 不排水抗剪强度 (kPa)</div>
                        <div><span class="font-mono">k</span> — 强度梯度 (kPa/m)</div>
                        <div><span class="font-mono">γ'</span> — 土体浮容重 (kN/m³)</div>
                        <div><span class="font-mono">α</span> — 粘着系数 (0.2~0.8)</div>
                        <div><span class="font-mono">N<sub>c</sub></span> — 承载力系数 (6.095/9.0)</div>
                    </div>
                </div>
            </div>
            
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-flask"></i>
                    <span>计算假设与适用范围</span>
                </div>
                <div class="module-info-text text-sm">
                    <ul class="list-disc list-inside space-y-1">
                        <li>土体为饱和黏土，采用不排水抗剪强度分析框架</li>
                        <li>土体抗剪强度随深度线性增加: s<sub>u</sub>(z) = s<sub>um</sub> + k·z</li>
                        <li>重力锚放置于海床表面或浅埋状态</li>
                        <li>适用于正常固结或轻微超固结黏土</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}