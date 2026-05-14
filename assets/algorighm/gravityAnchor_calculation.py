# -*- coding: utf-8 -*-
"""
================================================================================
模块名称: gravity_anchor_capacity.py
功能描述: 重力锚在黏土中的承载力计算工具
          - 平底重力锚水平承载力计算
          - 带剪力键(裙板)重力锚水平承载力计算
          - 重力锚上拔力计算(含修正因子F和Kc)
          - 重力锚贯入阻力计算
          - 重力锚防倾覆稳定性计算

引用文献:
[1] 黄博晓. 深海重力锚在黏土中水平承载及抗拔性能的模型试验研究[D]. 
    天津大学, 2021. (论文第2章 2.2-2.6节)
[2] DNVGL-RP-E303: Geotechnical Design and Installation of Suction Anchors in Clay
[3] API RP 2GEO: Geotechnical and Foundation Design Considerations

计算假设与适用范围:
1. 土体为饱和黏土，采用不排水抗剪强度分析框架
2. 土体抗剪强度随深度线性增加: Su(z) = Sum + k * z
3. 重力锚放置于海床表面或浅埋状态
4. 适用于正常固结或轻微超固结黏土

版本: 2.0 (重构参数设计)
创建日期: 2026-04-08
================================================================================
"""

import math
from typing import Dict, Optional, Literal

AnchorType = Literal["flat", "skirted"]


class GravityAnchorInClay:
    """
    黏土中重力锚承载力计算类
    """
    
    def __init__(self):
        """初始化计算器，设置默认参数"""
        # 粘着系数 α，典型范围0.3-0.6，推荐取值0.5
        self.default_alpha = 0.5
        
        # 承载力系数 Nc
        # 规范推荐值9.0，论文案例使用6.095
        self.Nc_design = 9.0
        self.Nc_paper = 6.095
        
        # 修正因子F系数 (粗糙接触，论文表2-2)
        self.F_coeff_rough = {'a': 2.56, 'b': 0.457, 'c': 0.713, 'd': 1.38}
        
        # 修正因子F系数 (光滑接触)
        self.F_coeff_smooth = {'a': 1.372, 'b': 0.07, 'c': -0.128, 'd': 0.342}
        
        # 锚型参数
        self.anchor_type: AnchorType = "flat"
        
        # 几何参数
        self.L = 0.0      # 锚长度 (m)
        self.B = 0.0      # 锚宽度 (m)
        self.H = 0.0      # 锚高度 (m)
        self.zs = 0.0     # 裙板贯入深度 (m)，仅 skirted 模式有效
        self.W = 0.0      # 水中锚重量 (kN)
        
        # 土体参数
        self.Sum = 0.0    # 泥线处不排水抗剪强度 (kPa)
        self.k = 0.0      # 抗剪强度梯度 (kPa/m)
        self.gamma_b = 0.0  # 土体浮重度 (kN/m³)
        self.alpha = self.default_alpha  # 粘着系数 α
        
    def set_anchor_type(self, anchor_type: AnchorType, skirt_depth: float = 0.0) -> None:
        """
        设置重力锚类型
        
        参数:
            anchor_type: 锚类型，可选 "flat" (平底锚) 或 "skirted" (带裙板锚)
            skirt_depth: 裙板贯入深度 (m)，仅当 anchor_type="skirted" 时有效
        """
        self.anchor_type = anchor_type
        if anchor_type == "skirted":
            self.zs = skirt_depth
        else:
            self.zs = 0.0
        
    def set_anchor_geometry(self, length: float, width: float, height: float,
                           weight_in_water: float = 0.0) -> None:
        """
        设置重力锚几何参数
        
        参数:
            length: 锚长度 L (m)
            width: 锚宽度 B (m)
            height: 锚高度 H (m)
            weight_in_water: 水中锚重量 W (kN)
        """
        self.L = length
        self.B = width
        self.H = height
        self.W = weight_in_water
        
        self.A_base = self.L * self.B
        self.lever_arm_resisting = self.L / 2.0
        
    def set_soil_properties(self, sum: float, k: float, gamma_b: float,
                           adhesion_factor: Optional[float] = None) -> None:
        """
        设置土体参数
        
        参数:
            sum: 泥线处不排水抗剪强度 Sum (kPa)
            k: 抗剪强度随深度变化率 (kPa/m)
            gamma_b: 土体浮重度 γb (kN/m³)
            adhesion_factor: 粘着系数 α
        """
        self.Sum = sum
        self.k = k
        self.gamma_b = gamma_b
        self.alpha = adhesion_factor if adhesion_factor is not None else self.default_alpha
        
    def get_su_at_depth(self, z: float) -> float:
        """
        计算给定深度处的不排水抗剪强度
        公式: Su(z) = Sum + k * z (论文第2.1节)
        """
        return self.Sum + self.k * z
    
    def get_average_su(self, z_min: float, z_max: float) -> float:
        """计算深度区间内的平均不排水抗剪强度"""
        su_min = self.get_su_at_depth(z_min)
        su_max = self.get_su_at_depth(z_max)
        return (su_min + su_max) / 2.0
    
    def calculate_su2(self, F: float, Nc: float, Su0: float, kappa: float, B_prime: float) -> float:
        """
        计算基部以下等效剪切强度 su2
        公式来源: 论文第2.3节，公式(2-12)
        su2 = F(Nc*Su0 + κ*B'/4) / Nc
        """
        return F * (Nc * Su0 + kappa * B_prime / 4.0) / Nc
    
    def calculate_horizontal_capacity(self, effective_depth: float) -> Dict:
        """
        重力锚水平承载力计算 (统一公式，适用于平底锚和带裙板锚)
        
        公式来源: 论文第2.2节，公式(2-5)
        Fh = Suz * A + [2 * Sua * z + γb * 0.5 * z²] * B
        
        参数:
            effective_depth: 有效计算深度 (m)
                - 平底锚: 取较小的有效深度 (如0.1~0.3倍锚高)
                - 带裙板锚: 取裙板贯入深度 zs
        """
        if effective_depth <= 0:
            # 平底锚默认使用0.26m（论文案例值）
            effective_depth = 0.26
            
        su_z = self.get_su_at_depth(effective_depth)
        su_a = self.get_average_su(0.0, effective_depth)
        
        term1 = su_z * self.A_base
        term2_inner = 2.0 * su_a * effective_depth + self.gamma_b * 0.5 * effective_depth * effective_depth
        term2 = term2_inner * self.B
        fh = term1 + term2
        
        return {
            'horizontal_capacity_kN': fh,
            'effective_depth_m': effective_depth,
            'su_at_depth_kPa': su_z,
            'average_su_kPa': su_a,
            'term1_base_adhesion_kN': term1,
            'term2_resistance_kN': term2
        }
    
    def calculate_factor_F(self, x: float, use_rough_contact: bool = True) -> float:
        """
        计算修正因子F
        
        公式来源: 论文第2.3节，公式(2-9)
        F = a + b*x - sqrt((c + b*x)^2 + d^2)
        """
        coeff = self.F_coeff_rough if use_rough_contact else self.F_coeff_smooth
        
        a = coeff['a']
        b = coeff['b']
        c = coeff['c']
        d = coeff['d']
        
        inner = c + b * x
        F = a + b * x - math.sqrt(inner * inner + d * d)
        
        return F
    
    def calculate_factor_Kc(self, B_prime: float, L_prime: float, D: float,
                           Su0: float, Su_ave: float, Su2: float,
                           H_prime: float, A_prime: float,
                           nu: float = 0.0, beta: float = 0.0) -> float:
        """
        计算修正因子Kc
        
        公式来源: 论文第2.3节，公式(2-10)和(2-11)
        Kc = 1 + sc + dc - ic - bc - gc
        """
        x = self.k * B_prime / Su0 if Su0 > 0 else 0.0
        x = max(0.0, min(x, 10.0))
        
        scv = 0.18 - 0.155 * math.sqrt(x) + 0.021 * x
        
        ratio = H_prime / (A_prime * Su0) if (A_prime * Su0) > 0 else 0.0
        ratio = max(0.0, min(ratio, 0.999))
        ic = 0.5 - 0.5 * math.sqrt(1.0 - ratio)
        
        sc = scv * (1.0 - 2.0 * ic) * (B_prime / L_prime)
        
        if Su2 > 0 and B_prime > 0:
            dc = 0.3 * (Su_ave / Su2) * math.atan(D / B_prime)
        else:
            dc = 0.0
        
        bc = 0.4 * nu
        gc = 0.4 * beta
        
        Kc = 1.0 + sc + dc - ic - bc - gc
        
        return Kc
    
    def calculate_uplift_capacity(self, B_prime: float, A_prime: float,
                                  Su0: float, kappa: float,
                                  Su_ave: float,
                                  D: float, L_prime: float,
                                  H_prime: float = 0.0,
                                  use_rough_contact: bool = True,
                                  use_paper_Nc: bool = True) -> Dict:
        """
        计算重力锚上拔力 (竖向极限承载力)
        
        公式来源: 论文第2.3节，公式(2-8)至(2-13)
        Ve = F(Su0*Nc + κ*B'/4) * Kc * A'
        总上拔力 = Ve + Vs + W
        """
        Nc = self.Nc_paper if use_paper_Nc else self.Nc_design
        
        x = kappa * B_prime / Su0 if Su0 > 0 else 0.0
        F = self.calculate_factor_F(x, use_rough_contact)
        
        bearing_term = Su0 * Nc + kappa * B_prime / 4.0
        
        # 按式(2-12)计算su2
        Su2 = self.calculate_su2(F, Nc, Su0, kappa, B_prime)
        
        Kc = self.calculate_factor_Kc(
            B_prime=B_prime, L_prime=L_prime, D=D,
            Su0=Su0, Su_ave=Su_ave, Su2=Su2,
            H_prime=H_prime, A_prime=A_prime
        )
        
        Ve = F * bearing_term * Kc * A_prime
        
        # 侧向摩擦力 (仅带裙板锚有贡献)
        if self.anchor_type == "skirted" and self.zs > 0:
            As = 2.0 * (self.L + self.B) * self.zs
            Vs = self.alpha * As * Su_ave
        else:
            As = 0.0
            Vs = 0.0
        
        # 总上拔力 = 土体抗拔力 + 锚水中自重
        total_uplift = Ve + Vs + self.W
        
        return {
            'uplift_capacity_kN': total_uplift,
            've_base_capacity_kN': Ve,
            'vs_skirt_friction_kN': Vs,
            'anchor_weight_kN': self.W,
            'factor_F': F,
            'factor_Kc': Kc,
            'x_parameter': x,
            'bearing_term_kPa': bearing_term,
            'su2_calculated_kPa': Su2,
            'skirt_area_m2': As
        }
    
    def calculate_penetration_resistance(self, z: float, A_side: float,
                                         A_tip: float, Nc: Optional[float] = None) -> Dict:
        """
        计算重力锚贯入阻力
        
        公式来源: 论文第2.5节，公式(2-16)
        Qtot = Qside + Qtip
        """
        if Nc is None:
            Nc = self.Nc_design
        
        su_avg = self.get_average_su(0.0, z)
        Qside = A_side * self.alpha * su_avg
        
        su_tip = self.get_su_at_depth(z)
        Qtip = (Nc * su_tip + self.gamma_b * z) * A_tip
        
        Qtot = Qside + Qtip
        
        return {
            'penetration_resistance_kN': Qtot,
            'qside_side_resistance_kN': Qside,
            'qtip_tip_resistance_kN': Qtip,
            'su_average_kPa': su_avg,
            'su_tip_kPa': su_tip,
            'Nc_used': Nc
        }
    
    def calculate_overturning_stability(self, T: float, A_arm: Optional[float] = None, 
                                        L_arm: Optional[float] = None) -> Dict:
        """
        计算防倾覆稳定性
        
        公式来源: 论文第2.6节，公式(2-17)
        MO = T * A, MR = G * L
        安全系数 = MR / MO
        
        参数:
            T: 设计水平荷载/缆绳拉力 (kN)
            A_arm: 倾覆力臂 (m)，缆绳作用点到锚前端支点的垂直距离
            L_arm: 抗倾覆力臂 (m)，锚自重作用点到倾覆支点的水平距离
        """
        if A_arm is None:
            A_arm = self.H / 2.0
        
        if L_arm is None:
            L_arm = self.lever_arm_resisting
        
        MO = T * A_arm
        MR = self.W * L_arm
        safety_factor = MR / MO if MO > 0 else float('inf')
        is_stable = safety_factor >= 1.5
        
        return {
            'overturning_moment_MO_kN_m': MO,
            'resisting_moment_MR_kN_m': MR,
            'safety_factor': safety_factor,
            'is_stable': is_stable,
            'stability_status': '稳定 (安全系数 ≥ 1.5)' if is_stable else '不稳定 (安全系数 < 1.5，可能倾覆)',
            'A_arm_m': A_arm,
            'L_arm_m': L_arm
        }
    
    def run_flat_anchor_demo(self) -> None:
        """运行平底锚论文案例验证 (论文表2-5: 平底重力锚案例)"""
        print("\n" + "=" * 70)
        print("平底重力锚承载力计算 - 论文案例验证")
        print("=" * 70)
        
        # ----- 输入参数 (论文表2-3, 2-4) -----
        print("\n--- 输入参数 ---")
        
        # 设置为平底锚类型
        self.set_anchor_type(anchor_type="flat", skirt_depth=0.0)
        
        self.set_anchor_geometry(
            length=3.0,
            width=3.0,
            height=1.5,
            weight_in_water=68.0 * 9.80665  # 68t × 9.80665 = 666.8 kN
        )
        print(f"  锚类型: 平底重力锚")
        print(f"  锚尺寸 L×B×H: {self.L:.1f}m × {self.B:.1f}m × {self.H:.1f}m")
        print(f"  水中锚重量 W: {self.W:.1f}kN")
        
        self.set_soil_properties(
            sum=3.15,
            k=8.18,
            gamma_b=10.15,
            adhesion_factor=0.5
        )
        print(f"  泥线强度 Sum: {self.Sum:.2f}kPa")
        print(f"  强度梯度 k: {self.k:.2f}kPa/m")
        print(f"  浮容重 γb: {self.gamma_b:.2f}kN/m³")
        print(f"  粘着系数 α: {self.alpha:.1f}")
        
        # ----- 水平承载力计算 (平底锚) -----
        print("\n--- 水平承载力 (平底锚) ---")
        # 平底锚有效深度取0.26m（论文案例值）
        result_h = self.calculate_horizontal_capacity(effective_depth=0.26)
        print(f"  有效计算深度 z = {result_h['effective_depth_m']:.2f} m")
        print(f"  底部强度 Suz = {result_h['su_at_depth_kPa']:.2f} kPa")
        print(f"  平均强度 Sua = {result_h['average_su_kPa']:.2f} kPa")
        print(f"  底部粘着力: {result_h['term1_base_adhesion_kN']:.1f} kN")
        print(f"  侧向阻力: {result_h['term2_resistance_kN']:.1f} kN")
        print(f"  水平承载力 Fh = {result_h['horizontal_capacity_kN']:.1f} kN")
        print(f"  论文表2-5参考值: 379.5 kN")
        
        # ----- 上拔力计算 -----
        print("\n--- 上拔力 ---")
        B_prime = self.B
        A_prime = self.A_base
        effective_depth = 0.26  # 平底锚有效深度
        Su0 = self.get_su_at_depth(effective_depth)
        kappa = self.k
        Su_ave = self.get_average_su(0.0, effective_depth)
        D = effective_depth
        L_prime = self.L
        
        result_u = self.calculate_uplift_capacity(
            B_prime=B_prime, A_prime=A_prime, Su0=Su0, kappa=kappa,
            Su_ave=Su_ave, D=D, L_prime=L_prime,
            H_prime=0.0, use_rough_contact=True, use_paper_Nc=True
        )
        print(f"  无量纲参数 x = {result_u['x_parameter']:.2f}")
        print(f"  修正因子 F = {result_u['factor_F']:.3f}, Kc = {result_u['factor_Kc']:.3f}")
        print(f"  su2 = {result_u['su2_calculated_kPa']:.2f} kPa (按式2-12计算)")
        print(f"  底部承载力 Ve = {result_u['ve_base_capacity_kN']:.1f} kN")
        print(f"  侧向摩擦力 Vs = {result_u['vs_skirt_friction_kN']:.1f} kN (平底锚无裙板, Vs=0)")
        print(f"  锚水中自重 W = {result_u['anchor_weight_kN']:.1f} kN")
        print(f"  总上拔力 = {result_u['uplift_capacity_kN']:.1f} kN")
        print(f"  论文表2-5参考值: 1196.5 kN")
        
        # ----- 贯入阻力计算 -----
        print("\n--- 贯入阻力 ---")
        perimeter = 2.0 * (self.L + self.B)
        A_side = perimeter * effective_depth
        A_tip = self.A_base
        print(f"  侧面积 A_side = {A_side:.3f} m²")
        print(f"  端部面积 A_tip = {A_tip:.1f} m²")
        
        result_p_paper = self.calculate_penetration_resistance(
            z=effective_depth, A_side=A_side, A_tip=A_tip, Nc=self.Nc_paper
        )
        print(f"  Nc = {self.Nc_paper} (论文值)")
        print(f"  平均强度 Su_avg = {result_p_paper['su_average_kPa']:.2f} kPa")
        print(f"  端部强度 Su_tip = {result_p_paper['su_tip_kPa']:.2f} kPa")
        print(f"  侧边阻力 Qside = {result_p_paper['qside_side_resistance_kN']:.1f} kN")
        print(f"  端部阻力 Qtip = {result_p_paper['qtip_tip_resistance_kN']:.1f} kN")
        print(f"  总贯入阻力 = {result_p_paper['penetration_resistance_kN']:.1f} kN")
        print(f"  论文表2-5参考值: 342.8 kN")
        
        # ----- 防倾覆计算 -----
        print("\n--- 防倾覆稳定性 ---")
        design_load = 588.5  # 防倾覆设计荷载 (由论文安全系数2.266反推)
        A_arm = 0.75
        L_arm = 1.5
        result_o = self.calculate_overturning_stability(
            T=design_load, A_arm=A_arm, L_arm=L_arm
        )
        print(f"  设计荷载 T = {design_load:.1f} kN")
        print(f"  倾覆力臂 A = {result_o['A_arm_m']:.2f} m")
        print(f"  抗倾覆力臂 L = {result_o['L_arm_m']:.2f} m")
        print(f"  倾覆力矩 MO = {result_o['overturning_moment_MO_kN_m']:.1f} kN·m")
        print(f"  抗倾覆力矩 MR = {result_o['resisting_moment_MR_kN_m']:.1f} kN·m")
        print(f"  安全系数 = {result_o['safety_factor']:.3f}")
        print(f"  稳定性: {result_o['stability_status']}")
        print(f"  论文表2-5参考安全系数: 2.266")
        
        # ----- 最终结果汇总 -----
        print("\n" + "=" * 70)
        print("=== 最终结果汇总 ===")
        print("=" * 70)
        print(f"\n  水平承载力 Fh: {result_h['horizontal_capacity_kN']:>12.1f} kN  (论文: 379.5 kN)")
        print(f"  上拔力: {result_u['uplift_capacity_kN']:>12.1f} kN  (论文: 1196.5 kN)")
        print(f"  贯入阻力: {result_p_paper['penetration_resistance_kN']:>12.1f} kN  (论文: 342.8 kN)")
        print(f"  抗倾覆安全系数: {result_o['safety_factor']:>12.3f}  (论文: 2.266)")
        
        print("\n" + "-" * 70)
        print("说明:")
        print("  1. 本案例为平底重力锚，使用公式(2-5)计算水平承载力")
        print("  2. 上拔力计算采用论文Nc=6.095，按式(2-12)计算su2")
        print("  3. 贯入阻力使用论文Nc=6.095")
        print("  4. 防倾覆荷载T=588.5kN由论文安全系数2.266反推计算")
        print("=" * 70)
    
    def run_skirted_anchor_demo(self) -> None:
        """运行带裙板锚案例验证"""
        print("\n" + "=" * 70)
        print("带裙板(剪力键)重力锚承载力计算 - 案例演示")
        print("=" * 70)
        
        # ----- 输入参数 -----
        print("\n--- 输入参数 ---")
        
        # 设置为带裙板锚类型
        self.set_anchor_type(anchor_type="skirted", skirt_depth=0.5)
        
        self.set_anchor_geometry(
            length=3.0,
            width=3.0,
            height=1.5,
            weight_in_water=666.8
        )
        print(f"  锚类型: 带裙板(剪力键)重力锚")
        print(f"  锚尺寸 L×B×H: {self.L:.1f}m × {self.B:.1f}m × {self.H:.1f}m")
        print(f"  裙板贯入深度 zs: {self.zs:.2f}m")
        print(f"  水中锚重量 W: {self.W:.1f}kN")
        
        self.set_soil_properties(
            sum=3.15,
            k=8.18,
            gamma_b=10.15,
            adhesion_factor=0.5
        )
        print(f"  泥线强度 Sum: {self.Sum:.2f}kPa")
        print(f"  强度梯度 k: {self.k:.2f}kPa/m")
        print(f"  浮容重 γb: {self.gamma_b:.2f}kN/m³")
        
        # ----- 水平承载力计算 (带裙板锚) -----
        print("\n--- 水平承载力 (带裙板锚) ---")
        result_h = self.calculate_horizontal_capacity(effective_depth=self.zs)
        print(f"  裙板深度 zs = {result_h['effective_depth_m']:.2f} m")
        print(f"  裙板底部强度 Suz = {result_h['su_at_depth_kPa']:.2f} kPa")
        print(f"  平均强度 Sua = {result_h['average_su_kPa']:.2f} kPa")
        print(f"  底部粘着力: {result_h['term1_base_adhesion_kN']:.1f} kN")
        print(f"  侧向阻力(裙板贡献): {result_h['term2_resistance_kN']:.1f} kN")
        print(f"  水平承载力 Fh = {result_h['horizontal_capacity_kN']:.1f} kN")
        
        # ----- 上拔力计算 (计入裙板侧向摩擦力) -----
        print("\n--- 上拔力 (计入裙板侧摩阻力) ---")
        B_prime = self.B
        A_prime = self.A_base
        Su0 = self.get_su_at_depth(self.zs)
        Su_ave = self.get_average_su(0.0, self.zs)
        
        result_u = self.calculate_uplift_capacity(
            B_prime=B_prime, A_prime=A_prime, Su0=Su0, kappa=self.k,
            Su_ave=Su_ave, D=self.zs, L_prime=self.L,
            H_prime=0.0, use_rough_contact=True, use_paper_Nc=True
        )
        print(f"  底部承载力 Ve = {result_u['ve_base_capacity_kN']:.1f} kN")
        print(f"  裙板侧向摩擦力 Vs = {result_u['vs_skirt_friction_kN']:.1f} kN")
        print(f"  锚水中自重 W = {result_u['anchor_weight_kN']:.1f} kN")
        print(f"  总上拔力 = {result_u['uplift_capacity_kN']:.1f} kN")
        
        print("\n" + "=" * 70)


def main():
    """主函数: 运行重力锚承载力计算工具"""
    print("=" * 70)
    print("重力锚在黏土中承载力计算工具 v2.0")
    print("基于: 黄博晓(2021)硕士论文 + DNV/API规范")
    print("=" * 70)
    
    calculator = GravityAnchorInClay()
    
    # 运行平底锚案例（论文验证）
    calculator.run_flat_anchor_demo()
    
    # 可选：运行带裙板锚案例
    calculator.run_skirted_anchor_demo()
    
    print("\n计算完成")


if __name__ == "__main__":
    main()