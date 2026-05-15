/**
 * @filepath: js/Anchor/gravityAnchor/chart.js
 * @description: 重力锚模块图表生成器
 *               绘制 H-V 破坏包络面曲线（椭圆模型）
 *               重力锚特点：水平承载力（拖曳）+ 竖向承载力（上拔）
 */

/**
 * 生成包络面图表数据集（H-V 交互曲线）
 * @param {Object} params - 当前输入参数
 * @param {Object} result - 当前计算结果
 * @param {Function} calculateFn - 计算函数引用（用于批量计算）
 * @returns {Object} Chart.js 配置对象
 */
export function generateEnvelopeChart(params, result, calculateFn) {
    const details = result.details;
    
    // 获取极限承载力（从计算结果中提取）
    const H_max = details.horizontal_capacity?.horizontal_capacity_kN || 0;
    const V_max = details.uplift_capacity?.uplift_capacity_kN || 0;
    
    if (H_max <= 0 || V_max <= 0) {
        return null;
    }
    
    // ========== 1. 理论包络线（椭圆模型） ==========
    // 破坏包络面方程: (H/H_max)^α + (V/V_max)^β = 1
    // 对于重力锚，典型值 α = 2, β = 2（椭圆）
    const alpha = 2.0;
    const beta = 2.0;
    
    // 生成包络面上的离散点（理论曲线）
    const envelopePoints = [];
    // 使用角度参数化：从 (H_max, 0) 到 (0, V_max)
    // θ 从 0 到 π/2，步长 0.02 rad（约 1°）
    for (let rad = 0; rad <= Math.PI / 2; rad += Math.PI / 90) {
        // 椭圆参数化: H = H_max * cosθ, V = V_max * sinθ 满足椭圆方程
        // 对于一般椭圆: (H/H_max)^2 + (V/V_max)^2 = 1
        let H = H_max * Math.cos(rad);
        let V = V_max * Math.sin(rad);
        
        // 过滤无效点
        if (isFinite(H) && isFinite(V) && H >= 0 && V >= 0) {
            // 避免重复点
            if (envelopePoints.length === 0 || 
                Math.abs(envelopePoints[envelopePoints.length-1].x - H) > 0.1 ||
                Math.abs(envelopePoints[envelopePoints.length-1].y - V) > 0.1) {
                envelopePoints.push({ x: H, y: V });
            }
        }
    }
    
    // 确保起点和终点存在
    envelopePoints.unshift({ x: H_max, y: 0 });
    envelopePoints.push({ x: 0, y: V_max });
    
    // ========== 2. 椭圆采样点（验证包络面正确性） ==========
    // 这些点是椭圆上等角度间隔的点，用于验证理论曲线
    const sampleAngles = [0, 15, 30, 45, 60, 75, 90];
    const samplePoints = [];
    
    for (const theta of sampleAngles) {
        const rad = theta * Math.PI / 180;
        let H = H_max * Math.cos(rad);
        let V = V_max * Math.sin(rad);
        
        samplePoints.push({
            theta: theta,
            H: H,
            V: V,
            source: '椭圆包络面'
        });
    }
    
    // ========== 3. 设计荷载点 ==========
    // 从输入参数中获取设计荷载
    const designLoad_H = params.design_load_H || 0;  // 水平设计荷载 (kN)
    const designLoad_V = params.design_load_V || 0;  // 竖向设计荷载 (kN)
    
    // 当前计算点的位置（极限承载力）
    // 注意：重力锚的计算结果是极限值，不是设计值
    const currentPoint = { x: H_max, y: V_max };
    
    // ========== 4. 安全区域标识（包络线内部） ==========
    // 添加一个灰色区域表示"安全区"
    const fillPoints = [
        { x: 0, y: 0 },
        ...envelopePoints,
        { x: 0, y: V_max }
    ];
    
    // 返回 Chart.js 配置
    return {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: '破坏包络面 (理论极限)',
                    data: envelopePoints,
                    type: 'line',
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.05)',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    showLine: true,
                    tension: 0.2,
                    fill: false,
                    order: 2
                },
                {
                    label: '包络面内部区域 (安全区)',
                    data: fillPoints,
                    type: 'line',
                    borderColor: 'rgba(14, 165, 233, 0)',
                    backgroundColor: 'rgba(14, 165, 233, 0.08)',
                    borderWidth: 0,
                    pointRadius: 0,
                    showLine: true,
                    fill: true,
                    order: 3
                },
                {
                    label: '包络面采样点',
                    data: samplePoints.map(p => ({ x: p.H, y: p.V })),
                    type: 'scatter',
                    borderColor: '#f59e0b',
                    backgroundColor: '#f59e0b',
                    borderWidth: 0,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#d97706',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    showLine: false,
                    order: 1
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
                            
                            if (datasetLabel === '包络面采样点') {
                                const idx = context.dataIndex;
                                const point = samplePoints[idx];
                                return [
                                    `加载角: ${point.theta}°`,
                                    `水平承载力 H = ${x.toFixed(2)} kN`,
                                    `竖向承载力 V = ${y.toFixed(2)} kN`
                                ];
                            } else if (datasetLabel === '破坏包络面 (理论极限)') {
                                // 计算对应的加载角
                                let ratio = (x / H_max) / (y / V_max);
                                let thetaEst = '—';
                                if (y > 0 && x > 0) {
                                    const rad = Math.atan(x / y);
                                    thetaEst = (rad * 180 / Math.PI).toFixed(1);
                                } else if (x > 0 && y === 0) {
                                    thetaEst = '0';
                                } else if (x === 0 && y > 0) {
                                    thetaEst = '90';
                                }
                                return [
                                    `水平极限 H = ${x.toFixed(2)} kN`,
                                    `竖向极限 V = ${y.toFixed(2)} kN`,
                                    thetaEst !== '—' ? `等效加载角 ≈ ${thetaEst}°` : ''
                                ].filter(Boolean);
                            } else {
                                return [
                                    `${datasetLabel}`,
                                    `H = ${x.toFixed(2)} kN`,
                                    `V = ${y.toFixed(2)} kN`
                                ];
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
                    text: `⚓ 重力锚破坏包络面 | H_max = ${H_max.toFixed(1)} kN, V_max = ${V_max.toFixed(1)} kN`,
                    font: { size: 14, weight: 'bold' },
                    padding: { bottom: 15 }
                },
                subtitle: {
                    display: true,
                    text: '椭圆模型: (H/H_max)² + (V/V_max)² = 1',
                    font: { size: 11, style: 'italic' },
                    padding: { bottom: 10 },
                    color: '#64748b'
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
                    min: 0,
                    max: Math.ceil(H_max * 1.1 / 100) * 100
                },
                y: {
                    title: {
                        display: true,
                        text: '竖向承载力 V (kN)',
                        font: { weight: 'bold', size: 12 }
                    },
                    grid: { color: '#e2e8f0' },
                    beginAtZero: true,
                    min: 0,
                    max: Math.ceil(V_max * 1.1 / 100) * 100
                }
            }
        }
    };
}

/**
 * 判断是否需要显示图表
 * @param {Object} params - 输入参数
 * @param {Object} result - 计算结果
 * @returns {boolean}
 */
export function shouldShowChart(params, result) {
    if (!result || !result.details) return false;
    const horizontal = result.details.horizontal_capacity?.horizontal_capacity_kN;
    const uplift = result.details.uplift_capacity?.uplift_capacity_kN;
    return horizontal !== undefined && uplift !== undefined && horizontal > 0 && uplift > 0;
}