// Project/js/modules/settlement.js

/**
 * 沉降计算模块
 * 弹性理论沉降公式
 */

export const settlement = {
    id: 'settlement',
    name: "沉降计算",
    formula: "S = (qB(1-ν²)/E) * I",
    description: "弹性理论沉降公式",
    parameters: [
        { id: "q", name: "基底附加应力", unit: "kPa", default: 100 },
        { id: "B", name: "基础宽度", unit: "m", default: 3 },
        { id: "nu", name: "泊松比", unit: "", default: 0.3 },
        { id: "E", name: "土体变形模量", unit: "MPa", default: 20 },
        { id: "I", name: "沉降影响系数", unit: "", default: 0.8 }
    ],
    
    /**
     * 计算基础沉降量
     * @param {Object} params - 参数对象
     * @returns {Object} 计算结果
     */
    calculate(params) {
        // E从MPa转换为kPa
        const result = (params.q * params.B * (1 - Math.pow(params.nu, 2)) / 
                       (params.E * 1000)) * params.I * 1000;
        return {
            value: result,
            unit: "mm",
            text: `基础沉降量: ${result.toFixed(2)} mm`
        };
    }
};