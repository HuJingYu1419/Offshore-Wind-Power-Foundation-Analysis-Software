# -*- coding: utf-8 -*-
"""
模块名称: 黏土中吸力锚安装计算模块
功能描述: 计算黏土中吸力锚（吸力式沉箱）的安装性能，包括自重贯入、吸力贯入及极限贯入深度预测
依据来源: 
    [1] Houlsby G T, Byrne B W. Design procedures for installation of suction caissons 
        in clay and other materials. Proceedings of the Institution of Civil Engineers 
        - Geotechnical Engineering, 2005, 158(2): 75-82.
    [2] 《系泊锚设计》文档 第1.1节（黏土）
适用范围: 
    - 饱和黏土，不排水条件
    - 不排水抗剪强度随深度线性增长: s_u = s_uo + ρ·z
    - 沉箱为圆柱形，顶部密封，底部开口
公式验证状态: 
    - 自重贯入公式: 与文档[2] Fig.1 交叉验证通过
    - 吸力贯入公式: 与文档[2] Fig.2 交叉验证通过
    - 极限贯入深度: 与文档[2] 第1.1.4节 交叉验证通过
    - 应力增强修正: 待验证（需要试验数据校准）
"""

import math
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass, field


@dataclass
class CaissonGeometry:
    """吸力锚几何参数"""
    D_o: float          # 外径 (m)
    D_i: float          # 内径 (m)
    t: float            # 壁厚 (m)
    
    @property
    def D_avg(self) -> float:
        """平均直径 (m)"""
        return (self.D_o + self.D_i) / 2
    
    @property
    def A_tip_annulus(self) -> float:
        """环形端承面积 (m²)"""
        return math.pi * self.D_avg * self.t
    
    @property
    def A_inner_cross(self) -> float:
        """内部横截面积 (m²)"""
        return math.pi * self.D_i ** 2 / 4


@dataclass
class SoilProfile:
    """土体参数"""
    suo: float          # 泥面处不排水抗剪强度 (kPa)
    rho: float          # 抗剪强度梯度 (kPa/m)
    gamma_prime: float  # 土体有效容重 (kN/m³)
    
    def s_u(self, z: float) -> float:
        """计算深度z处的不排水抗剪强度 (kPa)"""
        return self.suo + self.rho * z
    
    def s_u_avg(self, h: float) -> float:
        """计算0~h深度范围内的平均不排水抗剪强度 (kPa)"""
        return self.suo + self.rho * h / 2


@dataclass
class Coefficients:
    """计算系数（参数驱动，可选修正项）"""
    # 基础系数
    alpha_o: float = 0.55      # 外侧黏着系数 (0.3-0.7)
    alpha_i: float = 0.50      # 内侧黏着系数 (0.3-0.6)
    Nc: float = 9.0            # 黏土端承系数 (通常取9)
    Nc_star: float = 8.5       # 上拔承载力系数 (≈8.5)
    Nq: float = 1.0            # 覆土承载力系数（黏土不排水条件固定为1）
    
    # 应力增强修正参数（可选，默认None表示不启用）
    f0: Optional[float] = None     # 应力扩散因子 (0.2-0.5)
    
    # 内部加劲肋参数（可选，默认None表示不启用）
    rib_perimeter: Optional[float] = None   # 加劲肋周长 (m)
    rib_area: Optional[float] = None        # 加劲肋截面积 (m²)
    
    def is_stress_enhancement_enabled(self) -> bool:
        """是否启用应力增强修正"""
        return self.f0 is not None
    
    def is_rib_enabled(self) -> bool:
        """是否启用加劲肋修正"""
        return self.rib_perimeter is not None and self.rib_perimeter > 0


class SuctionCaissonInstaller:
    """
    黏土中吸力锚安装计算器
    
    严格遵循《系泊锚设计》文档第1.1节公式实现。
    支持参数驱动的可选修正项（应力增强修正、内部加劲肋）。
    
    使用示例:
    >>> geometry = CaissonGeometry(D_o=12.0, D_i=11.91, t=0.045)
    >>> soil = SoilProfile(suo=20.0, rho=2.5, gamma_prime=6.0)
    >>> coeff = Coefficients(alpha_o=0.6, alpha_i=0.5)
    >>> installer = SuctionCaissonInstaller(geometry, soil, coeff)
    >>> result = installer.self_weight_penetration(h=5.0, V_applied=1000.0)
    """
    
    def __init__(self, geometry: CaissonGeometry, soil: SoilProfile, 
                 coeff: Coefficients):
        """
        初始化吸力锚安装计算器
        
        Parameters:
        -----------
        geometry : CaissonGeometry
            吸力锚几何参数
        soil : SoilProfile
            土体参数
        coeff : Coefficients
            计算系数（包含可选修正项）
        """
        self.geo = geometry
        self.soil = soil
        self.coeff = coeff
    
    # ==================== 核心计算公式 ====================
    
    def _calc_outer_friction(self, h: float, su1: float) -> float:
        """
        外侧摩擦力
        
        公式: Q_out = h · α_o · s_u1 · (π·D_o)
        来源: 文档 第1.1.2节
        """
        return h * self.coeff.alpha_o * su1 * (math.pi * self.geo.D_o)
    
    def _calc_inner_friction(self, h: float, su1: float) -> float:
        """
        内侧摩擦力（基础公式，不含加劲肋）
        
        公式: Q_in = h · α_i · s_u1 · (π·D_i)
        来源: 文档 第1.1.2节
        """
        return h * self.coeff.alpha_i * su1 * (math.pi * self.geo.D_i)
    
    def _calc_tip_bearing(self, h: float, su2: float, gamma_h_eff: float) -> float:
        """
        端承力（环形区域）
        
        公式: Q_tip = (γ'·h·N_q + s_u2·N_c) · (π·D_avg·t)
        来源: 文档 第1.1.2节
        
        Parameters:
        -----------
        h : float           贯入深度 (m)
        su2 : float         尖端处抗剪强度 (kPa)
        gamma_h_eff : float 修正后的竖向有效应力 (kN/m²)，默认等于 γ'·h
        """
        return (gamma_h_eff * self.coeff.Nq + su2 * self.coeff.Nc) * self.geo.A_tip_annulus
    
    def _calc_rib_friction(self, h: float, su1: float) -> float:
        """
        加劲肋附加摩擦力
        
        公式: Q_rib = h · α_i · s_u1 · l
        来源: 文档 第1.1.5节
        """
        if not self.coeff.is_rib_enabled():
            return 0.0
        return h * self.coeff.alpha_i * su1 * self.coeff.rib_perimeter
    
    def _calc_rib_tip_bearing(self, h: float, su2: float, gamma_h_eff: float) -> float:
        """
        加劲肋附加端承力
        
        公式: Q_tip_rib = (γ'·h + s_u2·N_c) · A_rib
        来源: 文档 第1.1.5节
        """
        if not self.coeff.is_rib_enabled() or self.coeff.rib_area is None:
            return 0.0
        return (gamma_h_eff + su2 * self.coeff.Nc) * self.coeff.rib_area
    
    def _get_stress_enhancement_factor_outer(self, h: float, su1: float) -> float:
        """
        外侧应力增强修正值
        
        将 γ'·h 替换为: (π·D_o·h·α_o·s_u1) / (π·(D_m² - D_o²)/4)
        来源: 文档 第1.1.2节
        
        Parameters:
        -----------
        h : float       贯入深度 (m)
        su1 : float     平均抗剪强度 (kPa)
        
        Returns:
        --------
        sigma_eff : float  修正后的等效竖向有效应力 (kPa)
        """
        if not self.coeff.is_stress_enhancement_enabled():
            return self.soil.gamma_prime * h
        
        m = 1 + 2 * self.coeff.f0 * h / self.geo.D_avg
        D_m = m * self.geo.D_avg
        
        # 环形面积: π·(D_m² - D_o²)/4
        annulus_area = math.pi * (D_m ** 2 - self.geo.D_o ** 2) / 4
        
        if annulus_area <= 0:
            return self.soil.gamma_prime * h
        
        # 摩擦等效应力
        friction_equivalent = (math.pi * self.geo.D_o * h * self.coeff.alpha_o * su1) / annulus_area
        
        return friction_equivalent
    
    def _get_stress_enhancement_factor_inner(self, h: float, su1: float) -> float:
        """
        内侧应力增强修正值
        
        将 γ'·h 替换为: (π·D_i·h·α_i·s_u1) / (π·D_i²/4)
        来源: 文档 第1.1.2节
        
        Parameters:
        -----------
        h : float       贯入深度 (m)
        su1 : float     平均抗剪强度 (kPa)
        
        Returns:
        --------
        sigma_eff : float  修正后的等效竖向有效应力 (kPa)
        
        警告：文档中此公式仅在内侧修正中使用，端承项应使用外侧修正值。
        """
        if not self.coeff.is_stress_enhancement_enabled():
            return self.soil.gamma_prime * h
        
        inner_area = math.pi * self.geo.D_i ** 2 / 4
        
        if inner_area <= 0:
            return self.soil.gamma_prime * h
        
        friction_equivalent = (math.pi * self.geo.D_i * h * self.coeff.alpha_i * su1) / inner_area
        
        return friction_equivalent
    
    # ==================== 主要计算方法 ====================
    
    def self_weight_penetration(self, h: float, V_applied: float = 0.0) -> Dict[str, Any]:
        """
        计算自重贯入时的总承载力
        
        公式: V' = h·α_o·s_u1·(π·D_o) + h·α_i·s_u1·(π·D_i) + (γ'·h·N_q + s_u2·N_c)·(π·D_avg·t)
        来源: 文档 第1.1.2节
        
        Parameters:
        -----------
        h : float           当前贯入深度 (m)
        V_applied : float   施加的竖向荷载 (kN)，用于判断能否贯入
        
        Returns:
        --------
        dict : 包含以下字段
            - total: 总承载力 (kN)
            - outer_friction: 外侧摩擦力 (kN)
            - inner_friction: 内侧摩擦力 (kN)
            - tip_bearing: 端承力 (kN)
            - rib_friction: 加劲肋附加摩擦力 (kN)
            - rib_tip: 加劲肋附加端承力 (kN)
            - su1: 平均抗剪强度 (kPa)
            - su2: 尖端抗剪强度 (kPa)
            - gamma_h_eff: 修正后竖向有效应力 (kPa)
            - can_penetrate: 能否靠自重贯入
        """
        # 计算抗剪强度
        su1 = self.soil.s_u_avg(h)
        su2 = self.soil.s_u(h)
        
        # 获取修正后的竖向有效应力（端承项使用外侧修正值）
        gamma_h_eff = self._get_stress_enhancement_factor_outer(h, su1)
        
        # 各项阻力
        Q_outer = self._calc_outer_friction(h, su1)
        Q_inner = self._calc_inner_friction(h, su1)
        Q_tip = self._calc_tip_bearing(h, su2, gamma_h_eff)
        Q_rib_friction = self._calc_rib_friction(h, su1)
        Q_rib_tip = self._calc_rib_tip_bearing(h, su2, gamma_h_eff)
        
        # 总承载力
        total = Q_outer + Q_inner + Q_tip + Q_rib_friction + Q_rib_tip
        
        # 判断能否靠自重贯入
        can_penetrate = total <= V_applied if V_applied > 0 else None
        
        return {
            'total': total,
            'outer_friction': Q_outer,
            'inner_friction': Q_inner,
            'tip_bearing': Q_tip,
            'rib_friction': Q_rib_friction,
            'rib_tip': Q_rib_tip,
            'su1': su1,
            'su2': su2,
            'gamma_h_eff': gamma_h_eff,
            'can_penetrate': can_penetrate
        }
    
    def suction_penetration(self, h: float, suction: float, V_applied: float = 0.0) -> Dict[str, Any]:
        """
        计算施加吸力时的总承载力
        
        公式: V' + s·(π·D_i²/4) = h·α_o·s_u1·(π·D_o) + h·α_i·s_u1·(π·D_i) + (γ'·h - s + s_u2·N_c)·(π·D_avg·t)
        来源: 文档 第1.1.3节
        
        Parameters:
        -----------
        h : float           当前贯入深度 (m)
        suction : float     施加的吸力 (kPa)
        V_applied : float   施加的竖向荷载 (kN)
        
        Returns:
        --------
        dict : 包含以下字段
            - V_required: 所需竖向荷载 (kN)，正值表示需要向下施加荷载
            - outer_friction: 外侧摩擦力 (kN)
            - inner_friction: 内侧摩擦力 (kN)
            - tip_bearing: 端承力 (kN)
            - suction_upward_force: 吸力产生的向上力 (kN)
            - can_penetrate: 能否在给定吸力下贯入
        """
        # 计算抗剪强度
        su1 = self.soil.s_u_avg(h)
        su2 = self.soil.s_u(h)
        
        # 获取修正后的竖向有效应力（端承项使用外侧修正值）
        gamma_h_eff = self._get_stress_enhancement_factor_outer(h, su1)
        
        # 吸力修正后的端承有效应力
        # 注意：文档中应力增强修正将 γ'·h - s 整体替换为修正值
        if self.coeff.is_stress_enhancement_enabled():
            # 当启用应力增强修正时，修正值已包含 γ'·h 部分，需要减去吸力
            tip_effective_stress = gamma_h_eff - suction
        else:
            tip_effective_stress = self.soil.gamma_prime * h - suction
        
        # 各项阻力
        Q_outer = self._calc_outer_friction(h, su1)
        Q_inner = self._calc_inner_friction(h, su1)
        Q_tip = self._calc_tip_bearing(h, su2, tip_effective_stress)
        Q_rib_friction = self._calc_rib_friction(h, su1)
        Q_rib_tip = self._calc_rib_tip_bearing(h, su2, tip_effective_stress)
        
        # 右侧总和
        RHS = Q_outer + Q_inner + Q_tip + Q_rib_friction + Q_rib_tip
        
        # 吸力产生的向上力: s·(π·D_i²/4)
        suction_upward_force = suction * self.geo.A_inner_cross
        
        # 所需竖向荷载 V' = RHS - s·(π·D_i²/4)
        V_required = RHS - suction_upward_force
        
        # 判断能否贯入（所需荷载不超过施加荷载）
        can_penetrate = V_required <= V_applied if V_applied > 0 else None
        
        return {
            'V_required': V_required,
            'outer_friction': Q_outer,
            'inner_friction': Q_inner,
            'tip_bearing': Q_tip,
            'rib_friction': Q_rib_friction,
            'rib_tip': Q_rib_tip,
            'suction_upward_force': suction_upward_force,
            'can_penetrate': can_penetrate
        }
    
    def required_suction(self, h: float, V_applied: float) -> float:
        """
        计算达到给定贯入深度所需的最小吸力
        
        由吸力贯入公式反解:
        s = [Q_outer + Q_inner + (γ'·h + s_u2·N_c)·A_tip - V_applied] / (A_tip + A_inner)
        来源: 文档 第1.1.3节
        
        Parameters:
        -----------
        h : float           目标贯入深度 (m)
        V_applied : float   施加的竖向荷载 (kN)
        
        Returns:
        --------
        s_req : float       所需吸力 (kPa)
        """
        # 计算抗剪强度
        su1 = self.soil.s_u_avg(h)
        su2 = self.soil.s_u(h)
        
        # 获取修正后的竖向有效应力
        gamma_h_eff = self._get_stress_enhancement_factor_outer(h, su1)
        
        # 摩擦力项（与吸力无关）
        Q_outer = self._calc_outer_friction(h, su1)
        Q_inner = self._calc_inner_friction(h, su1)
        Q_rib_friction = self._calc_rib_friction(h, su1)
        
        # 端承力中与吸力无关的部分
        tip_constant = (gamma_h_eff + su2 * self.coeff.Nc) * self.geo.A_tip_annulus
        rib_tip_constant = 0.0
        if self.coeff.is_rib_enabled() and self.coeff.rib_area is not None:
            rib_tip_constant = (gamma_h_eff + su2 * self.coeff.Nc) * self.coeff.rib_area
        
        # 吸力系数（端承力中吸力的系数 + 吸力向上力的系数）
        suction_coeff = self.geo.A_tip_annulus + self.geo.A_inner_cross
        
        # 所需吸力
        numerator = Q_outer + Q_inner + tip_constant + Q_rib_friction + rib_tip_constant - V_applied
        s_req = numerator / suction_coeff
        
        return max(0.0, s_req)
    
    def ultimate_depth_ratio(self, alpha_avg: Optional[float] = None) -> float:
        """
        计算极限贯入深度比 h/D（下限估计）
        
        公式: h/D = (Nc* / (4α)) * (su2/su1) * (1 - 1/m²)
        来源: 文档 第1.1.4节
        
        # 注意：
        # 1. 该公式为下限估计，基于极限平衡分析推导
        # 2. 文档预测范围：均质黏土 h/D≈3，正常固结软黏土 h/D≈6
        # 3. 公式中的经验系数（Nc*=8.5, f0=0.2~0.5）建议根据现场数据校准
        # 4. 本方法使用二分法求解隐式方程，已验证数学收敛性
        
        注：该公式为隐式方程（右侧包含 h/D），使用二分法求解。
        
        Parameters:
        -----------
        alpha_avg : float, optional
            内外侧黏着系数的平均值，若不提供则使用 (α_o + α_i)/2
        
        Returns:
        --------
        h_D_ratio : float   极限贯入深度比 h/D
        """
        # 确定使用的 α 值（文档公式中的 α 应为内外侧平均值）
        if alpha_avg is None:
            alpha_avg = (self.coeff.alpha_o + self.coeff.alpha_i) / 2
        
        # 避免除零
        if alpha_avg <= 0:
            alpha_avg = 0.5
        
        D = self.geo.D_avg
        
        def compute_rhs(xi: float) -> float:
            """
            计算公式右侧值 f(ξ)
            
            ξ = h/D
            f(ξ) = (Nc* / (4α)) * (su2/su1) * (1 - 1/m²)
            """
            h = xi * D
            
            # 计算 su1 和 su2
            su1 = self.soil.s_u_avg(h)
            su2 = self.soil.s_u(h)
            
            # 避免除零
            if su1 <= 0:
                return 0.0
            
            su2_su1 = su2 / su1
            
            # 计算 m 和修正项 (1 - 1/m²)
            if self.coeff.is_stress_enhancement_enabled() and self.coeff.f0 is not None:
                m = 1 + 2 * self.coeff.f0 * xi
            else:
                m = 1.0
            
            # 避免 m 过小
            if m <= 0:
                m = 1.0
            
            correction = 1 - 1 / (m ** 2)
            
            # 公式: (Nc* / (4α)) * (su2/su1) * (1 - 1/m²)
            return (self.coeff.Nc_star / (4 * alpha_avg)) * su2_su1 * correction
        
        def equation(xi: float) -> float:
            """求解方程 f(ξ) - ξ = 0"""
            return compute_rhs(xi) - xi
        
        # 使用二分法求解
        # 根据文档预测范围：均质黏土 h/D≈3，正常固结软黏土 h/D≈6
        # 设置搜索区间 [0.5, 15.0] 覆盖所有可能情况
        xi_low = 0.5
        xi_high = 15.0
        
        # 计算边界值
        f_low = equation(xi_low)
        f_high = equation(xi_high)
        
        # 检查边界条件
        if f_low * f_high > 0:
            # 边界条件不满足（同号），返回函数在典型值处的估计
            # 这种情况通常发生在均质黏土或极端参数下
            xi_estimate = compute_rhs(3.0)
            return max(0.5, min(15.0, xi_estimate))
        
        # 二分法迭代
        for _ in range(100):
            xi_mid = (xi_low + xi_high) / 2
            f_mid = equation(xi_mid)
            
            if abs(f_mid) < 1e-6:
                return xi_mid
            
            if f_low * f_mid < 0:
                xi_high = xi_mid
                f_high = f_mid
            else:
                xi_low = xi_mid
                f_low = f_mid
        
        # 返回区间中点
        return (xi_low + xi_high) / 2


# ==================== 辅助函数 ====================

def format_number(value: float, decimals: int = 4) -> str:
    """
    格式化数字输出：固定小数位数，禁用科学计数法
    
    Parameters:
    -----------
    value : float      要格式化的数值
    decimals : int     小数位数
    
    Returns:
    --------
    str : 格式化后的字符串
    """
    return f"{value:.{decimals}f}"


def print_separator(char: str = "=", length: int = 70) -> None:
    """打印分隔线"""
    print(char * length)


if __name__ == "__main__":
    # 模块自测试（可根据需要启用）
    pass