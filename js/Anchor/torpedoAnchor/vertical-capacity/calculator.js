/**
 * @filepath: js/Anchor/torpedoAnchor/vertical-capacity/calculator.js
 * @description: 鱼雷锚竖向承载力计算逻辑
 * 基于论文《鱼雷锚在静荷载与循环荷载下的承载特性数值分析_成思佳.pdf》
 * 采用Randolph & Murphy (R&M) 公式计算侧摩阻力系数α
 */

/**
 * 计算鱼雷锚极限承载力
 * @param {Object} params - 输入参数对象
 * @returns {Object} 计算结果
 */
export function calculate(params) {
    // 解析计算模式
    const isLongTerm = params.calc_mode === 1;
    
    // 计算埋深
    const embedment_depth_tip = params.L * params.embedment_ratio;
    const embedment_depth_top = embedment_depth_tip - params.L;
    
    // 锚翼起始深度（假设紧邻锚顶）
    const z_fin_start = embedment_depth_top;
    const z_fin_end = z_fin_start + params.L_fin;
    const z_fin_avg = (z_fin_start + z_fin_end) / 2.0;
    
    // 圆锥起始深度
    const z_cone_start = embedment_depth_tip - params.Lt;
    
    // ========== 1. 计算锚体浮重 Ws ==========
    const vol_cyl_body = Math.PI * Math.pow(params.D / 2, 2) * (params.L - params.Lt);
    const vol_cone_tip = (1.0 / 3.0) * Math.PI * Math.pow(params.D / 2, 2) * params.Lt;
    const vol_fins = params.n_fins * params.L_fin * params.W_fin * params.t_fin;
    const total_vol = vol_cyl_body + vol_cone_tip + vol_fins;
    
    const gamma_steel = params.rho_steel * 9.81 / 1000.0;
    const Ws = total_vol * (gamma_steel - params.gamma_w);
    
    // ========== 2. 计算端承阻力 Qb ==========
    // 2.1 锚尖端端阻力
    const z_tip = embedment_depth_tip;
    const Su_tip = params.su0 + params.k_su * z_tip;
    const A_tip = Math.PI * Math.pow(params.D / 2, 2);
    const Qb_tip = params.Nc_tip * Su_tip * A_tip;
    
    // 2.2 锚顶端端阻力（锚眼处）
    const z_top = embedment_depth_top;
    const Su_top = params.su0 + params.k_su * z_top;
    const Qb_eye = params.Nc_eye * Su_top * A_tip;
    
    // 2.3 锚翼端阻力
    const Su_fin_avg = params.su0 + params.k_su * z_fin_avg;
    const A_fin = params.n_fins * params.L_fin * params.t_fin * 2.0;
    const Qb_fin = params.Nc_fin * Su_fin_avg * A_fin;
    
    const Qb_total = Qb_tip + Qb_eye + Qb_fin;
    
    // ========== 3. 计算侧壁摩擦力 Qf ==========
    const getAlpha = (z, su_z) => {
        if (su_z <= 0) return 0;
        
        const sigma_v_prime = params.gamma_soil_sub * z;
        const ratio = sigma_v_prime / su_z;
        
        if (!isLongTerm) {
            // 短期模式：α = 1/St
            return 1.0 / params.sensitivity_St;
        } else {
            // 长期模式：Randolph & Murphy 公式
            let alpha;
            if (ratio <= 1.0) {
                alpha = 0.5 * Math.sqrt(1.0 / ratio);
            } else {
                alpha = 0.5 * Math.sqrt(su_z / sigma_v_prime);
            }
            return Math.min(alpha, 1.0);
        }
    };
    
    const integrateFriction = (z_start, z_end, getPerimeter, n_steps = 100) => {
        if (z_start >= z_end) return 0;
        const dz = (z_end - z_start) / n_steps;
        let total = 0;
        
        for (let i = 0; i < n_steps; i++) {
            const z_mid = z_start + (i + 0.5) * dz;
            const su_z = params.su0 + params.k_su * z_mid;
            if (su_z <= 0) continue;
            
            const alpha = getAlpha(z_mid, su_z);
            const tau = alpha * su_z;
            const perimeter = getPerimeter(z_mid);
            total += tau * perimeter * dz;
        }
        return total;
    };
    
    const perimeterCyl = () => Math.PI * params.D;
    
    const perimeterWithFins = (z) => {
        if (z >= z_fin_start && z <= z_fin_end) {
            return Math.PI * params.D + 2 * params.n_fins * params.W_fin;
        }
        return Math.PI * params.D;
    };
    
    // 分段计算侧摩阻力
    const Qf_fin = integrateFriction(z_fin_start, z_fin_end, perimeterWithFins);
    const Qf_top = integrateFriction(embedment_depth_top, z_fin_start, perimeterCyl);
    const Qf_mid = integrateFriction(z_fin_end, z_cone_start, perimeterCyl);
    const Qf_cone = 0;
    const Qf_total = Qf_fin + Qf_top + Qf_mid + Qf_cone;
    
    // ========== 4. 总极限承载力 ==========
    const Qu_total = Ws + Qb_total + Qf_total;
    
    // ========== 5. 返回结果 ==========
    return {
        value: Qu_total,
        unit: "kN",
        text: `鱼雷锚极限承载力: ${Qu_total.toFixed(2)} kN`,
        details: {
            embedment_tip: embedment_depth_tip.toFixed(2),
            embedment_top: embedment_depth_top.toFixed(2),
            Ws: Ws.toFixed(2),
            Qb_tip: Qb_tip.toFixed(2),
            Qb_eye: Qb_eye.toFixed(2),
            Qb_fin: Qb_fin.toFixed(2),
            Qb_total: Qb_total.toFixed(2),
            Qf_fin: Qf_fin.toFixed(2),
            Qf_top: Qf_top.toFixed(2),
            Qf_mid: Qf_mid.toFixed(2),
            Qf_total: Qf_total.toFixed(2),
            total: Qu_total.toFixed(2),
            Su_tip: Su_tip.toFixed(2),
            Su_top: Su_top.toFixed(2),
            Su_fin_avg: Su_fin_avg.toFixed(2),
            calc_mode: isLongTerm ? "长期模式 (R&M公式)" : "短期模式 (α=1/St)",
        }
    };
}