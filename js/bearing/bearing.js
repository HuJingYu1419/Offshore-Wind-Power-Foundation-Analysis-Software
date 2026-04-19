
// Project/js/modules/bearing.js

/**
 * 地基承载力计算模块
 * Terzaghi承载力公式
 */

export const bearing = {
    id: 'bearing',
    name: "地基承载力计算",
    formula: "q_u = cN_c + qN_q + 0.5γBN_γ",
    description: "Terzaghi地基承载力公式",
    parameters: [
        { id: "c", name: "粘聚力", unit: "kPa", default: 20 },
        { id: "q", name: "基础埋深处有效应力", unit: "kPa", default: 50 },
        { id: "gamma", name: "土体重度", unit: "kN/m³", default: 18 },
        { id: "B", name: "基础宽度", unit: "m", default: 3 },
        { id: "Nc", name: "承载力系数Nc", unit: "", default: 5.7 },
        { id: "Nq", name: "承载力系数Nq", unit: "", default: 1.0 },
        { id: "Ngamma", name: "承载力系数Nγ", unit: "", default: 0.0 }
    ],
    
    /**
     * 计算地基极限承载力
     * @param {Object} params - 参数对象
     * @returns {Object} 计算结果
     */
    calculate(params) {
        const result = params.c * params.Nc + 
                       params.q * params.Nq + 
                       0.5 * params.gamma * params.B * params.Ngamma;
        return {
            value: result,
            unit: "kPa",
            text: `地基极限承载力: ${result.toFixed(2)} kPa`
        };
    }
};