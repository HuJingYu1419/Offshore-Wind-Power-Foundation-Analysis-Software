// Project/js/modules/slope.js

/**
 * 边坡稳定性计算模块
 * 瑞典圆弧法
 */

export const slope = {
    id: 'slope',
    name: "边坡稳定性计算",
    formula: "F_s = Σ(M_r)/Σ(M_s)",
    description: "瑞典圆弧法安全系数",
    parameters: [
        { id: "c", name: "土体粘聚力", unit: "kPa", default: 25 },
        { id: "phi", name: "内摩擦角", unit: "°", default: 30 },
        { id: "gamma", name: "土体重度", unit: "kN/m³", default: 19 },
        { id: "H", name: "边坡高度", unit: "m", default: 10 },
        { id: "beta", name: "边坡角", unit: "°", default: 35 },
        { id: "r", name: "滑弧半径", unit: "m", default: 15 }
    ],
    
    /**
     * 计算边坡安全系数
     * @param {Object} params - 参数对象
     * @returns {Object} 计算结果
     */
    calculate(params) {
        const radBeta = params.beta * Math.PI / 180;
        const radPhi = params.phi * Math.PI / 180;
        const numerator = params.c * params.r + 
                         params.gamma * params.H * Math.cos(radBeta) * 
                         params.r * Math.tan(radPhi);
        const denominator = params.gamma * params.H * Math.sin(radBeta) * params.r;
        const result = numerator / denominator;
        return {
            value: result,
            unit: "",
            text: `边坡安全系数: ${result.toFixed(3)}`
        };
    }
};