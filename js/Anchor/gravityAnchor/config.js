/**
 * @filepath: js/Anchor/gravityAnchor/config.js
 * @description: 重力锚模块参数配置 - 黏土中重力锚承载力计算
 *               基于黄博晓(2021)硕士论文 + DNV/API规范
 * @version: 2.0 (添加条件显示：平底锚时隐藏裙板相关参数)
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
        default: "flat",
        category: "mode",
        options: ["flat", "skirted"],
        optionsLabel: ["🏔️ 平底重力锚", "🛡️ 带剪力键(裙板)重力锚"],
        note: "选择锚体底部形式"
    },
    {
        id: "use_paper_nc",
        name: "使用论文N_c值",
        unit: "",
        default: true,
        category: "mode",
        options: [true, false],
        optionsLabel: ["✅ 使用论文N_c=6.095", "📖 使用规范N_c=9.0"],
        note: "N_c—影响上拔力和贯入阻力计算"
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
        name: "L (锚长度)",
        unit: "m",
        default: 3.0,
        category: "geometry",
        min: 0.5, max: 10.0, step: 0.1,
        note: "L—锚体长度 (沿受力方向)"
    },
    {
        id: "B",
        name: "B (锚宽度)",
        unit: "m",
        default: 3.0,
        category: "geometry",
        min: 0.5, max: 10.0, step: 0.1,
        note: "B—锚体宽度"
    },
    {
        id: "H",
        name: "H (锚高度)",
        unit: "m",
        default: 1.5,
        category: "geometry",
        min: 0.3, max: 5.0, step: 0.1,
        note: "H—锚体高度"
    },
    
    // ========== 裙板参数（仅当 anchor_type = skirted 时显示） ==========
    {
        id: "skirt_depth",
        name: "z_s (裙板贯入深度)",
        unit: "m",
        default: 0.5,
        category: "geometry",
        min: 0, max: 2.0, step: 0.01,
        condition: { anchor_type: "skirted" },
        note: "z_s—剪力键/裙板贯入土中深度"
    },
    
    // ========== 平底锚专用参数（仅当 anchor_type = flat 时显示） ==========
    {
        id: "flat_anchor_effective_depth",
        name: "z (平底锚有效深度)",
        unit: "m",
        default: 0.26,
        category: "geometry",
        min: 0.05, max: 1.0, step: 0.01,
        condition: { anchor_type: "flat" },
        note: "z—平底锚水平承载力计算的有效深度，论文案例取0.26m"
    },
    
    // ========== 通用几何参数 ==========
    {
        id: "weight_in_water",
        name: "W (水中锚重量)",
        unit: "kN",
        default: 666.8,
        category: "geometry",
        min: 10, max: 5000, step: 10,
        note: "W—锚体在水中的有效重量"
    },
    
    // ========== 土体参数 ==========
    {
        id: "Sum",
        name: "s_u₀ (泥线处不排水抗剪强度)",
        unit: "kPa",
        default: 3.15,
        category: "soil",
        min: 0, max: 50, step: 0.1,
        note: "s_u₀—海床表面土体强度"
    },
    {
        id: "k",
        name: "k (抗剪强度梯度)",
        unit: "kPa/m",
        default: 8.18,
        category: "soil",
        min: 0, max: 20, step: 0.1,
        note: "k—强度随深度增长率"
    },
    {
        id: "gamma_b",
        name: "γ' (土体浮容重)",
        unit: "kN/m³",
        default: 10.15,
        category: "soil",
        min: 3, max: 12, step: 0.1,
        note: "γ'—水下有效重度"
    },
    {
        id: "alpha",
        name: "α (粘着系数)",
        unit: "",
        default: 0.5,
        category: "soil",
        min: 0.2, max: 0.8, step: 0.05,
        note: "α—桩-土界面粘着系数"
    },
    
    // ========== 荷载参数（防倾覆计算） ==========
    {
        id: "design_load_T",
        name: "T (设计水平荷载)",
        unit: "kN",
        default: 588.5,
        category: "load",
        min: 0, max: 10000, step: 10,
        note: "T—用于防倾覆计算的设计缆绳拉力"
    },
    {
        id: "A_arm",
        name: "A (倾覆力臂)",
        unit: "m",
        default: 0.75,
        category: "load",
        min: 0.1, max: 5.0, step: 0.05,
        note: "A—缆绳作用点到锚前端支点的垂直距离"
    },
    {
        id: "L_arm",
        name: "L_arm (抗倾覆力臂)",
        unit: "m",
        default: 1.5,
        category: "load",
        min: 0.1, max: 5.0, step: 0.05,
        note: "L_arm—锚自重作用点到倾覆支点的水平距离"
    },
    
    // ========== 贯入阻力参数 ==========
    {
        id: "penetration_depth",
        name: "z_pen (贯入深度)",
        unit: "m",
        default: 0.26,
        category: "geometry",
        min: 0, max: 2.0, step: 0.01,
        note: "z_pen—计算贯入阻力时的贯入深度"
    }
];