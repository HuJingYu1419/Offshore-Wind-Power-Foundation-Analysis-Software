/**
 * @filepath: js/Anchor/torpedoAnchor/vertical-capacity/config.js
 * @description: 鱼雷锚 - 竖向承载力模块参数配置
 *              每个参数均包含符号、中文名称、单位、默认值和分类
 */

export const id = 'vertical-capacity';  
export const name = '鱼雷锚竖向承载力计算';  
export const description = '基于Randolph & Murphy (R&M)公式，支持短期/长期两种计算模式';

export const parameters = [
    // ========== 锚体几何参数 ==========
    { id: "L", name: "L (锚体总长度)", unit: "m", default: 17.0, category: "geometry" },
    { id: "D", name: "D (锚体直径)", unit: "m", default: 1.07, category: "geometry" },
    { id: "Lt", name: "Lₜ (锚尖圆锥长度)", unit: "m", default: 2.0, category: "geometry" },
    { id: "n_fins", name: "n (锚翼数量)", unit: "", default: 4, category: "geometry" },
    { id: "L_fin", name: "L_f (锚翼总长度)", unit: "m", default: 10.0, category: "geometry" },
    { id: "W_fin", name: "W_f (锚翼宽度)", unit: "m", default: 0.9, category: "geometry" },
    { id: "t_fin", name: "t_f (锚翼厚度)", unit: "m", default: 0.1, category: "geometry" },
    
    // ========== 材料与环境参数 ==========
    { id: "rho_steel", name: "ρₛ (钢材密度)", unit: "kg/m³", default: 7850, category: "material" },
    { id: "gamma_w", name: "γ_w (水容重)", unit: "kN/m³", default: 10.0, category: "environment" },
    { id: "gamma_soil_sub", name: "γ' (土体有效浮重度)", unit: "kN/m³", default: 6.0, category: "soil" },
    
    // ========== 土体强度参数 ==========
    { id: "su0", name: "s_u₀ (泥面处不排水抗剪强度)", unit: "kPa", default: 0.01, category: "soil" },
    { id: "k_su", name: "k (抗剪强度梯度)", unit: "kPa/m", default: 1.5, category: "soil" },
    { id: "embedment_ratio", name: "h/D (埋深倍数, 埋深/锚径)", unit: "", default: 1.5, category: "geometry" },
    
    // ========== 承载力系数 ==========
    { id: "Nc_tip", name: "N_c_tip (锚尖端承系数)", unit: "", default: 12.0, category: "coefficient" },
    { id: "Nc_fin", name: "N_c_fin (锚翼端承系数)", unit: "", default: 7.5, category: "coefficient" },
    { id: "Nc_eye", name: "N_c_eye (锚顶端承系数)", unit: "", default: 9.0, category: "coefficient" },
    
    // ========== 计算模式参数 ==========
    { id: "calc_mode", name: "计算模式 (0=短期, 1=长期)", unit: "", default: 1, category: "mode" },
    { id: "sensitivity_St", name: "S_t (土体敏感度, 短期模式)", unit: "", default: 3.0, category: "mode" }
];