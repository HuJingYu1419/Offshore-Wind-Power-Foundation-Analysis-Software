/**
 * @filepath: js/Anchor/torpedoAnchor/horizontal-capacity/config.js
 * @description: 鱼雷锚 - 水平承载力模块参数配置（占位）
 */

export const id = 'horizontal-capacity';
export const name = '鱼雷锚水平承载力计算';
export const description = '基于极限平衡法，计算鱼雷锚水平极限承载力（开发中）';

export const parameters = [
    { id: "D", name: "锚体直径", unit: "m", default: 1.07, category: "geometry" },
    { id: "L", name: "锚体长度", unit: "m", default: 17.0, category: "geometry" },
    { id: "embedment_depth", name: "埋入深度", unit: "m", default: 15.0, category: "geometry" },
    { id: "su_avg", name: "平均不排水抗剪强度", unit: "kPa", default: 50.0, category: "soil" },
    { id: "gamma_soil_sub", name: "土体有效浮重度", unit: "kN/m³", default: 6.0, category: "soil" },
];