# -*- coding: utf-8 -*-
"""
模块名称: 鱼雷锚极限承载力计算模块 
功能描述: 计算黏土中鱼雷锚的竖向抗拔极限承载力。
适用规范: API RP 2GEO, O'Loughlin (2013), Randolph & Murphy (1985)
开发者: [团队名称]
说明: 本代码特别调整了侧壁摩擦力的计算逻辑，采用分段数值积分法以匹配验证案例。
"""

import math

def calculate_torpedo_anchor(params):
    """
    鱼雷锚承载力核心计算函数 (标准化接口)

    Args:
        params (dict): 输入参数字典。

    Returns:
        dict: 标准化结果对象
    """
    
    # --- 1. 参数解析 (Input Unpacking) ---
    try:
        # 几何参数
        L = params['anchor_length']         # 锚总长      
        D = params['anchor_diameter']       # 锚直径      
        Lt = params['tip_length']           # 锚尖端圆锥长度           
        
        # 锚翼参数（四锚翼）
        n_fins = params['fin_count']         
        Lf1 = params['fin_length_1']        # 锚翼分段1
        Lf2 = params['fin_length_2']        # 锚翼分段2     
        Lf3 = params['fin_length_3']        # 锚翼分段3
        Wf = params['fin_width']            # 锚翼宽度 
        t_fin = params['fin_thickness']     # 锚翼厚度 
        
        # 材料参数
        rho_steel = params['steel_density']                     # 钢材密度 (kg/m^3)
        gamma_w = params['water_unit_weight']                   # 水容重 (kN/m^3)
        gamma_soil_sub = params['soil_effective_unit_weight']   # 土体有效浮重度 (kN/m^3)
        
        # 土体参数
        su0 = params['soil_strength_surface']       # 泥面处不排水抗剪强度 (kPa)
        k_su = params['soil_strength_gradient']     # 抗剪强度梯度 (kPa/m)
        embed_ratio = params['embedment_ratio']     # 埋深倍数
        
        # 计算模式与系数
        mode = params['calculation_mode']     # 选项：'short_term' (短期，alpha = 1/St) 或 'long_term' (长期，alpha = R&M公式)
        St = params['soil_sensitivity']       # 土体敏感度 (仅短期模式使用)  
        
        # 端阻系数 
        Nc_tip = params['Nc_tip']           
        Nc_fin = params['Nc_fin']           
        Nc_eye = params['Nc_eye']           
        
        # 锚翼位置偏移 (新增: 假设锚翼位于锚身最上端)
        fin_offset_from_top = 0.0 # 锚翼起始点距离锚顶的距离 (m)
        
    except KeyError as e:
        return {
            "success": False,
            "message": f"输入参数缺失: {str(e)}",
            "data": None
        }

    # --- 2. 基础参数计算 ---
    z_tip = L * embed_ratio                    # 锚尖深度
    z_top = z_tip - L                          # 锚顶深度
    Su_tip = su0 + k_su * z_tip                # 锚尖处土体强度
    Su_top = su0 + k_su * z_top                # 锚顶处土体强度

    # --- 3. 计算土中重量 Ws  ---
    # 数学本质：几何体质量减去排开水的质量。
    # 主体钢管体积 + 翼板体积
    # 简化处理：按外径计算体积，视为实心钢（偏大）或按经验浮重。
    vol_cyl_body = math.pi * (D/2)**2 * (L - Lt)   # 圆柱段主体体积
    vol_cone_tip = (1.0/3.0) * math.pi * (D/2)**2 * Lt # 圆锥锚尖
    vol_fins = n_fins * (Lf1 + Lf2 + Lf3) * Wf * t_fin # 锚翼
    
    # 假设锚身主体为实心（或等效实心，因为填充了混凝土/废铁）
    total_vol = vol_cyl_body + vol_cone_tip + vol_fins # 总体积
    
    gamma_steel = rho_steel * 9.81 / 1000.0   # kN/m3
    Ws = total_vol * (gamma_steel - gamma_w)  # kN

    # --- 4. 计算端承阻力 Fb  ---
    A_proj_tip = math.pi * (D/2)**2
    A_proj_eye = A_proj_tip 
    
    # 锚翼平均深度
    z_fin_start = z_top + fin_offset_from_top
    z_fin_end = z_fin_start + (Lf1 + Lf2 + Lf3)
    z_fin_avg = (z_fin_start + z_fin_end) / 2
    Su_fin_avg = su0 + k_su * z_fin_avg
    
    A_proj_fin = n_fins * (Lf1 + Lf2 + Lf3) * t_fin * 2 # 双面
    Fb_tip = Nc_tip * Su_tip * A_proj_tip
    Fb_eye = Nc_eye * Su_top * A_proj_eye
    Fb_fin = Nc_fin * Su_fin_avg * A_proj_fin
    Fb_total = Fb_tip + Fb_eye + Fb_fin

    # --- 5. 修正侧壁摩擦力 Ff (核心修正部分) ---
    # 采用数值积分逻辑，而不是简化的平均值算法
    # Ref: Randolph & Murphy (1985) 摩擦系数公式：alpha = 0.5 * (psi)^-0.5  where psi = sigma_v'/Su.

    def get_alpha(z, su_z):
        """
        计算 Alpha 系数 (根据深度和土体强度)
        """
        if su_z <= 0:
            return 0.0
        sigma_v_prime = gamma_soil_sub * z # 平均有效应力
        ratio = sigma_v_prime / su_z
        
        if mode == 'short_term':
            # 短期模式: alpha = 1/St
            return 1.0 / St
        else:
            # 长期模式: Randolph & Murphy 公式
            # alpha = 0.5 * sqrt(Su / sigma_v') 当 ratio <= 1
            # 或者统一处理
            if ratio <= 1.0:
                alpha = 0.5 * math.sqrt(1.0 / ratio)
            else:
                # 当有效应力较大时，使用原始 R&M 形式
                alpha = 0.5 * math.sqrt(su_z / sigma_v_prime)
            return min(alpha, 1.0) # 限制最大值为 1.0

    def integrate_friction(z_start, z_end, perimeter_func, n_steps=100):
        """
        数值积分计算侧壁摩擦力
        """
        dz = (z_end - z_start) / n_steps
        total_f = 0.0
        for i in range(n_steps):
            z_mid = z_start + (i + 0.5) * dz
            su_z = su0 + k_su * z_mid
            if su_z < 0:
                su_z = 0
            alpha = get_alpha(z_mid, su_z)
            tau = alpha * su_z # 摩阻力
            perim = perimeter_func(z_mid) # 周长
            total_f += tau * perim * dz
        return total_f

    # --- 5.1 定义周长函数 (Perimeter Functions) ---
    # 需要区分锚翼段和普通圆柱段
    def perim_with_fins(z):
        # 如果深度 z 在锚翼范围内，周长增加锚翼侧面的贡献
        if z_fin_start <= z <= z_fin_end:
            # 圆柱周长 + 锚翼两侧面 (n_fins * 2 * Wf)
            return math.pi * D + 2 * n_fins * Wf
        else:
            return math.pi * D

    # --- 5.2 分段计算摩擦力 ---
    # 土体不排水抗剪强度随深度线性增加且锚杆的周长在锚翼位置发生突变，需要进行分段积分计算
    
    # 1. 锚翼段摩擦力 (Ff_fin_zone)
    # 使用包含锚翼贡献的周长函数计算
    Ff_fin_zone = integrate_friction(z_fin_start, z_fin_end, perim_with_fins)

    # 2. 上部圆柱段 (Ff_top_zone): 锚顶到锚翼开始处
    Ff_top_zone = 0.0
    if z_top < z_fin_start:
        Ff_top_zone = integrate_friction(z_top, z_fin_start, lambda z: math.pi * D)

    # 3. 下部圆柱段 (Ff_mid_zone): 锚翼结束到圆锥开始处
    z_cone_start = z_tip - Lt
    Ff_mid_zone = 0.0
    if z_fin_end < z_cone_start:
        Ff_mid_zone = integrate_friction(z_fin_end, z_cone_start, lambda z: math.pi * D)

    # 4. 圆锥段 (Ff_cone_zone): 忽略 (通常较小且复杂)
    Ff_cone_zone = 0.0

    Ff_total = Ff_fin_zone + Ff_top_zone + Ff_mid_zone + Ff_cone_zone

    # --- 6. 结果汇总 ---
    Qu_total = Ws + Fb_total + Ff_total
    
    results = {
        "final": {
            "Ws": round(Ws, 4),
            "Fb_total": round(Fb_total, 4),
            "Ff_total": round(Ff_total, 4),
            "Qu_total": round(Qu_total, 4)
        },
        "detail": {
            "Ff_components": {
                "fin_zone": round(Ff_fin_zone, 4),
                "top_cyl": round(Ff_top_zone, 4),
                "mid_cyl": round(Ff_mid_zone, 4),
                "cone": round(Ff_cone_zone, 4)
            }
        }
    }
    
    return {
        "success": True,
        "message": "计算完成",
        "data": results
    }

# 快速获取默认参数设置
def get_default_inputs():
    return {
        "anchor_length": 17.0,
        "anchor_diameter": 1.07,
        "tip_length": 2.0,
        "fin_count": 4,
        "fin_length_1": 0.4,
        "fin_length_2": 9.2,
        "fin_length_3": 0.4,
        "fin_width": 0.9,
        "fin_thickness": 0.1,
        "steel_density": 7850.0,
        "water_unit_weight": 10.0,
        "soil_effective_unit_weight": 6.0,
        "soil_strength_surface": 0.0,
        "soil_strength_gradient": 1.5,
        "embedment_ratio": 1.5,
        "calculation_mode": "long_term",
        "soil_sensitivity": 3.0,
        "Nc_tip": 12.0,
        "Nc_fin": 7.5,
        "Nc_eye": 9.0
    }

if __name__ == "__main__":
    inputs = get_default_inputs()
    output = calculate_torpedo_anchor(inputs)
    if output["success"]:
        data = output["data"]
        print(f"计算成功!")
        print(f"浮重 Ws: {data['final']['Ws']} kN")
        print(f"端阻 Fb: {data['final']['Fb_total']} kN")
        print(f"侧摩阻 Ff: {data['final']['Ff_total']} kN")
        print(f"总承载力: {data['final']['Qu_total']} kN")
    else:
        print(f"错误: {output['message']}")
        
    # 验证对比
    target_api = 3598.945 # 原论文验证数据的参考值
    target_fem = 3499.84
    error_api = abs(data['final']['Qu_total'] - target_api) / target_api * 100
    
    print(f"\n[验证对比]")
    print(f"  论文 API 参考值：{target_api:.2f} kN")
    print(f"  论文 FEM 参考值：{target_fem:.2f} kN")
    print(f"  当前计算误差 (vs API): {error_api:.2f}%")
    
    if error_api < 5.0:
        print("  >> 结果吻合良好！计算逻辑正确。")
    else:
        print("  >> 存在差异，请检查：1.锚翼位置假设; 2.摩擦系数公式细节; 3.圆锥段处理。")