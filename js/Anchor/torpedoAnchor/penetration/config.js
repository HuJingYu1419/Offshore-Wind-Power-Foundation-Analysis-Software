/**
 * @filepath: js/Anchor/torpedoAnchor/penetration/config.js
 * @description: 鱼雷锚 - 安装贯入深度预测模块参数配置（占位）
 */

export const id = 'penetration';
export const name = '鱼雷锚安装贯入深度预测';
export const description = '基于能量法和土体阻力模型，预测鱼雷锚安装贯入深度（开发中）';

export const parameters = [
    { id: "W", name: "锚体自重（空气中）", unit: "kN", default: 800.0, category: "anchor" },
    { id: "H_drop", name: "投放高度", unit: "m", default: 50.0, category: "anchor" },
    { id: "v_impact", name: "触底速度", unit: "m/s", default: 25.0, category: "anchor" },
    { id: "D", name: "锚体直径", unit: "m", default: 1.07, category: "geometry" },
    { id: "su_avg", name: "平均不排水抗剪强度", unit: "kPa", default: 30.0, category: "soil" },
    { id: "k_su", name: "抗剪强度梯度", unit: "kPa/m", default: 1.5, category: "soil" },
];