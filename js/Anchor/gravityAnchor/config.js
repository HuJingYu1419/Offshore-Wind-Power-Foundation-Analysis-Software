/**
 * @filepath: js/Anchor/gravityAnchor/config.js
 * @description: 重力锚模块参数配置 - 黏土中重力锚承载力计算
 *               基于黄博晓(2021)硕士论文 + DNV/API规范
 */

export const id = 'gravity';
export const name = '重力锚承载力计算';
export const description = '黏土中重力锚水平承载力、上拔力、贯入阻力及防倾覆稳定性计算';

export const parameters = [
    // ========== 计算模式 ==========
    {
        id: "anchor_type",
        name: "重力锚类型",
        unit: "",
        default: "skirted",
        category: "mode",
        options: ["flat", "skirted"],
        optionsLabel: ["🏔️ 平底重力锚", "🛡️ 带剪力键(裙板)重力锚"],
        note: "选择锚体底部形式"
    },
    {
        id: "use_paper_nc",
        name: "使用论文Nc值",
        unit: "",
        default: true,
        category: "mode",
        options: [true, false],
        optionsLabel: ["✅ 使用论文Nc=6.095", "📖 使用规范Nc=9.0"],
        note: "影响上拔力和贯入阻力计算"
    },
    {
        id: "contact_type",
        name: "锚土接触类型",
        unit: "",
        default: "rough",
        category: "mode",
        options: ["rough", "smooth"],
        optionsLabel: ["🏭 粗糙接触", "✨ 光滑接触"],
        note: "影响修正因子F计算"
    },
    
    // ========== 几何参数 ==========
    {
        id: "L",
        name: "锚长度",
        unit: "m",
        default: 3.0,
        category: "geometry",
        min: 0.5, max: 10.0, step: 0.1,
        note: "锚体长度 (沿受力方向)"
    },
    {
        id: "B",
        name: "锚宽度",
        unit: "m",
        default: 3.0,
        category: "geometry",
        min: 0.5, max: 10.0, step: 0.1,
        note: "锚体宽度"
    },
    {
        id: "H",
        name: "锚高度",
        unit: "m",
        default: 1.5,
        category: "geometry",
        min: 0.3, max: 5.0, step: 0.1,
        note: "锚体高度"
    },
    {
        id: "skirt_depth",
        name: "裙板贯入深度",
        unit: "m",
        default: 0.26,
        category: "geometry",
        min: 0, max: 2.0, step: 0.01,
        note: "剪力键/裙板贯入土中深度，平底锚设为0"
    },
    {
        id: "weight_in_water",
        name: "水中锚重量",
        unit: "kN",
        default: 666.8,
        category: "geometry",
        min: 10, max: 5000, step: 10,
        note: "锚体在水中的有效重量"
    },
    
    // ========== 土体参数 ==========
    {
        id: "Sum",
        name: "泥线处不排水抗剪强度",
        unit: "kPa",
        default: 3.15,
        category: "soil",
        min: 0, max: 50, step: 0.1,
        note: "海床表面土体强度"
    },
    {
        id: "k",
        name: "抗剪强度梯度",
        unit: "kPa/m",
        default: 8.18,
        category: "soil",
        min: 0, max: 20, step: 0.1,
        note: "强度随深度增长率"
    },
    {
        id: "gamma_b",
        name: "土体浮容重",
        unit: "kN/m³",
        default: 10.15,
        category: "soil",
        min: 3, max: 12, step: 0.1,
        note: "水下有效重度"
    },
    {
        id: "alpha",
        name: "粘着系数 α",
        unit: "",
        default: 0.5,
        category: "soil",
        min: 0.2, max: 0.8, step: 0.05,
        note: "桩-土界面粘着系数"
    },
    
    // ========== 荷载参数（防倾覆计算） ==========
    {
        id: "design_load_T",
        name: "设计水平荷载 T",
        unit: "kN",
        default: 588.5,
        category: "load",
        min: 0, max: 10000, step: 10,
        note: "用于防倾覆计算的设计缆绳拉力"
    },
    {
        id: "A_arm",
        name: "倾覆力臂 A",
        unit: "m",
        default: 0.75,
        category: "load",
        min: 0.1, max: 5.0, step: 0.05,
        note: "缆绳作用点到锚前端支点的垂直距离"
    },
    {
        id: "L_arm",
        name: "抗倾覆力臂 L",
        unit: "m",
        default: 1.5,
        category: "load",
        min: 0.1, max: 5.0, step: 0.05,
        note: "锚自重作用点到倾覆支点的水平距离"
    },
    
    // ========== 贯入阻力参数 ==========
    {
        id: "penetration_depth",
        name: "贯入深度",
        unit: "m",
        default: 0.26,
        category: "geometry",
        min: 0, max: 2.0, step: 0.01,
        note: "计算贯入阻力时的贯入深度"
    }
];