/**
 * @filepath: js/Anchor/dragAnchor/chart.js
 * @description: 拖曳锚模块图表生成器 - 修复横轴刻度
 */

export function generateChartConfig(params, result, calculateFn) {
    const soilType = params.soil_type || 'clay';
    const usePreset = params.use_preset;
    
    // 获取当前锚板尺寸信息
    let anchorLabel = '';
    if (usePreset) {
        const anchorType = params.anchor_type;
        if (anchorType === 'small') anchorLabel = '小锚板 (20cm×20cm)';
        else if (anchorType === 'medium') anchorLabel = '中锚板 (25cm×25cm)';
        else anchorLabel = '大锚板 (30cm×30cm)';
    } else {
        anchorLabel = `自定义锚板 (${params.custom_length || 0.3}m × ${params.custom_width || 0.3}m)`;
    }
    
    // 系缆夹角采样范围（0° ~ 45°，步长 2.5°）
    const cAngles = [];
    for (let c = 0; c <= 45; c += 2.5) {
        cAngles.push(Number(c.toFixed(1)));  // 确保数字精度
    }
    
    // 批量计算各夹角下的极限嵌入深度
    const zUedValues = [];
    
    for (const c of cAngles) {
        const testParams = { ...params, c_deg: c };
        
        try {
            const testResult = calculateFn(testParams);
            let zUed = testResult?.details?.z_ued_m;
            
            if (zUed === undefined || isNaN(zUed)) {
                zUed = 0;
            }
            zUedValues.push(zUed);
        } catch (err) {
            console.warn(`拖曳锚图表: 计算夹角 ${c}° 时出错`, err);
            zUedValues.push(0);
        }
    }
    
    // 检查是否有有效数据
    const hasValidData = zUedValues.some(v => v > 0);
    if (!hasValidData) {
        console.warn('拖曳锚图表: 所有计算值均为 0');
        return createPlaceholderChart(cAngles, zUedValues, soilType, anchorLabel);
    }
    
    const soilLabel = soilType === 'clay' ? '饱和黏土' : '饱和砂土';
    const soilColor = soilType === 'clay' ? '#0ea5e9' : '#f59e0b';
    const soilBgColor = soilType === 'clay' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(245, 158, 11, 0.1)';
    const currentZ = result?.details?.z_ued_m || 0;
    const currentC = params.c_deg || 30;
    
    // 生成 x 轴标签（所有采样点）
    const xLabels = cAngles.map(c => `${c}°`);
    
    return {
        type: 'line',
        data: {
            labels: xLabels,
            datasets: [
                {
                    label: `极限嵌入深度 z_UED (${soilLabel})`,
                    data: zUedValues,
                    borderColor: soilColor,
                    backgroundColor: soilBgColor,
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointBackgroundColor: soilColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    tension: 0.2,
                    fill: true,
                    spanGaps: true
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
                            const value = context.raw;
                            if (value <= 0) {
                                return `极限嵌入深度: 计算无效 (请检查输入参数)`;
                            }
                            return `极限嵌入深度: ${value.toFixed(3)} m (${(value * 1000).toFixed(1)} mm)`;
                        },
                        footer: function(tooltipItems) {
                            const idx = tooltipItems[0].dataIndex;
                            const c = cAngles[idx];
                            if (Math.abs(c - currentC) < 1) {
                                return `系缆夹角 c = ${c}° ← 当前计算值`;
                            }
                            return `系缆夹角 c = ${c}°`;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: { font: { size: 11 } }
                },
                title: {
                    display: true,
                    text: `📈 极限嵌入深度 z_UED 随系缆夹角 c 变化曲线`,
                    font: { size: 14, weight: 'bold' },
                    padding: { bottom: 10 }
                },
                subtitle: {
                    display: true,
                    text: `锚板: ${anchorLabel} | 土体: ${soilLabel} | 当前 c = ${currentC}°, z = ${currentZ.toFixed(3)} m`,
                    font: { size: 11, style: 'italic' },
                    padding: { bottom: 15 },
                    color: '#64748b'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '系缆夹角 c (°)',
                        font: { weight: 'bold', size: 12 }
                    },
                    grid: { color: '#e2e8f0' },
                    // ✅ 修复方案：使用 category 类型，显示所有标签
                    type: 'category',
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: false,      // 不跳过任何标签
                        // 可选：如果标签太密集，可以设置 stepSize
                        // stepSize: 2,        // 每2个显示一个
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '极限嵌入深度 z_UED (m)',
                        font: { weight: 'bold', size: 12 }
                    },
                    grid: { color: '#e2e8f0' },
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + ' m';
                        }
                    }
                }
            },
            layout: {
                padding: {
                    bottom: 10,
                    left: 10,
                    right: 10
                }
            }
        }
    };
}

function createPlaceholderChart(cAngles, zUedValues, soilType, anchorLabel) {
    const soilLabel = soilType === 'clay' ? '饱和黏土' : '饱和砂土';
    const xLabels = cAngles.map(c => `${c}°`);
    
    return {
        type: 'line',
        data: {
            labels: xLabels,
            datasets: [
                {
                    label: `极限嵌入深度 z_UED (${soilLabel}) - 计算异常`,
                    data: zUedValues,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    pointRadius: 4,
                    borderDash: [5, 5],
                    tension: 0.2,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function() {
                            return '⚠️ 计算异常，请检查输入参数';
                        }
                    }
                },
                legend: { position: 'top' },
                title: {
                    display: true,
                    text: `⚠️ 图表计算异常 - 请检查计算模块`,
                    font: { size: 14, weight: 'bold', color: '#ef4444' }
                },
                subtitle: {
                    display: true,
                    text: `锚板: ${anchorLabel} | 土体: ${soilLabel} | 所有计算结果均为 0`,
                    font: { size: 11, fontStyle: 'italic' },
                    color: '#ef4444'
                }
            },
            scales: {
                x: {
                    title: { display: true, text: '系缆夹角 c (°)' },
                    type: 'category',
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: false
                    }
                },
                y: {
                    title: { display: true, text: '极限嵌入深度 z_UED (m)' },
                    beginAtZero: true
                }
            }
        }
    };
}

export function shouldShowChart(params, result) {
    if (!result || !result.details) return false;
    return true;
}