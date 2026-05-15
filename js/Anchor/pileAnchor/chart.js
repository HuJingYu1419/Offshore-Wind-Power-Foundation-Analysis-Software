/**
 * @filepath: js/Anchor/pileAnchor/chart.js
 * @description: 桩锚模块图表生成器 - 修复版
 *               绘制 H-V 交互曲线（破坏包络面）
 */

/**
 * 生成包络面图表数据集
 * @param {Object} params - 当前输入参数
 * @param {Object} result - 当前计算结果
 * @param {Function} calculateFn - 计算函数引用
 * @returns {Object} Chart.js 配置对象
 */
export function generateEnvelopeChart(params, result, calculateFn) {
    const details = result.details;
    const Hu = details.Hu_kN;
    const Vu = details.Vu_kN;
    
    if (!Hu || !Vu || Hu <= 0 || Vu <= 0) {
        return null;
    }
    
    // ========== 1. 理论包络线（密集采样，绘出平滑曲线） ==========
    // 从 0° 到 90°，步长 1°（足够平滑）
    const thetaEnvelope = [];
    for (let i = 0; i <= 90; i++) {
        thetaEnvelope.push(i);
    }
    
    const envelopePoints = [];  // 存储 {x, y} 点
    const n = details.n_exp || 2.0;
    
    for (const theta of thetaEnvelope) {
        const rad = theta * Math.PI / 180;
        const tanTheta = Math.tan(rad);
        
        let H_boundary, V_boundary;
        
        if (theta === 0) {
            H_boundary = Hu;
            V_boundary = 0;
        } else if (theta === 90) {
            H_boundary = 0;
            V_boundary = Vu;
        } else {
            // 求解包络面方程: (H/Hu)^n + (V/Vu)^n = 1, 且 H = V * tanθ
            const k = tanTheta;
            const a = Math.pow(k / Hu, n);
            const b = Math.pow(1 / Vu, n);
            V_boundary = Math.pow(1 / (a + b), 1/n);
            H_boundary = V_boundary * k;
        }
        
        // 只添加有效点（非 NaN，非无穷，且坐标为正）
        if (isFinite(H_boundary) && isFinite(V_boundary) && H_boundary >= 0 && V_boundary >= 0) {
            envelopePoints.push({ x: H_boundary, y: V_boundary });
        }
    }
    
    // 按 x 坐标降序排列（从 Hu 到 0），确保曲线从左到右正确绘制
    envelopePoints.sort((a, b) => b.x - a.x);
    
    // ========== 2. 计算值采样点（用于对比） ==========
    // 采样角度：0°, 15°, 30°, 45°, 60°, 75°, 90°
    const sampleAngles = [0, 15, 30, 45, 60, 75, 90];
    const calculatedPoints = [];
    const thetaLabels = [];
    
    for (const theta of sampleAngles) {
        const testResult = calculateFn({ ...params, theta_deg: theta });
        const testDetails = testResult?.details;
        
        if (testDetails) {
            const H = testDetails.H_kN || 0;
            const V = testDetails.V_kN || 0;
            // 只添加有效点（H 和 V 都为正，或者一个为0另一个为正）
            if ((H > 0 || V > 0) && isFinite(H) && isFinite(V)) {
                calculatedPoints.push({ x: H, y: V, theta: theta });
                thetaLabels.push(`${theta}°`);
            }
        }
    }
    
    // 按角度顺序排序（从小到大）
    calculatedPoints.sort((a, b) => a.theta - b.theta);
    
    // ========== 3. 当前加载点 ==========
    const currentH = details.H_kN || 0;
    const currentV = details.V_kN || 0;
    const currentTheta = details.theta_deg || 0;
    
    // ========== 4. 返回 Chart.js 配置 ==========
    return {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: '理论包络线 (破坏边界)',
                    data: envelopePoints,
                    type: 'line',
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.05)',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    showLine: true,
                    tension: 0.3,  // 曲线平滑
                    fill: false,
                    order: 2
                },
                {
                    label: '计算值 (不同加载角)',
                    data: calculatedPoints.map(p => ({ x: p.x, y: p.y })),
                    type: 'line',
                    borderColor: '#f59e0b',
                    backgroundColor: '#f59e0b',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#f59e0b',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    showLine: true,  // ✅ 改为 true，连接成折线
                    tension: 0.1,    // 轻微平滑
                    fill: false,
                    order: 1
                },
                {
                    label: `当前加载角 (θ = ${currentTheta}°)`,
                    data: [{ x: currentH, y: currentV }],
                    type: 'scatter',
                    borderColor: '#ef4444',
                    backgroundColor: '#ef4444',
                    borderWidth: 0,
                    pointRadius: 8,
                    pointHoverRadius: 12,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    showLine: false,
                    order: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const datasetLabel = context.dataset.label;
                            const x = context.parsed.x;
                            const y = context.parsed.y;
                            
                            if (datasetLabel.includes('当前加载角')) {
                                return [
                                    `水平承载力 H = ${x.toFixed(2)} kN`,
                                    `竖向承载力 V = ${y.toFixed(2)} kN`,
                                    `加载角 θ = ${currentTheta}°`
                                ];
                            } else if (datasetLabel === '计算值 (不同加载角)') {
                                // 找到对应的加载角
                                const idx = context.dataIndex;
                                const theta = calculatedPoints[idx]?.theta;
                                return [
                                    `加载角: ${theta}°`,
                                    `水平承载力 H = ${x.toFixed(2)} kN`,
                                    `竖向承载力 V = ${y.toFixed(2)} kN`
                                ];
                            } else {
                                // 理论包络线：计算对应的加载角
                                let thetaEst = '—';
                                if (x > 0 && y > 0) {
                                    const ratio = x / y;
                                    thetaEst = (Math.atan(ratio) * 180 / Math.PI).toFixed(1);
                                } else if (x > 0 && y === 0) {
                                    thetaEst = '0';
                                } else if (x === 0 && y > 0) {
                                    thetaEst = '90';
                                }
                                return [
                                    `水平承载力 H = ${x.toFixed(2)} kN`,
                                    `竖向承载力 V = ${y.toFixed(2)} kN`,
                                    thetaEst !== '—' ? `对应加载角 ≈ ${thetaEst}°` : ''
                                ].filter(Boolean);
                            }
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: { 
                        font: { size: 11 },
                        boxWidth: 12,
                        usePointStyle: true
                    }
                },
                title: {
                    display: true,
                    text: `📈 桩锚 H-V 破坏包络面 | H_u = ${Hu.toFixed(1)} kN, V_u = ${Vu.toFixed(1)} kN, n = ${n.toFixed(2)}`,
                    font: { size: 14, weight: 'bold' },
                    padding: { bottom: 15 }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '水平承载力 H (kN)',
                        font: { weight: 'bold', size: 12 }
                    },
                    grid: { color: '#e2e8f0' },
                    beginAtZero: true,
                    min: 0
                },
                y: {
                    title: {
                        display: true,
                        text: '竖向承载力 V (kN)',
                        font: { weight: 'bold', size: 12 }
                    },
                    grid: { color: '#e2e8f0' },
                    beginAtZero: true,
                    min: 0
                }
            }
        }
    };
}

export function shouldShowChart(params, result) {
    if (!result || !result.details) return false;
    const Hu = result.details.Hu_kN;
    const Vu = result.details.Vu_kN;
    return Hu !== undefined && Vu !== undefined && Hu > 0 && Vu > 0;
}