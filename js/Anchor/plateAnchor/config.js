/**
 * @filepath: js/Anchor/plateAnchor/config.js
 * @description: 板锚模块参数配置 - 均质黏土中水平板锚抗拔承载力计算
 *               基于 Merfield et al. (2003) 下限解理论
 */

export const id = 'plate';
export const name = '板锚承载力计算';
export const description = '均质黏土中水平板锚抗拔承载力计算，支持方形、圆形、矩形三种锚板形状';

export const parameters = [
    // ========== 计算模式 ==========
    {
        id: "shape",
        name: "形状 (锚板形状)",
        unit: "",
        default: "square",
        category: "mode",
        options: ["square", "circular", "rectangular"],
        optionsLabel: ["⬛ 方形锚", "⚪ 圆形锚", "📏 矩形锚"],
        note: "选择锚板几何形状"
    },
    
    // ========== 几何参数 ==========
    {
        id: "width",
        name: "B/D (特征尺寸)",
        unit: "m",
        default: 0.5,
        category: "geometry",
        min: 0.05,
        max: 5.0,
        step: 0.05,
        note: "B—方形锚边长 / D—圆形锚直径 / B—矩形锚短边"
    },
    {
        id: "length",
        name: "L (矩形锚长边)",
        unit: "m",
        default: 1.0,
        category: "geometry",
        condition: { shape: "rectangular" },
        min: 0.1,
        max: 10.0,
        step: 0.1,
        note: "仅矩形锚需要，L ≥ B"
    },
    {
        id: "embedment_depth",
        name: "H (锚板埋深)",
        unit: "m",
        default: 2.5,
        category: "geometry",
        min: 0.2,
        max: 20.0,
        step: 0.1,
        note: "H—从泥面到锚板顶面的深度"
    },
    
    // ========== 土体参数 ==========
    {
        id: "undrained_strength",
        name: "s_u (不排水抗剪强度)",
        unit: "kPa",
        default: 50.0,
        category: "soil",
        min: 5,
        max: 200,
        step: 1,
        note: "s_u—均质黏土常数强度值"
    },
    {
        id: "unit_weight",
        name: "γ' (土体浮容重)",
        unit: "kN/m³",
        default: 8.0,
        category: "soil",
        min: 3,
        max: 12,
        step: 0.5,
        note: "γ'—水下有效重度"
    },
    
    // ========== 折减系数 ==========
    {
        id: "reduction_factor",
        name: "η (土壤扰动折减系数)",
        unit: "",
        default: 0.75,
        category: "coefficient",
        min: 0.5,
        max: 1.0,
        step: 0.05,
        note: "η—考虑安装扰动影响，DNV规范建议0.75"
    }
];