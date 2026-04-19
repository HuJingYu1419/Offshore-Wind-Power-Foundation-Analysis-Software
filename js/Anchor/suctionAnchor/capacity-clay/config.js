/**
 * @filepath: js/Anchor/suctionAnchor/capacity-clay/config.js
 * @description: 吸力锚 - 承载力计算（黏土）参数配置
 */

export const id = 'suction-capacity-clay';
export const name = '吸力锚承载力计算（黏土）';
export const description = '黏土中吸力锚极限承载力计算（开发中）';

export const parameters = [
    { id: "D", name: "锚体直径", unit: "m", default: 5.0, category: "geometry" },
    { id: "L", name: "锚体长度", unit: "m", default: 10.0, category: "geometry" },
    { id: "su0", name: "泥面抗剪强度", unit: "kPa", default: 5.0, category: "soil" },
    { id: "k", name: "强度梯度", unit: "kPa/m", default: 1.5, category: "soil" },
    { id: "Nc", name: "承载力系数", unit: "", default: 12.5, category: "coefficient" }
];