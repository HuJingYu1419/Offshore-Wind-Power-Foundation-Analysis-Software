/**
 * @filepath: js/Anchor/plateAnchor/chart.js
 * @description: 板锚模块图表生成器
 *               绘制承载力系数 Nc 随埋深比 H/B (或 H/D) 的变化曲线
 *               基于 Merfield et al. (2003) 下限解理论
 */

/**
 * 生成图表数据集
 * @param {Object} params - 当前输入参数
 * @param {Object} result - 当前计算结果
 * @param {Function} calculateFn - 计算函数引用（用于批量计算）
 * @returns {Object} Chart.js 配置对象
 */
export function generateChartConfig(params, result, calculateFn) {
    // 1. 确定埋深比采样范围（通常 1~10）
    const embedmentRatios = [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
    
    // 2. 获取当前锚板形状和特征尺寸
    const shape = params.shape;
    const width = params.width;  // B 或 D
    const length = params.length;  // 仅矩形锚使用
    
    // 3. 固定其他参数，仅变化埋深比
    const baseParams = { ...params };
    
    // 4. 批量计算各埋深比下的承载力系数 Nc
    const ncValues = [];
    const quValues = [];
    const quReducedValues = [];
    
    for (const ratio of embedmentRatios) {
        // 更新埋深
        const testParams = { ...baseParams, embedment_depth: ratio * width };
        
        // 调用计算函数
        const testResult = calculateFn(testParams);
        const details = testResult?.details;
        
        if (details) {
            ncValues.push(details.N_c_final || 0);
            quValues.push(details.qu_unreduced_kPa || 0);
            quReducedValues.push(details.qu_reduced_kPa || 0);
        } else {
            ncValues.push(0);
            quValues.push(0);
            quReducedValues.push(0);
        }
    }
    
    // 5. 确定图表标题中的锚板类型
    let shapeLabel = '';
    switch (shape) {
        case 'square':
            shapeLabel = '方形锚 (B)';
            break;
        case 'circular':
            shapeLabel = '圆形锚 (D)';
            break;
        case 'rectangular':
            shapeLabel = `矩形锚 (B=${width}m, L=${length}m)`;
            break;
        default:
            shapeLabel = '板锚';
    }
    
    // 6. 返回 Chart.js 配置
    return {
        type: 'line',
        data: {
            labels: embedmentRatios.map(r => r.toFixed(1)),
            datasets: [
                {
                    label: '承载力系数 Nc',
                    data: ncValues,
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#0284c7',
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: '极限承载力 qu (未折减)',
                    data: quValues,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#d97706',
                    tension: 0.3,
                    fill: false,
                    borderDash: [5, 5],
                    yAxisID: 'y1'
                },
                {
                    label: '极限承载力 qu (折减后)',
                    data: quReducedValues,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#059669',
                    tension: 0.3,
                    fill: false,
                    yAxisID: 'y1'
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
                            const idx = context.dataIndex;
                            const label = context.dataset.label;
                            const value = context.raw;
                            
                            if (context.dataset.label === '承载力系数 Nc') {
                                return `${label}: ${value.toFixed(2)}`;
                            } else {
                                return `${label}: ${value.toFixed(2)} kPa`;
                            }
                        },
                        footer: function(tooltipItems) {
                            const idx = tooltipItems[0].dataIndex;
                            return `埋深比: ${embedmentRatios[idx].toFixed(1)}`;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: { font: { size: 11 } }
                },
                title: {
                    display: true,
                    text: `📈 承载力系数 Nc 随埋深比变化曲线 (${shapeLabel})`,
                    font: { size: 14, weight: 'bold' },
                    padding: { bottom: 15 }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: shape === 'circular' ? '埋深比 H/D' : '埋深比 H/B',
                        font: { weight: 'bold' }
                    },
                    grid: { color: '#e2e8f0' },
                    min: 0.5,
                    max: 10.5
                },
                y: {
                    title: {
                        display: true,
                        text: '承载力系数 Nc',
                        font: { weight: 'bold' },
                        color: '#0ea5e9'
                    },
                    grid: { color: '#e2e8f0' },
                    beginAtZero: true,
                    position: 'left'
                },
                y1: {
                    title: {
                        display: true,
                        text: '极限承载力 qu (kPa)',
                        font: { weight: 'bold' },
                        color: '#f59e0b'
                    },
                    grid: { drawOnChartArea: false },
                    position: 'right',
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
    if (!result || !result.details) return false;
    const ncFinal = result.details.N_c_final;
    return ncFinal !== undefined && ncFinal > 0;
}