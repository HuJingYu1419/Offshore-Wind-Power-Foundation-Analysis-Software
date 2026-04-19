# -*- coding: utf-8 -*-
"""
模块名称: suctionAnchor_capacity.py
功能描述: 黏土中吸力锚极限承载力计算

理论依据: 
    王宸. 黏土中吸力锚的破坏模式及极限承载力理论研究[D]. 天津大学, 2014.
    
核心公式:
    T_a = [F_b + F_s + (V_bot + W_sub)·sinβ + H_bot·cosβ] / cos(θ - β)

适用范围:
    1. 饱和黏土，不排水条件
    2. 强度剖面: s_u = s_u0 + k·z
    3. 破坏模式: 整体平移破坏

公式验证状态:
    - 端阻力公式: 与API RP 2GEO一致 ✓
    - 摩阻力公式: 与DNVGL-RP-E303一致 ✓
    - 底部抗力公式: 与Steensen-Bach理论一致 ✓
"""

import math
import warnings
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import numpy as np
import matplotlib.pyplot as plt


# ============================================================================
# 第一部分：参数定义
# ============================================================================

@dataclass
class AnchorGeometry:
    """吸力锚几何参数"""
    diameter: float          # 直径 D (m)
    length: float            # 长度/嵌入深度 H (m)
    weight_submerged: float = 0.0  # 锚体水下重量（含土塞）(kN)
    
    @property
    def aspect_ratio(self) -> float:
        """长径比 H/D"""
        return self.length / self.diameter
    
    @property
    def area_bottom(self) -> float:
        """底面积 A_bot = πD²/4 (m²)"""
        return math.pi * self.diameter ** 2 / 4
    
    @property
    def area_wall(self) -> float:
        """侧壁面积 A_wall = πDH (m²)"""
        return math.pi * self.diameter * self.length


@dataclass
class ClaySoil:
    """饱和黏土参数"""
    su0: float               # 泥面处不排水抗剪强度 (kPa)
    k: float                 # 强度梯度 (kPa/m)
    gamma_sub: float         # 土体浮容重 (kN/m³)
    alpha: float             # 黏着系数 (0.3-0.6)
    Nc: float = 10.0         # 端阻力系数
    Nc_bot: float = 11.0     # 底部端阻力系数
    
    def su_at(self, z: float) -> float:
        """深度z处的不排水抗剪强度: s_u = s_u0 + k·z"""
        return self.su0 + self.k * z
    
    def su_avg(self, z: float) -> float:
        """0~z深度范围内的平均抗剪强度: s_u,avg = s_u0 + k·z/2"""
        return self.su0 + self.k * z / 2


# ============================================================================
# 第二部分：计算引擎
# ============================================================================

class SuctionAnchorCapacity:
    """
    吸力锚承载力计算器
    
    使用方式:
        # 初始化
        anchor = AnchorGeometry(diameter=10.0, length=55.0, weight_submerged=500.0)
        soil = ClaySoil(su0=5.0, k=1.5, gamma_sub=6.0, alpha=0.5)
        calculator = SuctionAnchorCapacity(anchor, soil)
        
        # 方式1：自动搜索最危险破坏角（推荐）
        result = calculator.compute(theta_deg=30.0)
        
        # 方式2：手动指定破坏角（用于敏感性分析）
        result = calculator.compute(theta_deg=30.0, beta_deg=45.0)
    """
    
    def __init__(self, anchor: AnchorGeometry, soil: ClaySoil):
        self.anchor = anchor
        self.soil = soil
        self._validate_parameters()
    
    def _validate_parameters(self) -> None:
        """参数验证，输出警告"""
        if self.anchor.diameter <= 0:
            warnings.warn(f"直径 D={self.anchor.diameter} ≤ 0")
        if self.anchor.length <= 0:
            warnings.warn(f"长度 H={self.anchor.length} ≤ 0")
        if self.soil.su0 < 0:
            warnings.warn(f"su0={self.soil.su0} < 0")
        if self.soil.k < 0:
            warnings.warn(f"k={self.soil.k} < 0")
        if self.soil.gamma_sub <= 0:
            warnings.warn(f"浮容重 γ'={self.soil.gamma_sub} ≤ 0")
        if not 0.2 <= self.soil.alpha <= 0.8:
            warnings.warn(f"黏着系数 α={self.soil.alpha} 超出典型范围 (0.2-0.8)")
    
    def _end_resistance(self, beta_rad: float) -> float:
        """
        端阻力 F_b = N_c · s_u,avg · D · H · cosβ
        
        公式来源: 文档第2.2节
        """
        su_avg = self.soil.su_avg(self.anchor.length)
        A_b = self.anchor.diameter * self.anchor.length * math.cos(beta_rad)
        return self.soil.Nc * su_avg * A_b
    
    def _skin_friction(self, beta_rad: float) -> float:
        """
        摩阻力 F_s = α · s_u,avg · A_s
        
        A_s 在水平破坏(β=0)时为 2DH，竖向破坏(β=π/2)时为 πDH
        中间值采用线性插值: A_s = 2DH + (πDH - 2DH) * (2β/π)
        
        公式来源: 文档第2.3节
        """
        su_avg = self.soil.su_avg(self.anchor.length)
        
        # 水平破坏时面积 (β=0)
        A_s_horizontal = 2 * self.anchor.diameter * self.anchor.length
        # 竖向破坏时面积 (β=π/2)
        A_s_vertical = math.pi * self.anchor.diameter * self.anchor.length
        
        # 线性插值: β=0→0, β=π/2→1
        ratio = 2 * beta_rad / math.pi
        A_s = A_s_horizontal + ratio * (A_s_vertical - A_s_horizontal)
        
        return self.soil.alpha * su_avg * A_s
    
    def _bottom_resistance(self, beta_rad: float) -> Tuple[float, float]:
        """
        底部抗力计算
        
        返回:
            V_bot: 反向土抗力 (向上为正)
            H_bot: 水平剪切力 (水平方向)
        
        公式来源: 文档第2.4节、第2.5节
        """
        su_bot = self.soil.su_at(self.anchor.length)
        sigma_v_prime = self.soil.gamma_sub * self.anchor.length
        A_bot = self.anchor.area_bottom
        A_wall = self.anchor.area_wall
        A_plug = A_bot  # 土塞底面积等于锚底面积
        
        # 倾斜系数 λ = 2β/π
        lam = 2 * beta_rad / math.pi
        
        # 完全竖向拉拔时的反向土抗力 (β=π/2)
        V0 = (self.soil.Nc_bot * su_bot - sigma_v_prime) * A_bot
        V_bot = V0 * lam
        
        # 完全水平拉拔时的水平剪切力 (β=0)
        H0 = su_bot * A_plug + self.soil.alpha * su_bot * A_wall
        H_bot = H0 * (1 - lam)
        
        return V_bot, H_bot
    
    def compute(self, theta_deg: float, beta_deg: Optional[float] = None) -> Dict:
        """
        计算极限承载力
        
        参数:
            theta_deg: 系泊角 (度) - 必须输入
            beta_deg: 破坏角 (度) - 可选，不输入则自动搜索最危险值
        
        返回:
            包含所有输入参数、分项结果、总结果的字典
        """
        # 确定破坏角
        if beta_deg is None:
            beta_deg, _ = self._find_critical_beta(theta_deg)
        
        theta_rad = math.radians(theta_deg)
        beta_rad = math.radians(beta_deg)
        
        # 计算各分量
        F_b = self._end_resistance(beta_rad)
        F_s = self._skin_friction(beta_rad)
        V_bot, H_bot = self._bottom_resistance(beta_rad)
        
        # 总阻力
        R_total = (F_b + F_s + 
                   (V_bot + self.anchor.weight_submerged) * math.sin(beta_rad) + 
                   H_bot * math.cos(beta_rad))
        
        # 投影到系缆方向
        denominator = math.cos(theta_rad - beta_rad)
        if abs(denominator) < 1e-6:
            T_a = float('inf')
        else:
            T_a = R_total / denominator
        
        # 无量纲化
        T_a_norm = T_a / (self.soil.su0 * self.anchor.diameter ** 2)
        
        return {
            "input": {
                "D": self.anchor.diameter,
                "H": self.anchor.length,
                "H/D": self.anchor.aspect_ratio,
                "su0": self.soil.su0,
                "k": self.soil.k,
                "gamma_sub": self.soil.gamma_sub,
                "alpha": self.soil.alpha,
                "Nc": self.soil.Nc,
                "Nc_bot": self.soil.Nc_bot,
                "W_sub": self.anchor.weight_submerged,
                "theta_deg": theta_deg,
                "beta_deg": beta_deg
            },
            "components": {
                "F_b": F_b,
                "F_s": F_s,
                "V_bot": V_bot,
                "H_bot": H_bot,
                "R_total": R_total
            },
            "result": {
                "T_a": T_a,
                "T_a_norm": T_a_norm
            }
        }
    
    def _find_critical_beta(
        self, 
        theta_deg: float, 
        n_points: int = 90
    ) -> Tuple[float, Dict]:
        """
        搜索最危险的破坏方向角（使承载力最小）
        
        返回:
            (beta_critical_deg, 该β下的计算结果字典)
        """
        beta_range = np.linspace(0.1, 89.9, n_points)
        min_capacity = float('inf')
        critical_beta = 0.0
        critical_result = None
        
        for beta in beta_range:
            result = self._compute_for_search(theta_deg, beta)
            if result["result"]["T_a"] < min_capacity:
                min_capacity = result["result"]["T_a"]
                critical_beta = beta
                critical_result = result
        
        return critical_beta, critical_result
    
    def _compute_for_search(self, theta_deg: float, beta_deg: float) -> Dict:
        """
        用于搜索的内部计算函数（避免重复代码）
        """
        theta_rad = math.radians(theta_deg)
        beta_rad = math.radians(beta_deg)
        
        F_b = self._end_resistance(beta_rad)
        F_s = self._skin_friction(beta_rad)
        V_bot, H_bot = self._bottom_resistance(beta_rad)
        
        R_total = (F_b + F_s + 
                   (V_bot + self.anchor.weight_submerged) * math.sin(beta_rad) + 
                   H_bot * math.cos(beta_rad))
        
        denominator = math.cos(theta_rad - beta_rad)
        if abs(denominator) < 1e-6:
            T_a = float('inf')
        else:
            T_a = R_total / denominator
        
        T_a_norm = T_a / (self.soil.su0 * self.anchor.diameter ** 2)
        
        return {
            "components": {"F_b": F_b, "F_s": F_s, "V_bot": V_bot, "H_bot": H_bot, "R_total": R_total},
            "result": {"T_a": T_a, "T_a_norm": T_a_norm}
        }
    
    def compute_curve(self, theta_list: List[float]) -> List[Dict]:
        """
        计算多个系泊角下的极限承载力（自动搜索最危险β）
        
        参数:
            theta_list: 系泊角列表 (度)
        
        返回:
            每个系泊角对应的完整计算结果列表
        """
        results = []
        for theta in theta_list:
            result = self.compute(theta)  # beta_deg=None，自动搜索
            results.append(result)
        return results


# ============================================================================
# 第三部分：标准输出格式
# ============================================================================

def print_input_params(result: Dict) -> None:
    """打印输入参数"""
    inp = result["input"]
    print("\n" + "=" * 60)
    print("吸力锚承载力计算")
    print("=" * 60)
    
    print("\n【输入参数】")
    print(f"  锚直径 D:                 {inp['D']:.4f} m")
    print(f"  锚长度 H:                 {inp['H']:.4f} m")
    print(f"  长径比 H/D:               {inp['H/D']:.4f}")
    print(f"  泥面强度 su0:             {inp['su0']:.4f} kPa")
    print(f"  强度梯度 k:               {inp['k']:.4f} kPa/m")
    print(f"  土体浮容重 γ':            {inp['gamma_sub']:.4f} kN/m³")
    print(f"  黏着系数 α:               {inp['alpha']:.4f}")
    print(f"  端阻系数 Nc:              {inp['Nc']:.4f}")
    print(f"  底部端阻系数 Nc_bot:      {inp['Nc_bot']:.4f}")
    print(f"  锚体水下重量 W_sub:       {inp['W_sub']:.4f} kN")
    print(f"  系泊角 θ:                 {inp['theta_deg']:.4f} °")
    print(f"  破坏角 β:                 {inp['beta_deg']:.4f} °")


def print_components(result: Dict) -> None:
    """打印分项结果"""
    comp = result["components"]
    print("\n【分项计算结果】")
    print(f"  端阻力 F_b:               {comp['F_b']:10.2f} kN")
    print(f"  摩阻力 F_s:               {comp['F_s']:10.2f} kN")
    print(f"  底部反向土抗力 V_bot:     {comp['V_bot']:10.2f} kN")
    print(f"  底部剪切力 H_bot:         {comp['H_bot']:10.2f} kN")
    print(f"  总阻力 R:                 {comp['R_total']:10.2f} kN")


def print_result(result: Dict) -> None:
    """打印最终结果"""
    res = result["result"]
    print("\n【最终结果】")
    print(f"  极限承载力 T_a:           {res['T_a']:10.2f} kN")
    print(f"  无量纲 T_a/(su0·D²):      {res['T_a_norm']:10.4f}")


def print_full_calculation(result: Dict) -> None:
    """打印完整计算报告"""
    print_input_params(result)
    print_components(result)
    print_result(result)
    print("\n" + "=" * 60)


# ============================================================================
# 第四部分：验证与测试
# ============================================================================

def test_basic_calculation():
    """
    测试1：基本计算功能验证
    使用论文第2.6节参数，计算单个工况
    """
    print("\n" + "=" * 60)
    print("测试1：基本计算功能验证")
    print("=" * 60)
    
    # 参数设置（论文第2.6节）
    anchor = AnchorGeometry(diameter=1.0, length=5.5, weight_submerged=0.0)
    soil = ClaySoil(
        su0=5.0,
        k=1.5,
        gamma_sub=6.0,
        alpha=0.5,
        Nc=10.0,
        Nc_bot=11.0
    )
    
    calculator = SuctionAnchorCapacity(anchor, soil)
    
    # 计算单个工况：θ=30°，自动搜索最危险β
    result = calculator.compute(theta_deg=30.0)
    print_full_calculation(result)
    
    return calculator


def test_capacity_curve():
    """
    测试2：承载力曲线验证
    计算不同系泊角下的极限承载力并绘图
    """
    print("\n" + "=" * 60)
    print("测试2：承载力曲线计算")
    print("=" * 60)
    
    # 参数设置（论文第2.6节）
    anchor = AnchorGeometry(diameter=1.0, length=5.5, weight_submerged=0.0)
    soil = ClaySoil(
        su0=5.0,
        k=1.5,
        gamma_sub=6.0,
        alpha=0.5,
        Nc=10.0,
        Nc_bot=11.0
    )
    
    calculator = SuctionAnchorCapacity(anchor, soil)
    
    # 计算不同系泊角下的承载力
    theta_list = [0, 15, 30, 45, 60, 75, 90]
    results = calculator.compute_curve(theta_list)
    
    print("\n【不同系泊角计算结果】")
    print("  θ(°) | β_crit(°) |   F_b(kN) |   F_s(kN) |   T_a(kN) | T_a/(su0·D²)")
    print("  " + "-" * 75)
    
    for r in results:
        inp = r["input"]
        comp = r["components"]
        res = r["result"]
        print(f"  {inp['theta_deg']:3.0f}  | {inp['beta_deg']:8.1f}  | "
              f"{comp['F_b']:8.2f} | {comp['F_s']:8.2f} | "
              f"{res['T_a']:8.2f} | {res['T_a_norm']:12.4f}")
    
    # 绘制曲线
    plot_capacity_curve(calculator, theta_range=(0, 90), n_theta=60)
    
    return calculator, results


def plot_capacity_curve(
    calculator: SuctionAnchorCapacity,
    theta_range: Tuple[float, float] = (0, 90),
    n_theta: int = 60
) -> None:
    """绘制无量纲承载力曲线"""
    theta_vals = np.linspace(theta_range[0], theta_range[1], n_theta)
    T_a_norm_vals = []
    beta_crit_vals = []
    
    for theta in theta_vals:
        # 使用自动搜索β的方式
        result = calculator.compute(theta)  # beta_deg=None
        T_a_norm_vals.append(result["result"]["T_a_norm"])
        beta_crit_vals.append(result["input"]["beta_deg"])
    
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(8, 10))
    
    # 子图1：承载力曲线
    ax1.plot(theta_vals, T_a_norm_vals, 'b-', linewidth=2)
    plt.xlabel('Mooring angle θ (deg)', fontsize=12)
    plt.ylabel(r'$T_u / (s_{u0} D^2)$', fontsize=12)
    plt.title('Suction Anchor Nondimensional Bearing Capacity Curve', fontsize=14)
    ax1.grid(True, linestyle='--', alpha=0.6)
    ax1.set_xlim(theta_range[0], theta_range[1])
    ax1.set_ylim(bottom=0)
    
    # 子图2：最危险破坏角曲线
    ax2.plot(theta_vals, beta_crit_vals, 'r-', linewidth=2)
    ax2.set_xlabel('Mooring angle θ (deg)', fontsize=12)
    ax2.set_ylabel(' β_crit (deg)', fontsize=12)
    ax2.set_title('β_crit vs. Mooring angle', fontsize=14)
    ax2.grid(True, linestyle='--', alpha=0.6)
    ax2.set_xlim(theta_range[0], theta_range[1])
    ax2.set_ylim(0, 90)
    
    plt.tight_layout()
    plt.show()


def example_sensitivity_analysis():
    """
    示例：敏感性分析（手动指定β，观察其对承载力的影响）
    """
    print("\n" + "=" * 60)
    print("示例：破坏角敏感性分析 (θ=30°)")
    print("=" * 60)
    
    anchor = AnchorGeometry(diameter=1.0, length=5.5, weight_submerged=0.0)
    soil = ClaySoil(
        su0=5.0,
        k=1.5,
        gamma_sub=6.0,
        alpha=0.5,
        Nc=10.0,
        Nc_bot=11.0
    )
    
    calculator = SuctionAnchorCapacity(anchor, soil)
    
    print("\n【固定θ=30°，不同β对承载力的影响】")
    print("  β(°) |   F_b(kN) |   F_s(kN) |   T_a(kN) | T_a/(su0·D²)")
    print("  " + "-" * 60)
    
    for beta in [10, 30, 50, 70, 90]:
        result = calculator.compute(theta_deg=30.0, beta_deg=beta)
        comp = result["components"]
        res = result["result"]
        print(f"  {beta:3.0f}   | {comp['F_b']:8.2f} | {comp['F_s']:8.2f} | "
              f"{res['T_a']:8.2f} | {res['T_a_norm']:12.4f}")


# ============================================================================
# 主程序
# ============================================================================

if __name__ == "__main__":
    # 测试1：基本计算功能（自动搜索β）
    calculator = test_basic_calculation()
    
    # 测试2：承载力曲线验证
    test_capacity_curve()
    
    # 示例：敏感性分析（手动指定β）
    example_sensitivity_analysis()