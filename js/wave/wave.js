// Project/js/modules/wave.js

/**
 * 波浪荷载计算模块
 * Morison方程
 */

export const wave = {
    id: 'wave',
    name: "波浪荷载计算",
    formula: "F = ρC_M ∀(du/dt) + 0.5ρC_D A|u|u",
    description: "Morison方程",
    parameters: [
        { id: "rho", name: "海水密度", unit: "kg/m³", default: 1025 },
        { id: "CM", name: "惯性力系数", unit: "", default: 2.0 },
        { id: "V", name: "构件体积", unit: "m³", default: 10 },
        { id: "du_dt", name: "水质点加速度", unit: "m/s²", default: 1.5 },
        { id: "CD", name: "阻力系数", unit: "", default: 1.2 },
        { id: "A", name: "构件投影面积", unit: "m²", default: 5 },
        { id: "u", name: "水质点速度", unit: "m/s", default: 2.0 }
    ],
    
    /**
     * 计算波浪总荷载
     * @param {Object} params - 参数对象
     * @returns {Object} 计算结果
     */
    calculate(params) {
        const inertiaForce = params.rho * params.CM * params.V * params.du_dt;
        const dragForce = 0.5 * params.rho * params.CD * params.A * 
                         Math.pow(Math.abs(params.u), 2);
        const result = inertiaForce + dragForce;
        return {
            value: result,
            unit: "N",
            text: `波浪总荷载: ${result.toFixed(2)} N`
        };
    }
};