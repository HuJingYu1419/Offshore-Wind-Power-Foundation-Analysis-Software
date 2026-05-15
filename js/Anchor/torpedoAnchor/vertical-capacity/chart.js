/**
 * @filepath: js/Anchor/torpedoAnchor/vertical-capacity/chart.js
 * @description: 鱼雷锚竖向承载力模块图表生成器
 *               绘制承载力 vs 埋深比 (L/D) 的敏感性曲线
 *               固定其他参数，变化埋深比，观察竖向承载力变化趋势
 */

/**
 * 生成图表数据集
 * @param {Object} params - 当前输入参数
 * @param {Object} result - 当前计算结果（用于获取计算函数）
 * @param {Function} calculateFn - 计算函数引用（用于批量计算）
 * @returns {Object} Chart.js 配置对象
 */
export function generateChartConfig(params, result, calculateFn) {
    // 1. 确定采样参数
    const embedmentRatios = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
    
    // 2. 固定其他参数，仅变化埋深比
    const baseParams = { ...params };
    
    // 3. 批量计算各埋深比下的承载力
    const capacities = [];
    const tipDepths = [];
    
    for (const ratio of embedmentRatios) {
        // 更新埋深倍数
        const testParams = { ...baseParams, embedment_ratio: ratio };
        
        // 调用计算函数
        const testResult = calculateFn(testParams);
        const capacity = testResult?.details?.total ? parseFloat(testResult.details.total) : 0;
        const tipDepth = testResult?.details?.embedment_tip ? parseFloat(testResult.details.tip_depth_m) : 0;
        
        capacities.push(capacity);
        tipDepths.push(tipDepth);
    }
    
    // 4. 返回 Chart.js 配置
    return {
        type: 'line',
        data: {
            labels: embedmentRatios.map(r => r.toFixed(1)),
            datasets: [
                {
                    label: '竖向极限承载力',
                    data: capacities,
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#0284c7',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            const idx = context.dataIndex;
                            return [
                                `承载力: ${capacities[idx].toFixed(2)} kN`,
                                `锚尖深度: ${tipDepths[idx].toFixed(2)} m`
                            ];
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: { font: { size: 12 } }
                },
                title: {
                    display: true,
                    text: '📈 竖向承载力 vs 埋深比 (L/D)',
                    font: { size: 14, weight: 'bold' },
                    padding: { bottom: 15 }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '埋深比 (埋深 / 锚径)',
                        font: { weight: 'bold' }
                    },
                    grid: { color: '#e2e8f0' }
                },
                y: {
                    title: {
                        display: true,
                        text: '竖向极限承载力 (kN)',
                        font: { weight: 'bold' }
                    },
                    grid: { color: '#e2e8f0' },
                    beginAtZero: true
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
    // 当计算有效且承载力为正时显示图表
    if (!result || !result.details) return false;
    const total = parseFloat(result.details.total);
    return !isNaN(total) && total > 0;
}