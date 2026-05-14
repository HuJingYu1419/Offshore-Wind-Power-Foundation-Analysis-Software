/**
 * @filepath: js/Anchor/dragAnchor/config.js
 * @description: 拖曳锚模块参数配置 - 极限嵌入深度(UED)计算
 *               基于杨涵婷(2009)天津大学硕士学位论文
 */

export const id = 'drag';
export const name = '拖曳锚极限嵌入深度计算';
export const description = '饱和粘土/饱和砂土中拖曳锚极限嵌入深度(UED)计算';

export const parameters = [
    // ========== 计算模式 ==========
    { 
        id: "soil_type", name: "土体类型", unit: "", default: "clay", category: "mode",
        options: ["clay", "sand"], 
        optionsLabel: ["🏜️ 饱和粘土 (公式4-23)", "🏖️ 饱和砂土 (公式4-44)"],
        note: "选择地基土类型"
    },
    { 
        id: "use_preset", name: "使用预定义锚板", unit: "", default: true, category: "anchor",
        options: [true, false],
        optionsLabel: ["✅ 使用预定义规格", "✏️ 自定义锚板参数"],
        note: "选择锚板参数来源"
    },
    { 
        id: "anchor_type", name: "预定义锚板规格", unit: "", default: "medium", category: "anchor",
        options: ["small", "medium", "large"],
        optionsLabel: ["小锚板 A_s (20cm×20cm)", "中锚板 A_m (25cm×25cm)", "大锚板 A_l (30cm×30cm)"],
        condition: { use_preset: true },
        note: "参考论文表4-1"
    },
    { 
        id: "chain_type", name: "拖缆类型", unit: "", default: "wire", category: "mode",
        options: ["wire", "chain"],
        optionsLabel: ["钢索 (b = d)", "钢链 (b = 2.5d)"],
        note: "b—有效宽度，影响有效承载宽度"
    },
    
    // ========== 几何参数 ==========
    { 
        id: "c_deg", name: "c (系缆夹角)", unit: "°", default: 30, category: "geometry",
        min: 0, max: 90, step: 1,
        note: "c—拖缆与锚板板面夹角，典型值20°-40°"
    },
    { 
        id: "theta_m_deg", name: "θ_m (锚板抬平角)", unit: "°", default: 0, category: "geometry",
        min: 0, max: 30, step: 1,
        note: "θ_m—极限嵌入状态下通常取0°"
    },
    { 
        id: "d", name: "d (拖缆直径)", unit: "m", default: 0.006, category: "geometry",
        min: 0.001, max: 0.05, step: 0.001,
        note: "d—典型值6mm-20mm"
    },
    
    // ========== 自定义锚板参数 ==========
    { 
        id: "custom_length", name: "L (锚板长度)", unit: "m", default: 0.250, category: "anchor",
        condition: { use_preset: false }, min: 0.05, max: 1.0, step: 0.01,
        note: "L—锚板纵向尺寸"
    },
    { 
        id: "custom_width", name: "B (锚板宽度)", unit: "m", default: 0.250, category: "anchor",
        condition: { use_preset: false }, min: 0.05, max: 1.0, step: 0.01,
        note: "B—锚板横向尺寸"
    },
    { 
        id: "custom_thickness", name: "t (锚板厚度)", unit: "m", default: 0.014, category: "anchor",
        condition: { use_preset: false }, min: 0.005, max: 0.05, step: 0.001,
        note: "t—锚板厚度"
    },
    { 
        id: "custom_A_bearing", name: "A_b (端阻力有效承载面积)", unit: "m²", default: 3500e-6, category: "anchor",
        condition: { use_preset: false }, min: 1e-6, max: 0.01, step: 1e-6,
        note: "A_b—对应表4-1中 A_lb"
    },
    { 
        id: "custom_A_shearing", name: "A_s (剪切面积)", unit: "m²", default: 132000e-6, category: "anchor",
        condition: { use_preset: false }, min: 1e-5, max: 0.001, step: 1e-6,
        note: "A_s—对应表4-1中 A_fs"
    },
    { 
        id: "custom_O", name: "O (系缆点至重心距离)", unit: "m", default: 0.300, category: "anchor",
        condition: { use_preset: false }, min: 0.1, max: 0.5, step: 0.01,
        note: "O—系缆点至锚板重心的距离"
    },
    
    // ========== 饱和粘土参数 ==========
    { 
        id: "su0", name: "s_u₀ (泥面不排水抗剪强度)", unit: "kPa", default: 10, category: "soil",
        condition: { soil_type: "clay" }, min: 0, max: 100, step: 0.5,
        note: "s_u₀—表面土体强度"
    },
    { 
        id: "k", name: "k (抗剪强度梯度)", unit: "kPa/m", default: 1.5, category: "soil",
        condition: { soil_type: "clay" }, min: 0, max: 10, step: 0.1,
        note: "k—强度随深度增长率"
    },
    { 
        id: "alpha", name: "α (粘滞系数)", unit: "", default: 0.5, category: "coefficient",
        condition: { soil_type: "clay" }, min: 0.2, max: 0.8, step: 0.05,
        note: "α—典型值0.2-0.8"
    },
    { 
        id: "Nc", name: "N_c (承载力系数)", unit: "", default: 7.6, category: "coefficient",
        condition: { soil_type: "clay" }, min: 5, max: 12, step: 0.1,
        note: "N_c—深埋时取7.6"
    },
    
    // ========== 饱和砂土参数 ==========
    { 
        id: "gamma", name: "γ' (土体浮容重)", unit: "kN/m³", default: 10.0, category: "soil",
        condition: { soil_type: "sand" }, min: 3, max: 12, step: 0.1,
        note: "γ'—水下有效重度"
    },
    { 
        id: "phi", name: "φ (内摩擦角)", unit: "°", default: 25, category: "soil",
        condition: { soil_type: "sand" }, min: 15, max: 45, step: 1,
        note: "φ—砂土抗剪强度参数"
    },
    { 
        id: "delta_fac", name: "tanδ/tanφ (摩擦比)", unit: "", default: 0.5, category: "soil",
        condition: { soil_type: "sand" }, min: 0.3, max: 0.8, step: 0.05,
        note: "δ—外摩擦角，通常取δ=0.5φ"
    },
    { 
        id: "K0", name: "K₀ (侧压力系数)", unit: "", default: 0.5, category: "coefficient",
        condition: { soil_type: "sand" }, min: 0.3, max: 0.7, step: 0.05,
        note: "K₀—静止土压力系数"
    }
];