/**
 * @filepath: js/Anchor/plateAnchor/infoContent.js
 * @description: 板锚模块信息展示内容
 *              包含理论来源、核心公式、适用范围与假设、示意图及承载力系数图表
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
                        <li>Merfield, R. S., Lyamin, A. V., Sloan, S. W., & Yu, H. S. (2003). Three-Dimensional Lower Bound Solutions for Stability of Plate Anchors in Clay. <em>Journal of Geotechnical and Geoenvironmental Engineering</em>, 129(3), 243-253.</li>
                        <li>DNVGL-RP-E303 (2017). <em>Recommended Practice for Geotechnical Design and Installation of Plate Anchors</em>. Det Norske Veritas, Oslo.</li>
                        <li>API RP 2GEO (2014). <em>Geotechnical and Foundation Design Considerations</em>. American Petroleum Institute, Washington, D.C.</li>
                    </ul>
                    <p class="mt-2 text-xs text-gray-500">※ 本模块基于三维下限解有限元分析结果开发</p>
                </div>
            </div>

            <!-- ========== 第2部分：核心公式 ========== -->
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-calculator"></i>
                    <span>核心公式</span>
                </div>
                <div class="module-info-text">
                    <p class="mb-2 text-sm text-gray-600">板锚极限承载力由承载系数 N<sub>c</sub> 与不排水抗剪强度乘积确定：</p>
                    
                    <div class="bg-gray-100 p-3 rounded font-mono text-sm text-center my-3">
                        q<sub>u</sub> = s<sub>u</sub> × N<sub>c</sub>
                    </div>
                    
                    <p class="text-sm text-gray-600 mb-2">其中承载系数 N<sub>c</sub> 由浅埋项与深埋极限值构成：</p>
                    <div class="bg-gray-100 p-2 rounded font-mono text-sm text-center my-2">
                        N<sub>c</sub> = N<sub>c0</sub> + (γ'·H / s<sub>u</sub>)
                    </div>
                    
                    <p class="font-semibold text-ocean-700 mt-3 mb-1">📌 方形锚（边长 B）</p>
                    <div class="bg-gray-50 p-2 rounded font-mono text-sm overflow-x-auto my-2">
                        N<sub>c0</sub> = S · 2.56·ln(2H/B)<br>
                        N<sub>c</sub><sup>*</sup> = 11.9（深锚极限值）
                    </div>
                    
                    <p class="font-semibold text-ocean-700 mt-3 mb-1">📌 圆形锚（直径 D）</p>
                    <div class="bg-gray-50 p-2 rounded font-mono text-sm overflow-x-auto my-2">
                        N<sub>c0</sub> = S · 2.56·ln(2H/D)<br>
                        N<sub>c</sub><sup>*</sup> = 12.56（深锚极限值）
                    </div>
                    
                    <p class="font-semibold text-ocean-700 mt-3 mb-1">📌 矩形锚（边长 B × L）</p>
                    <div class="bg-gray-50 p-2 rounded text-sm my-2">
                        <p>通过方形锚形状因子与条形锚极限值线性插值得到：</p>
                        <p class="font-mono mt-1">N<sub>c,rect</sub> = N<sub>c,square</sub> + (B/L)·(N<sub>c,strip</sub> - N<sub>c,square</sub>)</p>
                    </div>
                    
                    <p class="mt-3 text-sm text-gray-600">最终极限承载力：</p>
                    <div class="bg-gray-100 p-2 rounded font-mono text-sm text-center my-2">
                        F<sub>u</sub> = η · q<sub>u</sub> · A<sub>plate</sub>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">η：土壤扰动折减系数（默认0.75），A<sub>plate</sub>：锚板垂直投影面积</p>
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
                        <li>适用于均质或线性强度增长黏土地基</li>
                        <li>埋深比范围：H/B 或 H/D ≈ 1~10</li>
                        <li>适用于方形、圆形、矩形板锚</li>
                        <li>适用于拖曳埋入式板锚的承载力评估</li>
                    </ul>
                    
                    <p class="font-medium text-ocean-700 mb-2">⚠️ 计算假设与局限性</p>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        <li>土体为均质、各向同性黏土，服从 Tresca 屈服准则</li>
                        <li>采用理想塑性本构模型</li>
                        <li>假定立即脱离条件，不考虑锚板底部吸力</li>
                        <li>锚板假定为粗糙，粗糙度已隐含在公式中</li>
                        <li>不适用于：砂土地基、循环加载、锚板倾斜安装工况</li>
                        <li>土壤扰动系数 η 建议基于可靠测试数据确定</li>
                    </ul>
                </div>
            </div>

            <!-- ========== 第4部分：其他补充（示意图 + 承载力系数图表） ========== -->
            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-draw-polygon"></i>
                    <span>板锚结构示意图</span>
                </div>
                <div class="module-info-text">
                    <p class="text-sm text-gray-600 mb-3 text-center">板锚工作过程示意图</p>
                    <div class="flex justify-center">
                        <img 
                            src="/assets/pics/plate_process.png" 
                            alt="板锚工作过程示意图"
                            class="rounded-lg border border-gray-200 shadow-sm"
                            style="max-width: 100%; width: auto; height: auto; max-height: 300px; object-fit: contain; display: block;"
                            onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\' viewBox=\'0 0 400 300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f0f9ff\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%230ea5e9\' font-size=\'14\'%3E图片加载失败%3C/text%3E%3C/svg%3E');"
                        >
                    </div>
                    <p class="text-xs text-gray-500 mt-2 text-center">图1 板锚工作过程示意图</p>
                </div>
            </div>

            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-chart-line"></i>
                    <span>承载力系数 N<sub>c</sub> 取值参考</span>
                </div>
                <div class="module-info-text">
                    <p class="text-sm text-gray-600 mb-3 text-center">圆形和方形板锚结构图</p>
                    <div class="flex justify-center">
                        <img 
                            src="/assets/pics/plate_structure.png" 
                            alt="圆形和方形板锚结构图"
                            class="rounded-lg border border-gray-200 shadow-sm"
                            style="max-width: 100%; width: auto; height: auto; max-height: 350px; object-fit: contain; display: block;"
                            onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\' viewBox=\'0 0 400 300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f0f9ff\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%230ea5e9\' font-size=\'14\'%3E图片加载失败%3C/text%3E%3C/svg%3E');"
                        >
                    </div>
                    <p class="text-xs text-gray-500 mt-2 text-center">图2 圆形与方形板锚几何参数与埋深示意图</p>
                    <p class="text-xs text-gray-400 mt-1 text-center">图中标注：板宽 B、板长 L、埋深 H、拉拔方向</p>
                </div>
            </div>

            <div class="module-info-card">
                <div class="module-info-title">
                    <i class="fas fa-chart-simple"></i>
                    <span>形状因子 S 拟合公式</span>
                </div>
                <div class="module-info-text">
                    <p class="font-medium text-ocean-700 mb-1">📌 方形锚（x = H/B）</p>
                    <div class="bg-gray-50 p-2 rounded font-mono text-xs overflow-x-auto my-2">
                        S = -4.59716×10<sup>-6</sup>·x⁸ + 0.00020·x⁷ - 0.00356·x⁶ + 0.03438·x⁵ - 0.19108·x⁴ + 0.60651·x³ - 1.00177·x² + 0.68234·x + 1.59197
                    </div>
                    <p class="text-xs text-gray-500 mt-1">适用范围：H/B ≈ 1~10，8次多项式拟合</p>
                    
                    <p class="font-medium text-ocean-700 mt-3 mb-1">📌 圆形锚（x = H/D）</p>
                    <div class="bg-gray-50 p-2 rounded font-mono text-xs overflow-x-auto my-2">
                        S = 2.13325×10<sup>-7</sup>·x¹⁰ - 1.14903×10<sup>-5</sup>·x⁹ + 0.00027·x⁸ - 0.00363·x⁷ + 0.03122·x⁶ - 0.17989·x⁵ + 0.70743·x⁴ - 1.88547·x³ + 3.27851·x² - 3.39259·x + 3.54920
                    </div>
                    <p class="text-xs text-gray-500 mt-1">适用范围：H/D ≈ 1~10，10次多项式拟合</p>
                </div>
            </div>
        </div>
    `;
}