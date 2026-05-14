/**
 * @filepath: js/Anchor/torpedoAnchor/horizontal-capacity/config.js
 * @description: 鱼雷锚 - 水平承载力模块参数配置
 *              依据 ABS Guidance Notes (2017) Section 3.5.3 Eq.(4)
 *              公式: Fh = Nc × Su × As,h
 */

export const id = 'horizontal-capacity';
export const name = '鱼雷锚水平承载力计算';
export const description = '基于ABS Guidance Notes (2017) 规范，计算黏土中鱼雷锚的静态水平极限承载力';

export const parameters = [
    // ========== 几何参数 ==========
    { 
        id: "anchor_diameter", 
        name: "D (锚体直径)", 
        unit: "m", 
        default: 0.75, 
        category: "geometry",
        min: 0.1,
        note: "D—锚身主体直径"
    },
    { 
        id: "anchor_length", 
        name: "L (锚体总长度)", 
        unit: "m", 
        default: 13.4, 
        category: "geometry",
        min: 0.5,
        note: "L—锚身主体总长度"
    },
    
    // ========== 土体强度参数 ==========
    { 
        id: "undrained_shear_strength", 
        name: "s_u₀ (泥面处不排水抗剪强度)", 
        unit: "kPa", 
        default: 5.0, 
        category: "soil",
        min: 0,
        note: "s_u₀—泥面处的初始抗剪强度"
    },
    { 
        id: "strength_gradient", 
        name: "k (抗剪强度梯度)", 
        unit: "kPa/m", 
        default: 1.5, 
        category: "soil",
        min: 0,
        note: "k—强度随深度的增长率，设为0表示均匀土层"
    },
    { 
        id: "embedment_top_depth", 
        name: "z_top (锚顶埋深)", 
        unit: "m", 
        default: 0, 
        category: "soil",
        min: 0,
        note: "z_top—锚顶距离泥面的深度，全埋入时设为0"
    },
    
    // ========== 计算模式 ==========
    { 
        id: "strength_average_mode", 
        name: "强度取值方式",
        type: "select",
        default: "mid_depth",
        category: "mode",
        options: ["surface", "mid_depth", "average"],
        optionsLabel: ["泥面强度 s_u₀", "锚中点深度强度 s_u(z_mid)", "沿锚身平均强度 s_u_avg"],
        note: "选择土体强度的取值方法"
    },
    { 
        id: "bearing_capacity_factor", 
        name: "N_c (承载力系数)", 
        unit: "", 
        default: 9.0, 
        category: "coefficient",
        min: 8,
        max: 12,
        step: 0.5,
        note: "N_c—API RP 2A推荐范围8~12，9为保守值"
    },
    { 
        id: "include_fins", 
        name: "考虑翼板贡献",
        type: "select",
        default: false,
        category: "mode",
        options: [false, true],
        optionsLabel: ["否（保守设计）", "是（非保守）"],
        note: "ABS GN建议保守设计应忽略翼板"
    },
    
    // ========== 翼板参数（条件显示） ==========
    { 
        id: "fin_count", 
        name: "n_f (翼板数量)", 
        unit: "", 
        default: 4, 
        category: "geometry",
        min: 0,
        condition: { include_fins: true },
        note: "n_f—沿锚身布置的翼板数量"
    },
    { 
        id: "fin_length", 
        name: "L_f (翼板长度)", 
        unit: "m", 
        default: 10.0, 
        category: "geometry",
        min: 0,
        condition: { include_fins: true },
        note: "L_f—翼板沿锚身方向的长度"
    },
    { 
        id: "fin_width", 
        name: "W_f (翼板宽度)", 
        unit: "m", 
        default: 0.9, 
        category: "geometry",
        min: 0,
        condition: { include_fins: true },
        note: "W_f—翼板突出锚身的宽度"
    }
];