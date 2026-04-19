"""
================================================================================
模块名称: plate_anchor_capacity.py
功能描述: 均质黏土中水平板锚抗拔承载力计算工具（基于下限解）

参考文献:
1. Merfield, R.S., Lyamin, A.V., Sloan, S.W., & Yu, H.S. (2003).
   "Three-Dimensional Lower Bound Solutions for Stability of Plate Anchors in Clay"
   Journal of Geotechnical and Geoenvironmental Engineering, 129(3), 243-253.
   - 公式(1): q_u = c_u * N_c
   - 公式(2): N_c0 = (q_u/c_u) for γ=0
   - 公式(3): N_c = N_c0 + γH/c_u
   - 公式(4): 方形锚 N_c0 = S * [2.56 * ln(2H/B)]
   - 公式(5): 圆形锚 N_c0 = S * [2.56 * ln(2H/D)]

2. 师兄笔记（DNV规范补充）:
   - 形状因子S的高阶多项式拟合（方形锚8次多项式，圆形锚10次多项式）
   - 土壤扰动折减系数 η = 0.75（默认值）

计算假设与适用范围:
1. 土体为均质、各向同性黏土，不排水抗剪强度 s_u 为常数
2. Tresca屈服准则，完美塑性本构
3. 立即脱离条件（immediate breakaway），不考虑锚板底部吸力
4. 锚板粗糙（rough），粗糙度影响已隐含在N_c0公式中
5. 适用范围: H/B 或 H/D 约在1~10之间

公式验证状态:
- 论文公式(4)(5)与原文Fig.5(a)、Fig.8(a)数值结果一致
- 形状因子S的多项式拟合为经验曲线，非原始论文公式
- 深锚极限值N_c*: 方形11.9，圆形12.56，已与论文Fig.5(a)、Fig.8(a)验证
================================================================================
"""

import math


def shape_factor_square(x):
    """
    方形锚形状因子 S 的计算（经验拟合多项式）
    
    参数:
        x: 埋深比 H/B（无量纲）
    
    返回:
        S: 形状因子（无量纲）
    
    公式来源: 师兄笔记 - 方形锚形状因子8次多项式拟合
    验证状态: 对论文图6曲线的数值拟合，非原始论文公式
    适用范围: H/B 约 1~10
    """
    # 多项式系数（降幂排列）
    # S = a8*x^8 + a7*x^7 + a6*x^6 + a5*x^5 + a4*x^4 + a3*x^3 + a2*x^2 + a1*x + a0
    a8 = -4.59716e-6
    a7 = 0.00020
    a6 = -0.00356
    a5 = 0.03438
    a4 = -0.19108
    a3 = 0.60651
    a2 = -1.00177
    a1 = 0.68234
    a0 = 1.59197
    
    S = (a8 * x**8 + a7 * x**7 + a6 * x**6 + a5 * x**5 +
         a4 * x**4 + a3 * x**3 + a2 * x**2 + a1 * x + a0)
    return S


def shape_factor_circular(x):
    """
    圆形锚形状因子 S 的计算（经验拟合多项式）
    
    参数:
        x: 埋深比 H/D（无量纲）
    
    返回:
        S: 形状因子（无量纲）
    
    公式来源: 师兄笔记 - 圆形锚形状因子10次多项式拟合
    验证状态: 对论文图9曲线的数值拟合，非原始论文公式
    适用范围: H/D 约 1~10
    """
    # 多项式系数（降幂排列）
    # S = a10*x^10 + a9*x^9 + a8*x^8 + a7*x^7 + a6*x^6 + a5*x^5 
    #     + a4*x^4 + a3*x^3 + a2*x^2 + a1*x + a0
    a10 = 2.13325e-7
    a9 = -1.14903e-5
    a8 = 0.00027
    a7 = -0.00363
    a6 = 0.03122
    a5 = -0.17989
    a4 = 0.70743
    a3 = -1.88547
    a2 = 3.27851
    a1 = -3.39259
    a0 = 3.54920
    
    S = (a10 * x**10 + a9 * x**9 + a8 * x**8 + a7 * x**7 +
         a6 * x**6 + a5 * x**5 + a4 * x**4 + a3 * x**3 +
         a2 * x**2 + a1 * x + a0)
    return S


def n_c0_square(embedment_ratio, shape_factor):
    """
    计算方形锚在无重度土中的承载系数 N_c0
    
    参数:
        embedment_ratio: 埋深比 H/B（无量纲）
        shape_factor: 形状因子 S（无量纲）
    
    返回:
        N_c0: 无重度土中的承载系数（无量纲）
    
    公式来源: 论文公式(4) - N_c0 = S * [2.56 * ln(2H/B)]
    验证状态: 与论文Fig.5(a)数值结果一致
    """
    # 论文公式(4): N_c0 = S * 2.56 * ln(2 * H/B)
    # 注意: 当 H/B <= 0.5 时 ln(2H/B) <= 0，公式不再适用
    term = 2.56 * math.log(2.0 * embedment_ratio)
    return shape_factor * term


def n_c0_circular(embedment_ratio, shape_factor):
    """
    计算圆形锚在无重度土中的承载系数 N_c0
    
    参数:
        embedment_ratio: 埋深比 H/D（无量纲）
        shape_factor: 形状因子 S（无量纲）
    
    返回:
        N_c0: 无重度土中的承载系数（无量纲）
    
    公式来源: 论文公式(5) - N_c0 = S * [2.56 * ln(2H/D)]
    验证状态: 与论文Fig.8(a)数值结果一致
    """
    # 论文公式(5): N_c0 = S * 2.56 * ln(2 * H/D)
    term = 2.56 * math.log(2.0 * embedment_ratio)
    return shape_factor * term


def calculate_anchor_capacity(shape, width, height, embedment_depth, 
                               undrained_strength, unit_weight, 
                               reduction_factor=0.75, length=None):
    """
    计算均质黏土中水平板锚的抗拔承载力
    
    参数:
        shape: 锚板形状，可选 'square'(方形)、'circular'(圆形)、'rectangular'(矩形)
        width: 锚板宽度 B (m) - 方形锚边长，圆形锚直径，矩形锚短边
        height: 锚板高度/长度 (m) - 仅矩形锚需要，方形/圆形可设为None
        embedment_depth: 锚板埋深 H (m)，从泥面到锚板中面或顶面（按论文示例取顶面）
        undrained_strength: 土的不排水抗剪强度 s_u (kPa)
        unit_weight: 土的天然重度 γ (kN/m³)
        reduction_factor: 土壤扰动折减系数 η (无量纲)，默认0.75
                          若取1.0则无折减效果
        length: 矩形锚长边 L (m)，仅当 shape='rectangular' 时需要
    
    返回:
        dict: 包含以下字段的计算结果
            - q_u: 极限抗拔承载力 (kPa)
            - Q_u: 极限抗拔力 (kN)
            - N_c: 最终承载系数
            - N_c0: 无重度土承载系数
            - N_c_star: 深锚极限承载系数
            - anchor_type: 'shallow' 或 'deep'
            - 其他中间计算结果
    
    公式来源: 
        - 基本公式: 论文公式(1)
        - N_c构成: 论文公式(3)
        - 深锚判断: 论文第5节建议流程
    """
    
    # ==================== 参数有效性检查 ====================
    if shape not in ['square', 'circular', 'rectangular']:
        raise ValueError("shape 参数必须是 'square', 'circular' 或 'rectangular'")
    
    if embedment_depth <= 0:
        raise ValueError("埋深 H 必须大于 0")
    
    if undrained_strength <= 0:
        raise ValueError("不排水抗剪强度 s_u 必须大于 0")
    
    if reduction_factor <= 0 or reduction_factor > 1:
        raise ValueError("折减系数 η 应在 (0, 1] 范围内")
    
    # ==================== 计算锚板面积 ====================
    if shape == 'square':
        area = width * width
        characteristic_dimension = width  # B
        embedment_ratio = embedment_depth / characteristic_dimension
        # 深锚极限承载系数（论文第5节）
        n_c_star = 11.9
        
    elif shape == 'circular':
        radius = width / 2.0
        area = math.pi * radius * radius
        characteristic_dimension = width  # D
        embedment_ratio = embedment_depth / characteristic_dimension
        # 深锚极限承载系数（论文第5节）
        n_c_star = 12.56
        
    elif shape == 'rectangular':
        if length is None:
            raise ValueError("矩形锚需要提供 length (L) 参数")
        if length < width:
            # 规范约定: B为短边，L为长边
            B = length
            L = width
            width = B
            length = L
        area = width * length
        characteristic_dimension = width  # B (短边)
        embedment_ratio = embedment_depth / characteristic_dimension
        # 矩形锚极限值介于方形(11.9)和条形(11.16)之间
        # 论文建议: L/B >= 10 时按条形锚处理，此处按线性插值
        aspect_ratio = length / width
        if aspect_ratio >= 10:
            n_c_star = 11.16  # 条形锚极限值（论文第8节）
        else:
            # 线性插值: 方形(L/B=1)取11.9，条形(L/B=∞)取11.16
            # 当 L/B=1 时 factor=0 -> 11.9
            # 当 L/B=∞ 时 factor=1 -> 11.16
            factor = 1.0 - 1.0 / aspect_ratio if aspect_ratio > 1 else 0.0
            n_c_star = 11.9 - factor * (11.9 - 11.16)
    
    # ==================== 警告: 埋深比超出拟合范围 ====================
    if embedment_ratio < 1.0:
        print(f"\n警告: 埋深比 {embedment_ratio:.4f} 小于 1.0，超出形状因子多项式的拟合范围")
        print("      建议使用 H/B 或 H/D >= 1.0")
    if embedment_ratio > 10.0:
        print(f"\n警告: 埋深比 {embedment_ratio:.4f} 大于 10.0，超出形状因子多项式的拟合范围")
        print("      计算结果可能存在偏差")
    
    # ==================== 步骤1: 计算形状因子 S ====================
    # 注: 师兄笔记的多项式拟合，非原始论文公式
    if shape == 'square':
        shape_factor_value = shape_factor_square(embedment_ratio)
    elif shape == 'circular':
        shape_factor_value = shape_factor_circular(embedment_ratio)
    else:  # rectangular
        # 矩形锚形状因子: 论文图15设计曲线
        # 当 L/B >= 10 时 S → 1.0 (条形锚)
        # 当 L/B = 1 时 S = 方形锚形状因子
        aspect_ratio = length / width
        s_square = shape_factor_square(embedment_ratio)
        if aspect_ratio >= 10:
            shape_factor_value = 1.0
        else:
            # 线性插值: L/B=1 时取 s_square，L/B=10 时取 1.0
            t = (aspect_ratio - 1.0) / 9.0  # 当 L/B=1 时 t=0; L/B=10 时 t=1
            shape_factor_value = s_square * (1.0 - t) + 1.0 * t
    
    # ==================== 步骤2: 计算 N_c0 ====================
    if shape == 'square':
        n_c0 = n_c0_square(embedment_ratio, shape_factor_value)
    elif shape == 'circular':
        n_c0 = n_c0_circular(embedment_ratio, shape_factor_value)
    else:  # rectangular
        # 矩形锚使用与方形锚相同的对数形式，但形状因子已插值
        n_c0 = n_c0_square(embedment_ratio, shape_factor_value)
    
    # ==================== 步骤3: 计算上覆土压力项 ====================
    overburden_term = unit_weight * embedment_depth / undrained_strength
    
    # ==================== 步骤4: 计算 N_c ====================
    n_c = n_c0 + overburden_term
    
    # ==================== 步骤5: 判断深锚/浅锚 ====================
    if n_c >= n_c_star:
        n_c_final = n_c_star
        anchor_type = "deep"
    else:
        n_c_final = n_c
        anchor_type = "shallow"
    
    # ==================== 步骤6: 计算极限承载力 ====================
    q_u = undrained_strength * n_c_final
    q_u_reduced = q_u * reduction_factor
    
    q_u_base = undrained_strength * n_c_final
    Q_u = q_u_base * area
    Q_u_reduced = Q_u * reduction_factor
    
    # ==================== 返回结果 ====================
    return {
        # 最终结果
        'q_u': q_u_reduced,           # 折减后极限抗拔承载力 (kPa)
        'Q_u': Q_u_reduced,           # 折减后极限抗拔力 (kN)
        'q_u_unreduced': q_u_base,    # 未折减极限抗拔承载力 (kPa)
        'Q_u_unreduced': Q_u,         # 未折减极限抗拔力 (kN)
        
        # 承载系数
        'N_c': n_c_final,              # 最终承载系数（已考虑深锚限制）
        'N_c0': n_c0,                  # 无重度土承载系数
        'N_c_star': n_c_star,          # 深锚极限承载系数
        
        # 中间计算结果
        'anchor_type': anchor_type,    # 'shallow' 或 'deep'
        'shape_factor_S': shape_factor_value,  # 形状因子
        'overburden_term': overburden_term,    # γH/s_u
        'embedment_ratio': embedment_ratio,    # H/B 或 H/D
        'area': area,                  # 锚板投影面积 (m²)
        
        # 输入参数（用于校核）
        'reduction_factor_used': reduction_factor,
        'undrained_strength': undrained_strength,
    }


def print_results(results):
    """
    格式化输出计算结果
    
    参数:
        results: calculate_anchor_capacity 返回的字典
    """
    print("\n" + "=" * 70)
    print(" 均质黏土中水平板锚抗拔承载力计算结果")
    print("=" * 70)
    
    print("\n--- 输入参数 ---")
    print(f"  锚板面积 A                = {results['area']:.4f} m²")
    print(f"  埋深比 H/B (或 H/D)       = {results['embedment_ratio']:.4f}")
    print(f"  不排水抗剪强度 s_u        = {results.get('undrained_strength', 'N/A'):.4f} kPa")
    print(f"  折减系数 η                = {results['reduction_factor_used']:.4f}")
    
    print("\n--- 中间计算结果 ---")
    print(f"  形状因子 S                = {results['shape_factor_S']:.4f}")
    print(f"  无重度承载系数 N_c0       = {results['N_c0']:.4f}")
    print(f"  上覆土压力项 γH/s_u       = {results['overburden_term']:.4f}")
    print(f"  计算承载系数 N_c          = {results['N_c0'] + results['overburden_term']:.4f}")
    print(f"  深锚极限值 N_c*           = {results['N_c_star']:.4f}")
    print(f"  锚板类型                  = {results['anchor_type']}")
    print(f"  最终承载系数 N_c          = {results['N_c']:.4f}")
    
    print("\n--- 最终结果 ---")
    print(f"  极限抗拔承载力 (未折减)   = {results['q_u_unreduced']:.4f} kPa")
    print(f"  极限抗拔力 (未折减)       = {results['Q_u_unreduced']:.4f} kN")
    print(f"  极限抗拔承载力 (折减后)   = {results['q_u']:.4f} kPa")
    print(f"  极限抗拔力 (折减后)       = {results['Q_u']:.4f} kN")
    print("=" * 70)


# ==================== 使用示例 ====================
if __name__ == "__main__":
    # 论文示例: 方形锚，B=0.2m，H=1.5m，s_u=50kPa，γ=15kN/m³
    print("\n" + "=" * 70)
    print(" 示例1: 论文算例验证（方形锚）")
    print("=" * 70)
    
    result_square = calculate_anchor_capacity(
        shape='square',
        width=0.2,
        height=None,
        embedment_depth=1.5,
        undrained_strength=50.0,
        unit_weight=15.0,
        reduction_factor=1.0,  # 论文示例未考虑折减，取1.0用于对比
        length=None
    )
    
    print_results(result_square)
    print("\n论文示例结果: Q_u = 23.8 kN, q_u = 595.0 kPa")
    print(f"相对误差: Q_u = {(result_square['Q_u_unreduced'] - 23.8)/23.8*100:.2f}%")
    
    # 示例2: 圆形锚
    print("\n" + "\n" + "=" * 70)
    print(" 示例2: 圆形锚计算示例（考虑折减系数 η=0.75）")
    print("=" * 70)
    
    result_circular = calculate_anchor_capacity(
        shape='circular',
        width=0.5,          # 直径 D = 0.5 m
        height=None,
        embedment_depth=2.5,
        undrained_strength=40.0,
        unit_weight=16.0,
        reduction_factor=0.75,
        length=None
    )
    
    print_results(result_circular)
    
    # 示例3: 矩形锚
    print("\n" + "\n" + "=" * 70)
    print(" 示例3: 矩形锚计算示例（L/B=3，考虑折减）")
    print("=" * 70)
    
    result_rectangular = calculate_anchor_capacity(
        shape='rectangular',
        width=0.3,          # 短边 B = 0.3 m
        height=None,
        embedment_depth=1.8,
        undrained_strength=60.0,
        unit_weight=17.0,
        reduction_factor=0.75,
        length=0.9          # 长边 L = 0.9 m (L/B=3)
    )
    
    print_results(result_rectangular)