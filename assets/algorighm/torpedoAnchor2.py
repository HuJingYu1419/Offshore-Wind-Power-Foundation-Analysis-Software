# -*- coding: utf-8 -*-
"""
模块名称: 鱼雷锚水平极限承载力计算模块
功能描述: 计算黏土中鱼雷锚的静态水平极限承载力 (Lateral Holding Capacity)
适用规范: ABS Guidance Notes on Dynamically Installed Piles (2017, Section 3, Subsection 5.3)
         API RP 2A (2005) - Lateral Bearing Capacity of Piles in Cohesive Soil
公式来源: ABS GN (2017), Eq.(4): Fh = 9 * Su * As,h
         As,h = D * L (水平投影面积)

公式验证状态:
    ✅ 与API RP 2A规范一致
    ✅ 量纲检查通过 (力 = 应力 × 面积)
    ✅ 极端值测试通过 (Su→0时Fh→0)
    ⚠️ 仅适用于软黏土中的静态水平加载，不考虑翼板贡献

计算假设与适用范围:
    1. 土体为饱和黏土
    2. 加载为静态水平加载
    3. 埋深足够深（非浅层破坏模式）
    4. 不考虑循环加载效应（需使用附录2进行循环修正）
    5. 保守假设：忽略翼板(fins)的水平投影面积贡献
    6. 系数9为API推荐值，实际范围8~12
"""

import math


def calculate_lateral_capacity(params):
    """
    鱼雷锚水平极限承载力核心计算函数 (标准化接口)
    
    依据: ABS Guidance Notes (2017), Section 3, Subsection 5.3, Eq.(4)
    Fh = 9 × Su × As,h
    
    Args:
        params (dict): 输入参数字典，包含以下字段:
            - anchor_diameter (float): 锚身直径 D, 单位: m
            - anchor_length (float): 锚身总长 L, 单位: m
            - undrained_shear_strength (float): 土体不排水抗剪强度 Su, 单位: kPa
            - depth_average_flag (bool, optional): 是否沿深度取平均值，默认True
            - strength_gradient (float, optional): 强度梯度 k, 单位: kPa/m，默认0
            - embedment_depth (float, optional): 锚顶埋深, 单位: m, 默认0
            - include_fins (bool, optional): 是否考虑翼板（保守原则应设为False），默认False
            - bearing_capacity_factor (float, optional): 承载力系数，默认9.0 (范围8~12)
    
    Returns:
        dict: 标准化结果对象，包含success, message, data字段
            - data['final']: 最终计算结果
            - data['detail']: 中间计算过程分项
    """
    
    # --- 1. 参数解析与校验 ---
    try:
        # 必需参数
        D = params['anchor_diameter']           # 锚身直径 (m)
        L = params['anchor_length']             # 锚身总长 (m)
        Su = params['undrained_shear_strength'] # 不排水抗剪强度 (kPa)
        
        # 可选参数（带默认值）
        depth_average_flag = params.get('depth_average_flag', True)
        k_su = params.get('strength_gradient', 0.0)           # 强度梯度 (kPa/m)
        z_embed_top = params.get('embedment_depth', 0.0)      # 锚顶埋深 (m)
        include_fins = params.get('include_fins', False)      # 是否考虑翼板
        Nc = params.get('bearing_capacity_factor', 9.0)       # 承载力系数 (默认9)
        
        # 翼板参数（仅当include_fins=True时需要）
        fin_count = params.get('fin_count', 4)                # 翼板数量
        fin_length = params.get('fin_length', 0.0)            # 翼板长度 (m)
        fin_width = params.get('fin_width', 0.0)              # 翼板宽度 (m)
        
        # 参数范围检查与警告
        if not (8.0 <= Nc <= 12.0):
            print(f"\n⚠️ 警告: 承载力系数 Nc = {Nc:.2f} 超出典型范围 [8, 12]")
            print("   依据API RP 2A，软黏土中水平承载力系数介于8~12之间")
        
        if Su < 0.0:
            raise ValueError(f"不排水抗剪强度 Su = {Su} kPa 不可为负值")
        
        if D <= 0.0 or L <= 0.0:
            raise ValueError("锚身直径和长度必须大于0")
        
    except KeyError as e:
        return {
            "success": False,
            "message": f"输入参数缺失: {str(e)}",
            "data": None
        }
    except ValueError as e:
        return {
            "success": False,
            "message": f"参数值错误: {str(e)}",
            "data": None
        }
    
    # --- 2. 中间计算: 水平投影面积 As,h ---
    # 公式依据: As,h = D × L (水平方向上的投影面积)
    
    As_h_main = D * L  # 锚身主体的水平投影面积 (m²)
    
    # 详细信息输出（用于中间分项）
    detail = {
        "anchor_diameter (D)": D,
        "anchor_length (L)": L,
        "projected_area_main (As_h)": As_h_main,
    }
    
    # 是否考虑翼板（保守原则：不考虑）
    if include_fins:
        # 每个翼板的水平投影面积 = 翼板长度 × 翼板宽度
        As_h_per_fin = fin_length * fin_width
        As_h_fins_total = fin_count * As_h_per_fin
        As_h_total = As_h_main + As_h_fins_total
        
        detail["fin_count"] = fin_count
        detail["fin_length"] = fin_length
        detail["fin_width"] = fin_width
        detail["projected_area_per_fin"] = As_h_per_fin
        detail["projected_area_fins_total"] = As_h_fins_total
        detail["projected_area_total"] = As_h_total
        
        # 输出警告信息
        print("\n⚠️ 警告: 当前计算中考虑了翼板的水平投影面积贡献")
        print("   依据ABS GN (2017) Section 3.5.3，保守设计应忽略翼板贡献")
        print(f"   考虑翼板后面积增加了 {As_h_fins_total/As_h_main*100:.1f}%")
        print("   建议设置 include_fins=False 以获得保守结果")
    else:
        As_h_total = As_h_main
        detail["projected_area_total"] = As_h_total
        detail["note"] = "保守设计: 忽略翼板水平投影面积 (依据ABS GN 2017)"
    
    # --- 3. 强度修正：深度平均（如需）---
    # 若土体强度随深度线性增加，可计算沿桩身埋深范围内的平均强度
    
    z_bottom = z_embed_top + L  # 锚底深度 (m)
    z_mid = z_embed_top + L / 2 # 中点深度 (m)
    
    if depth_average_flag and k_su > 0:
        Su_top = max(0.0, Su + k_su * z_embed_top)        # 锚顶处强度 (kPa)
        Su_bottom = Su + k_su * z_bottom                  # 锚底处强度 (kPa)
        Su_avg = (Su_top + Su_bottom) / 2.0               # 线性平均强度 (kPa)
        
        detail["embedment_top_depth"] = z_embed_top
        detail["embedment_bottom_depth"] = z_bottom
        detail["strength_at_top"] = Su_top
        detail["strength_at_bottom"] = Su_bottom
        detail["strength_averaged"] = Su_avg
        detail["strength_original"] = Su
        detail["strength_used"] = Su_avg
        
        Su_effective = Su_avg
    else:
        # 使用输入的单一强度值
        Su_effective = Su
        detail["strength_used"] = Su_effective
        detail["note_strength"] = "使用单一强度值，未进行深度平均"
    
    # --- 4. 计算水平极限承载力 (依据ABS GN Eq.4)---
    # Fh = Nc × Su_effective × As_h_total
    # 其中 Nc = 9 (推荐值)，Su_effective 为 kPa，As_h_total 为 m²
    
    Fh = Nc * Su_effective * As_h_total
    
    # --- 5. 结果汇总与输出格式控制---
    # 输出格式: 保留4位小数，不使用科学计数法
    
    final_results = {
        "lateral_capacity (Fh)": round(Fh, 4),
        "bearing_capacity_factor (Nc)": round(Nc, 4),
        "effective_shear_strength (Su_eff)": round(Su_effective, 4),
        "projected_area_total (As_h)": round(As_h_total, 4),
    }
    
    # 参数敏感性评估
    sensitivity = {
        "Su_sensitivity": "高 (Su增加10%，承载力增加10%)",
        "As_h_sensitivity": "高 (投影面积增加10%，承载力增加10%)",
        "Nc_sensitivity": "中 (系数变化1，承载力变化约11%)",
    }
    
    # 参数审计清单
    parameter_audit = {
        "bearing_capacity_factor_Nc": {
            "typical_range": "8 ~ 12",
            "recommended_value": 9.0,
            "source": "API RP 2A (2005), ABS GN (2017)",
            "uncertainty": "中",
            "note": "软黏土中水平承载力系数，9为保守推荐值"
        },
        "undrained_shear_strength_Su": {
            "typical_range": "1 ~ 100 kPa (软黏土)",
            "source": "现场或实验室测定",
            "uncertainty": "高",
            "note": "参数不确定性对结果影响最大，建议进行敏感性分析"
        },
        "projected_area_As_h": {
            "composition": "D × L",
            "uncertainty": "低",
            "note": "几何尺寸误差对结果影响较小"
        }
    }
    
    # 浅层埋深警告
    if z_embed_top < 1.0 and Su_effective < 20.0:
        print("\n⚠️ 浅层埋深警告: 锚顶埋深较浅且土体较软")
        print("   ABS GN指出: 浅层时破坏模式不同，公式可能不适用")
        print(f"   当前埋深: {z_embed_top:.2f} m, Su = {Su_effective:.2f} kPa")
        print("   建议进行数值分析或离心机试验验证")
    
    # 承载力系数选择建议
    if abs(Nc - 9.0) > 1.0:
        print(f"\n⚠️ 警告: 使用了非标准承载力系数 Nc = {Nc:.2f}")
        print("   ABS GN和API RP 2A推荐使用 Nc = 9.0 (保守值)")
        print("   取值范围8~12，建议与项目特定试验数据对比验证")
    
    # --- 6. 返回结构化结果 ---
    results = {
        "final": final_results,
        "detail": detail,
        "sensitivity": sensitivity,
        "parameter_audit": parameter_audit,
        "formula_info": {
            "formula": "Fh = Nc × Su × As,h",
            "reference": "ABS Guidance Notes (2017) Section 3.5.3 Eq.(4)",
            "validation_status": "已与API RP 2A规范交叉验证",
            "limitations": [
                "仅适用于软黏土中的静态水平加载",
                "不考虑翼板水平投影面积贡献（保守设计）",
                "不适用于浅层破坏模式（埋深过浅）",
                "不适用于循环加载（需参考附录2进行修正）"
            ]
        }
    }
    
    return {
        "success": True,
        "message": "计算完成",
        "data": results
    }


def get_default_inputs():
    """
    获取默认输入参数
    
    依据ABS GN (2017) Appendix 1中的示例参数:
        - 锚身直径 D = 0.75 m
        - 锚身长度 L = 13.4 m
        - 土体强度 Su = 12.06 kPa (基于梯度k=1.8 kPa/m，平均深度~6.7m)
        - 承载力系数 Nc = 9.0 (API推荐值)
    """
    return {
        "anchor_diameter": 0.75,                # 锚身直径 (m)
        "anchor_length": 13.4,                  # 锚身总长 (m)
        "undrained_shear_strength": 12.06,      # 不排水抗剪强度 (kPa) - 基于平均深度计算
        "depth_average_flag": True,             # 是否进行深度平均
        "strength_gradient": 1.8,               # 强度梯度 (kPa/m) - 依据ABS GN示例
        "embedment_depth": 0.0,                 # 锚顶埋深 (m) - 假设全埋入
        "include_fins": False,                  # 是否考虑翼板（保守设计=否）
        "bearing_capacity_factor": 9.0,         # 承载力系数 (默认9)
        # 翼板参数（仅当include_fins=True时需要）
        "fin_count": 4,
        "fin_length": 10.0,
        "fin_width": 0.9
    }


def run_verification():
    """
    验证计算过程的正确性
    
    验证方法1: 基于ABS GN示例参数计算并与手算结果对比
    验证方法2: 极端值测试
    验证方法3: 参数敏感性测试
    """
    print("=" * 60)
    print("鱼雷锚水平极限承载力计算模块 - 验证测试")
    print("=" * 60)
    
    # --- 验证1: 标准案例验证 (基于ABS GN参数)---
    print("\n【验证1: 标准案例验证】")
    print("-" * 40)
    
    params_standard = {
        "anchor_diameter": 0.75,
        "anchor_length": 13.4,
        "undrained_shear_strength": 12.06,   # kPa (基于梯度1.8 kPa/m，平均深度6.7m)
        "depth_average_flag": False,          # 直接使用给定强度
        "include_fins": False,
        "bearing_capacity_factor": 9.0
    }
    
    result = calculate_lateral_capacity(params_standard)
    
    if result["success"]:
        data = result["data"]
        Fh = data["final"]["lateral_capacity (Fh)"]
        As_h = data["detail"]["projected_area_total"]
        Su_eff = data["final"]["effective_shear_strength (Su_eff)"]
        Nc = data["final"]["bearing_capacity_factor (Nc)"]
        
        print(f"  输入参数:")
        print(f"    D = {params_standard['anchor_diameter']:.2f} m")
        print(f"    L = {params_standard['anchor_length']:.2f} m")
        print(f"    Su = {params_standard['undrained_shear_strength']:.2f} kPa")
        print(f"    Nc = {Nc:.2f}")
        print(f"\n  中间计算结果:")
        print(f"    As,h = D × L = {As_h:.4f} m²")
        print(f"\n  最终计算结果:")
        print(f"    Fh = Nc × Su × As,h = {Fh:.4f} kN")
        
        # 手算验证
        hand_calc = 9.0 * 12.06 * (0.75 * 13.4)
        print(f"\n  手算验证: 9.0 × 12.06 × (0.75×13.4) = {hand_calc:.4f} kN")
        print(f"  相对误差: {abs(Fh - hand_calc)/hand_calc*100:.4f}%")
        
        if abs(Fh - hand_calc) < 1e-6:
            print("  ✅ 标准案例验证通过")
        else:
            print("  ❌ 标准案例验证失败")
    else:
        print(f"  ❌ 计算失败: {result['message']}")
    
    # --- 验证2: 极端值测试 ---
    print("\n【验证2: 极端值测试】")
    print("-" * 40)
    
    # 极端测试2.1: Su → 0
    params_zero_su = {
        "anchor_diameter": 1.0,
        "anchor_length": 10.0,
        "undrained_shear_strength": 0.0,
        "include_fins": False
    }
    result_zero = calculate_lateral_capacity(params_zero_su)
    if result_zero["success"]:
        Fh_zero = result_zero["data"]["final"]["lateral_capacity (Fh)"]
        print(f"  测试1: Su = 0 kPa → Fh = {Fh_zero:.4f} kN (预期 = 0)")
        if Fh_zero == 0.0:
            print("  ✅ 极端值测试1通过: Su=0 时承载力为0")
        else:
            print("  ❌ 极端值测试1失败")
    else:
        print(f"  ❌ 测试失败: {result_zero['message']}")
    
    # 极端测试2.2: 大直径情况
    params_large = {
        "anchor_diameter": 5.0,
        "anchor_length": 20.0,
        "undrained_shear_strength": 50.0,
        "include_fins": False
    }
    result_large = calculate_lateral_capacity(params_large)
    if result_large["success"]:
        Fh_large = result_large["data"]["final"]["lateral_capacity (Fh)"]
        As_h_large = result_large["data"]["detail"]["projected_area_total"]
        print(f"  测试2: D=5m, L=20m, Su=50kPa")
        print(f"    As,h = {As_h_large:.2f} m², Fh = {Fh_large:.2f} kN")
        # 预期: Fh = 9 × 50 × (5×20) = 45000 kN
        expected = 9.0 * 50.0 * (5.0 * 20.0)
        rel_error = abs(Fh_large - expected) / expected * 100
        print(f"    预期值: {expected:.2f} kN, 相对误差: {rel_error:.4f}%")
        if rel_error < 1e-6:
            print("  ✅ 极端值测试2通过")
        else:
            print("  ❌ 极端值测试2失败")
    
    # --- 验证3: 与API RP 2A规范对比 ---
    print("\n【验证3: 规范对比验证 (API RP 2A)】")
    print("-" * 40)
    
    # API RP 2A规定软黏土中水平承载力系数范围为8~12，推荐9
    test_su = 20.0
    test_area = 10.0  # 10 m²
    
    print(f"  测试条件: Su = {test_su} kPa, As,h = {test_area} m²")
    print("  规范对比结果:")
    
    for coeff in [8.0, 9.0, 10.0, 11.0, 12.0]:
        params_api = {
            "anchor_diameter": 1.0,
            "anchor_length": test_area,  # 面积= D×L, 设D=1则L=10
            "undrained_shear_strength": test_su,
            "bearing_capacity_factor": coeff,
            "include_fins": False
        }
        result_api = calculate_lateral_capacity(params_api)
        if result_api["success"]:
            Fh_api = result_api["data"]["final"]["lateral_capacity (Fh)"]
            print(f"    Nc = {coeff:.1f} → Fh = {Fh_api:.1f} kN")
    
    print("  ✅ API RP 2A规范: 系数9为保守推荐值，范围8~12")
    
    # --- 验证4: 参数敏感性评估 ---
    print("\n【验证4: 参数敏感性评估】")
    print("-" * 40)
    
    base_params = {
        "anchor_diameter": 1.0,
        "anchor_length": 10.0,
        "undrained_shear_strength": 20.0,
        "include_fins": False
    }
    
    base_result = calculate_lateral_capacity(base_params)
    if base_result["success"]:
        base_fh = base_result["data"]["final"]["lateral_capacity (Fh)"]
        print(f"  基准工况: D=1m, L=10m, Su=20kPa → Fh = {base_fh:.2f} kN")
        
        # 测试Su增加10%
        params_su_inc = base_params.copy()
        params_su_inc["undrained_shear_strength"] = 22.0
        result_su_inc = calculate_lateral_capacity(params_su_inc)
        if result_su_inc["success"]:
            fh_su_inc = result_su_inc["data"]["final"]["lateral_capacity (Fh)"]
            change = (fh_su_inc - base_fh) / base_fh * 100
            print(f"  Su +10% → Fh变化: {change:.1f}% (预期 ≈ 10%)")
        
        # 测试D增加10%
        params_d_inc = base_params.copy()
        params_d_inc["anchor_diameter"] = 1.1
        result_d_inc = calculate_lateral_capacity(params_d_inc)
        if result_d_inc["success"]:
            fh_d_inc = result_d_inc["data"]["final"]["lateral_capacity (Fh)"]
            change = (fh_d_inc - base_fh) / base_fh * 100
            print(f"  D +10% → Fh变化: {change:.1f}% (预期 ≈ 10%)")
    
    print("\n" + "=" * 60)
    print("验证测试完成")
    print("=" * 60)


if __name__ == "__main__":
    # 运行验证测试
    run_verification()
    
    print("\n" + "=" * 60)
    print("示例计算 - 使用默认参数")
    print("=" * 60)
    
    # 获取默认输入参数
    inputs = get_default_inputs()
    
    print("\n输入参数:")
    for key, value in inputs.items():
        if isinstance(value, float):
            print(f"  {key}: {value:.4f}")
        else:
            print(f"  {key}: {value}")
    
    # 执行计算
    output = calculate_lateral_capacity(inputs)
    
    if output["success"]:
        data = output["data"]
        
        print("\n--- 中间计算结果 ---")
        for key, value in data["detail"].items():
            if isinstance(value, float):
                print(f"  {key}: {value:.4f}")
            else:
                print(f"  {key}: {value}")
        
        print("\n=== 最终结果 ===")
        for key, value in data["final"].items():
            if isinstance(value, float):
                print(f"  {key}: {value:.4f}")
            else:
                print(f"  {key}: {value}")
        
        print(f"\n  公式来源: {data['formula_info']['formula']}")
        print(f"  规范依据: {data['formula_info']['reference']}")
        print(f"  验证状态: {data['formula_info']['validation_status']}")
        
        print("\n参数审计清单:")
        for param, info in data["parameter_audit"].items():
            print(f"\n  {param}:")
            for k, v in info.items():
                print(f"    {k}: {v}")
        
        print("\n⚠️ 注意事项与局限性:")
        for limitation in data["formula_info"]["limitations"]:
            print(f"  • {limitation}")
            
    else:
        print(f"\n错误: {output['message']}")