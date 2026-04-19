/**
 * @filepath: js/Anchor/suctionAnchor/installation-sand/config.js
 * @description: 吸力锚 - 安装计算（砂土）参数配置
 */

export const id = 'suction-installation-sand';
export const name = '吸力锚安装计算（砂土）';
export const description = '砂土中吸力锚安装阻力计算（开发中）';

export const parameters = [
    { id: "D", name: "锚体直径", unit: "m", default: 5.0, category: "geometry" },
    { id: "L", name: "锚体长度", unit: "m", default: 10.0, category: "geometry" },
    { id: "phi", name: "内摩擦角", unit: "°", default: 30.0, category: "soil" },
    { id: "gamma", name: "浮容重", unit: "kN/m³", default: 10.0, category: "soil" },
    { id: "delta", name: "界面摩擦角", unit: "°", default: 20.0, category: "coefficient" }
];