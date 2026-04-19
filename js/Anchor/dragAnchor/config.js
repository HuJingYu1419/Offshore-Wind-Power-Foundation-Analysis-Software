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
        optionsLabel: ["小锚板 As (20cm×20cm)", "中锚板 Am (25cm×25cm)", "大锚板 Al (30cm×30cm)"],
        condition: { use_preset: true },
        note: "参考论文表4-1"
    },
    { 
        id: "chain_type", name: "拖缆类型", unit: "", default: "wire", category: "mode",
        options: ["wire", "chain"],
        optionsLabel: ["钢索 (b = d)", "钢链 (b = 2.5d)"],
        note: "影响有效承载宽度"
    },
    
    // ========== 几何参数 ==========
    { 
        id: "c_deg", name: "系缆夹角 c", unit: "°", default: 30, category: "geometry",
        min: 0, max: 90, step: 1,
        note: "拖缆与锚板板面夹角，典型值20°-40°"
    },
    { 
        id: "theta_m_deg", name: "锚板抬平角 θm", unit: "°", default: 0, category: "geometry",
        min: 0, max: 30, step: 1,
        note: "极限嵌入状态下通常取0°"
    },
    { 
        id: "d", name: "拖缆直径", unit: "m", default: 0.006, category: "geometry",
        min: 0.001, max: 0.05, step: 0.001,
        note: "典型值6mm-20mm"
    },
    
    // ========== 自定义锚板参数 ==========
    { 
        id: "custom_length", name: "锚板长度", unit: "m", default: 0.250, category: "anchor",
        condition: { use_preset: false }, min: 0.05, max: 1.0, step: 0.01,
        note: "锚板纵向尺寸"
    },
    { 
        id: "custom_width", name: "锚板宽度", unit: "m", default: 0.250, category: "anchor",
        condition: { use_preset: false }, min: 0.05, max: 1.0, step: 0.01,
        note: "锚板横向尺寸"
    },
    { 
        id: "custom_thickness", name: "锚板厚度", unit: "m", default: 0.014, category: "anchor",
        condition: { use_preset: false }, min: 0.005, max: 0.05, step: 0.001,
        note: "锚板厚度"
    },
    { 
        id: "custom_A_bearing", name: "端阻力有效承载面积 A_bearing", unit: "m²", default: 3500e-6, category: "anchor",
        condition: { use_preset: false }, min: 1e-6, max: 0.01, step: 1e-6,
        note: "对应表4-1中 A_lb"
    },
    { 
        id: "custom_A_shearing", name: "剪切面积 A_shearing", unit: "m²", default: 132000e-6, category: "anchor",
        condition: { use_preset: false }, min: 1e-5, max: 0.001, step: 1e-6,
        note: "对应表4-1中 A_fs"
    },
    { 
        id: "custom_O", name: "系缆点至重心距离 O", unit: "m", default: 0.300, category: "anchor",
        condition: { use_preset: false }, min: 0.1, max: 0.5, step: 0.01,
        note: "系缆点至锚板重心的距离"
    },
    
    // ========== 饱和粘土参数 ==========
    { 
        id: "su0", name: "泥面不排水抗剪强度", unit: "kPa", default: 10, category: "soil",
        condition: { soil_type: "clay" }, min: 0, max: 100, step: 0.5,
        note: "表面土体强度"
    },
    { 
        id: "k", name: "抗剪强度梯度", unit: "kPa/m", default: 1.5, category: "soil",
        condition: { soil_type: "clay" }, min: 0, max: 10, step: 0.1,
        note: "强度随深度增长率"
    },
    { 
        id: "alpha", name: "粘滞系数 α", unit: "", default: 0.5, category: "coefficient",
        condition: { soil_type: "clay" }, min: 0.2, max: 0.8, step: 0.05,
        note: "典型值0.2-0.8"
    },
    { 
        id: "Nc", name: "承载力系数 Nc", unit: "", default: 7.6, category: "coefficient",
        condition: { soil_type: "clay" }, min: 5, max: 12, step: 0.1,
        note: "深埋时取7.6"
    },
    
    // ========== 饱和砂土参数 ==========
    { 
        id: "gamma", name: "土体浮容重", unit: "kN/m³", default: 10.0, category: "soil",
        condition: { soil_type: "sand" }, min: 3, max: 12, step: 0.1,
        note: "水下有效重度"
    },
    { 
        id: "phi", name: "内摩擦角 φ", unit: "°", default: 25, category: "soil",
        condition: { soil_type: "sand" }, min: 15, max: 45, step: 1,
        note: "砂土抗剪强度参数"
    },
    { 
        id: "delta_fac", name: "摩擦比 tanδ/tanφ", unit: "", default: 0.5, category: "soil",
        condition: { soil_type: "sand" }, min: 0.3, max: 0.8, step: 0.05,
        note: "外摩擦角系数，通常取0.5"
    },
    { 
        id: "K0", name: "侧压力系数 K0", unit: "", default: 0.5, category: "coefficient",
        condition: { soil_type: "sand" }, min: 0.3, max: 0.7, step: 0.05,
        note: "静止土压力系数"
    }
];