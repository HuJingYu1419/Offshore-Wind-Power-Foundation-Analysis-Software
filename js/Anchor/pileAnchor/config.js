/**
 * @filepath: js/Anchor/pileAnchor/config.js
 * @description: 桩锚模块参数配置 - 刚性锚桩斜向抗拔承载力计算
 *               基于黄挺等(2023)论文《密实砂中刚性锚桩斜向抗拔承载特性》
 */

export const id = 'pile';
export const name = '刚性锚桩斜向抗拔承载力计算';
export const description = '密实砂土中刚性锚桩斜向抗拔承载力计算，包含竖向承载力Vu、水平承载力Hu及破坏包络面模型';

export const parameters = [
    // ========== 桩体参数 ==========
    { id: "L", name: "L (桩长)", unit: "m", default: 6.0, category: "geometry", min: 1, max: 20, step: 0.1, note: "L—桩体长度" },
    { id: "D", name: "D (桩径)", unit: "m", default: 3.0, category: "geometry", min: 0.5, max: 8, step: 0.1, note: "D—桩体直径" },
    { id: "m_pile", name: "m (桩质量)", unit: "t", default: 37.518, category: "geometry", min: 1, max: 200, step: 1, note: "m—桩体质量" },
    { id: "e", name: "e (荷载偏心距)", unit: "m", default: -0.3, category: "geometry", min: -5, max: 5, step: 0.1, note: "e—负值:桩顶以下，正值:桩顶以上" },
    
    // ========== 土体参数 ==========
    { id: "phi_deg", name: "φ (砂土峰值摩擦角)", unit: "°", default: 39.0, category: "soil", min: 15, max: 45, step: 1, note: "φ—砂土抗剪强度参数" },
    { id: "gamma", name: "γ' (土体有效重度)", unit: "kN/m³", default: 8.0, category: "soil", min: 3, max: 12, step: 0.5, note: "γ'—水下有效重度" },
    { id: "delta_deg", name: "δ (桩土界面摩擦角)", unit: "°", default: 30.0, category: "soil", min: 10, max: 45, step: 1, note: "δ—通常取(0.5~0.8)φ" },
    { id: "phi_crit_deg", name: "φ'_crit (临界状态摩擦角)", unit: "°", default: 33.0, category: "soil", min: 25, max: 40, step: 1, note: "φ'_crit—论文取值33°" },
    { id: "K0", name: "K₀ (侧向土压力系数)", unit: "", default: 0.4, category: "coefficient", min: 0.2, max: 0.8, step: 0.05, note: "K₀—静止土压力系数" },
    
    // ========== 经验系数 ==========
    { id: "eta", name: "η (桩前土压力形状系数)", unit: "", default: 1.61, category: "coefficient", min: 0.5, max: 2.5, step: 0.05, note: "η—参考推荐1.61" },
    { id: "xi", name: "ξ (侧剪阻力形状系数)", unit: "", default: 1.61, category: "coefficient", min: 0.5, max: 2.5, step: 0.05, note: "ξ—参考推荐1.61" },
    { id: "K_param", name: "K (水平土压力参数)", unit: "", default: 4.39, category: "coefficient", min: 1, max: 10, step: 0.1, note: "K—输入为0时自动取被动土压力系数Kp" },
    
    // ========== 荷载参数 ==========
    { id: "theta_deg", name: "θ (加载倾斜角)", unit: "°", default: 45.0, category: "load", min: 0, max: 90, step: 5, note: "θ—相对于水平方向" },
    
    // ========== 论文验证选项 ==========
    { id: "use_paper_hu", name: "使用论文Hu验证值", unit: "", default: false, category: "mode", options: [false, true], optionsLabel: ["使用公式计算H_u", "使用论文验证值(3349.85kN)"], note: "用于与论文结果对比" }
];