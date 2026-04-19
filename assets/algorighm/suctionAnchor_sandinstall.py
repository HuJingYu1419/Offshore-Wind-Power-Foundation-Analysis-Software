# -*- coding: utf-8 -*-
"""
模块名称: 砂土中吸力锚安装计算模块
功能描述: 计算砂土中吸力锚（吸力式沉箱）的安装性能
依据来源: 
    [1] Houlsby G T, Byrne B W. Design procedures for installation of suction caissons in sand.
        Proceedings of the Institution of Civil Engineers: Geotechnical Engineering, 2005, 158(3): 135-144.
    [2] 《系泊锚设计》文档 第1.2节（砂土）
    [3] Meyerhof, G. G. (1963). Some recent research on the bearing capacity of foundations.

公式模式:
    - 'exact': 完整指数积分形式（严格遵循文档）
    - 'simplified': 简化均匀应力分布形式（用于与文档案例验证）

限制处理:
    - 内部液化/管涌: 由内侧有效应力 σ'_vi ≤ 0 判断（硬性极限，超出则警告）
    - 简化公式 h = D/(2·Ktanδ): 仅作为参考值，不参与可行性判断
    - 反向承载力: 吸力限制（降低吸力可避免），仅警告
"""

import math
from typing import Optional, Dict, Any, Literal
from dataclasses import dataclass


@dataclass
class CaissonGeometrySand:
    """吸力锚几何参数"""
    D_o: float          # 外径 (m)
    D_i: float          # 内径 (m)
    t: float            # 壁厚 (m)
    
    @property
    def D_avg(self) -> float:
        return (self.D_o + self.D_i) / 2
    
    @property
    def A_tip_annulus(self) -> float:
        """环形端承面积 (m²)"""
        return math.pi * self.D_avg * self.t
    
    @property
    def A_inner_cross(self) -> float:
        """内部横截面积 (m²)"""
        return math.pi * self.D_i ** 2 / 4
    
    @property
    def perimeter_outer(self) -> float:
        """外侧周长 (m)"""
        return math.pi * self.D_o
    
    @property
    def perimeter_inner(self) -> float:
        """内侧周长 (m)"""
        return math.pi * self.D_i


@dataclass
class SoilProfileSand:
    """砂土参数"""
    gamma_prime: float      # 土体有效容重 (kN/m³)
    phi: float              # 有效内摩擦角 (度)
    
    def calc_Nq(self) -> float:
        """
        Meyerhof (1963) 承载力系数 Nq
        
        公式: Nq = e^(π·tanφ) · tan²(45° + φ/2)
        """
        rad = math.radians(self.phi)
        return math.exp(math.pi * math.tan(rad)) * (math.tan(math.radians(45 + self.phi / 2)) ** 2)
    
    def calc_Ngamma(self) -> float:
        """
        Meyerhof (1963) 承载力系数 Nγ
        
        公式: Nγ = 2(Nq + 1) tanφ
        """
        return 2 * (self.calc_Nq() + 1) * math.tan(math.radians(self.phi))


@dataclass
class CoefficientsSand:
    """砂土计算系数"""
    Ktan_delta_o: float = 0.48      # 外侧摩擦综合系数 (0.45-0.8)
    Ktan_delta_i: float = 0.48      # 内侧摩擦综合系数 (0.45-0.8)
    a: float = 0.3                  # 孔隙水压分配系数 (0.2-0.45)
    formula_mode: Literal['exact', 'simplified'] = 'exact'  # 公式模式
    
    # 加劲肋参数（可选）
    rib_perimeter: Optional[float] = None
    rib_Ktan_delta_s: Optional[float] = None
    rib_area: Optional[float] = None
    
    @property
    def is_rib_enabled(self) -> bool:
        return self.rib_perimeter is not None and self.rib_perimeter > 0


class SuctionCaissonInstallerSand:
    """砂土中吸力锚安装计算器"""
    
    # 吸力上限（kPa），超过此值发出警告
    MAX_SUCTION_WARNING = 100.0
    
    def __init__(self, geometry: CaissonGeometrySand, soil: SoilProfileSand, coeff: CoefficientsSand):
        self.geo = geometry
        self.soil = soil
        self.coeff = coeff
        
        # 特征深度（仅指数积分模式使用）
        self.Z_o = self.geo.D_o / (4 * coeff.Ktan_delta_o) if coeff.Ktan_delta_o > 0 else float('inf')
        self.Z_i = self.geo.D_i / (4 * coeff.Ktan_delta_i) if coeff.Ktan_delta_i > 0 else float('inf')
        
        # 加劲肋修正特征深度
        if coeff.is_rib_enabled:
            denom = 4 * (math.pi * self.geo.D_i * coeff.Ktan_delta_i + 
                         coeff.rib_perimeter * coeff.rib_Ktan_delta_s)
            self.Z_i = math.pi * self.geo.D_i ** 2 / denom if denom > 0 else self.Z_i
    
    # ==================== 辅助函数 ====================
    
    def _sigma_outer_coeff(self, h: float, s: float = 0.0) -> float:
        """外侧等效有效应力系数"""
        if s > 0 and h > 0:
            return self.soil.gamma_prime + (self.coeff.a * s / h)
        return self.soil.gamma_prime
    
    def _sigma_inner_coeff(self, h: float, s: float = 0.0) -> float:
        """内侧等效有效应力系数"""
        if s <= 0 or h <= 0:
            return self.soil.gamma_prime
        return max(0.0, self.soil.gamma_prime - (1 - self.coeff.a) * s / h)
    
    def _sigma_outer(self, h: float, s: float = 0.0) -> float:
        """外侧竖向有效应力 σ'_vo (kPa)"""
        if self.coeff.formula_mode == 'simplified':
            return self._sigma_outer_coeff(h, s) * h
        else:
            return self._sigma_outer_coeff(h, s) * self._exp_int_2(h, self.Z_o)
    
    def _sigma_inner(self, h: float, s: float = 0.0) -> float:
        """内侧竖向有效应力 σ'_vi (kPa)"""
        if self.coeff.formula_mode == 'simplified':
            return self._sigma_inner_coeff(h, s) * h
        else:
            return self._sigma_inner_coeff(h, s) * self._exp_int_2(h, self.Z_i)
    
    # ==================== 指数积分模式 (exact) ====================
    
    def _exp_int_1(self, h: float, Z: float) -> float:
        """Z²[exp(h/Z) - 1 - h/Z]"""
        if Z <= 0 or Z == float('inf') or h <= 0:
            return 0.0
        r = h / Z
        return Z ** 2 * (math.exp(r) - 1 - r)
    
    def _exp_int_2(self, h: float, Z: float) -> float:
        """Z[exp(h/Z) - 1]"""
        if Z <= 0 or Z == float('inf') or h <= 0:
            return 0.0
        r = h / Z
        return Z * (math.exp(r) - 1)
    
    def _self_weight_exact(self, h: float) -> Dict[str, float]:
        """自重贯入 - 指数积分模式"""
        Nq = self.soil.calc_Nq()
        Ngamma = self.soil.calc_Ngamma()
        
        integral_o = self._exp_int_1(h, self.Z_o)
        outer = (self.soil.gamma_prime * integral_o * 
                 self.coeff.Ktan_delta_o * self.geo.perimeter_outer)
        
        integral_i = self._exp_int_1(h, self.Z_i)
        inner = (self.soil.gamma_prime * integral_i * 
                 self.coeff.Ktan_delta_i * self.geo.perimeter_inner)
        
        sigma_cnd = (self.soil.gamma_prime * self._exp_int_2(h, self.Z_i) * Nq +
                     self.soil.gamma_prime * (self.geo.t / 2) * Ngamma)
        tip = sigma_cnd * self.geo.A_tip_annulus
        
        rib_friction = 0.0
        rib_tip = 0.0
        if self.coeff.is_rib_enabled:
            rib_friction = (self.soil.gamma_prime * integral_i *
                           self.coeff.rib_Ktan_delta_s * self.coeff.rib_perimeter)
            if self.coeff.rib_area is not None:
                rib_tip = sigma_cnd * self.coeff.rib_area
        
        return {
            'outer': outer,
            'inner': inner,
            'tip': tip,
            'rib_friction': rib_friction,
            'rib_tip': rib_tip,
            'total': outer + inner + tip + rib_friction + rib_tip
        }
    
    def _suction_exact(self, h: float, s: float) -> Dict[str, float]:
        """吸力贯入 - 指数积分模式"""
        Nq = self.soil.calc_Nq()
        Ngamma = self.soil.calc_Ngamma()
        
        sigma_o = self._sigma_outer_coeff(h, s)
        sigma_i = self._sigma_inner_coeff(h, s)
        
        integral_o = self._exp_int_1(h, self.Z_o)
        outer = (sigma_o * integral_o * 
                 self.coeff.Ktan_delta_o * self.geo.perimeter_outer)
        
        integral_i = self._exp_int_1(h, self.Z_i)
        inner = (sigma_i * integral_i * 
                 self.coeff.Ktan_delta_i * self.geo.perimeter_inner)
        
        sigma_cnd = (sigma_i * self._exp_int_2(h, self.Z_i) * Nq +
                     self.soil.gamma_prime * self.geo.t * Ngamma)
        tip = sigma_cnd * self.geo.A_tip_annulus
        
        rib_friction = 0.0
        rib_tip = 0.0
        if self.coeff.is_rib_enabled:
            rib_friction = (sigma_i * integral_i *
                           self.coeff.rib_Ktan_delta_s * self.coeff.rib_perimeter)
            if self.coeff.rib_area is not None:
                rib_tip = sigma_cnd * self.coeff.rib_area
        
        return {
            'outer': outer,
            'inner': inner,
            'tip': tip,
            'rib_friction': rib_friction,
            'rib_tip': rib_tip,
            'total': outer + inner + tip + rib_friction + rib_tip
        }
    
    # ==================== 简化模式 (simplified) ====================
    
    def _self_weight_simplified(self, h: float) -> Dict[str, float]:
        """自重贯入 - 简化均匀应力分布模式"""
        Nq = self.soil.calc_Nq()
        Ngamma = self.soil.calc_Ngamma()
        
        outer = (self.soil.gamma_prime * h * 
                 self.coeff.Ktan_delta_o * self.geo.perimeter_outer * h)
        
        inner = (self.soil.gamma_prime * h * 
                 self.coeff.Ktan_delta_i * self.geo.perimeter_inner * h)
        
        sigma_cnd = self.soil.gamma_prime * h * Nq + self.soil.gamma_prime * self.geo.t * Ngamma
        tip = sigma_cnd * self.geo.A_tip_annulus
        
        rib_friction = 0.0
        rib_tip = 0.0
        if self.coeff.is_rib_enabled:
            rib_friction = (self.soil.gamma_prime * h * 
                           self.coeff.rib_Ktan_delta_s * self.coeff.rib_perimeter * h)
            if self.coeff.rib_area is not None:
                rib_tip = sigma_cnd * self.coeff.rib_area
        
        return {
            'outer': outer,
            'inner': inner,
            'tip': tip,
            'rib_friction': rib_friction,
            'rib_tip': rib_tip,
            'total': outer + inner + tip + rib_friction + rib_tip
        }
    
    def _suction_simplified(self, h: float, s: float) -> Dict[str, float]:
        """吸力贯入 - 简化均匀应力分布模式"""
        Nq = self.soil.calc_Nq()
        Ngamma = self.soil.calc_Ngamma()
        
        sigma_o = self._sigma_outer_coeff(h, s)
        sigma_i = self._sigma_inner_coeff(h, s)
        
        outer = (sigma_o * h * 
                 self.coeff.Ktan_delta_o * self.geo.perimeter_outer * h)
        
        inner = (sigma_i * h * 
                 self.coeff.Ktan_delta_i * self.geo.perimeter_inner * h)
        
        sigma_cnd = sigma_i * h * Nq + self.soil.gamma_prime * self.geo.t * Ngamma
        tip = sigma_cnd * self.geo.A_tip_annulus
        
        rib_friction = 0.0
        rib_tip = 0.0
        if self.coeff.is_rib_enabled:
            rib_friction = (sigma_i * h * 
                           self.coeff.rib_Ktan_delta_s * self.coeff.rib_perimeter * h)
            if self.coeff.rib_area is not None:
                rib_tip = sigma_cnd * self.coeff.rib_area
        
        return {
            'outer': outer,
            'inner': inner,
            'tip': tip,
            'rib_friction': rib_friction,
            'rib_tip': rib_tip,
            'total': outer + inner + tip + rib_friction + rib_tip
        }
    
    # ==================== 统一接口 ====================
    
    def self_weight_penetration(self, h: float) -> Dict[str, Any]:
        """自重贯入计算"""
        if self.coeff.formula_mode == 'simplified':
            res = self._self_weight_simplified(h)
        else:
            res = self._self_weight_exact(h)
        
        return {
            'total': res['total'],
            'outer_friction': res['outer'],
            'inner_friction': res['inner'],
            'tip_bearing': res['tip'],
            'rib_friction': res['rib_friction'],
            'rib_tip': res['rib_tip'],
            'mode': self.coeff.formula_mode
        }
    
    def suction_penetration(self, h: float, s: float) -> Dict[str, Any]:
        """吸力贯入计算"""
        if self.coeff.formula_mode == 'simplified':
            res = self._suction_simplified(h, s)
        else:
            res = self._suction_exact(h, s)
        
        suction_upward_force = s * self.geo.A_inner_cross
        V_required = res['total'] - suction_upward_force
        
        return {
            'V_required': V_required,
            'outer_friction': res['outer'],
            'inner_friction': res['inner'],
            'tip_bearing': res['tip'],
            'suction_upward_force': suction_upward_force,
            'rib_friction': res['rib_friction'],
            'rib_tip': res['rib_tip'],
            'mode': self.coeff.formula_mode
        }
    
    def required_suction(self, h: float, V_applied: float) -> float:
        """计算达到给定贯入深度所需的最小吸力（二分法求解）"""
        def compute(s: float) -> float:
            return self.suction_penetration(h, s)['V_required']
        
        if compute(0.0) <= V_applied:
            return 0.0
        
        s_high = 100.0
        while compute(s_high) > V_applied and s_high < 500:
            s_high *= 2
        
        if compute(s_high) > V_applied:
            return s_high
        
        s_low, s_high = 0.0, s_high
        
        for _ in range(100):
            s_mid = (s_low + s_high) / 2
            V_mid = compute(s_mid)
            
            if abs(V_mid - V_applied) < 0.01:
                return s_mid
            if V_mid > V_applied:
                s_low = s_mid
            else:
                s_high = s_mid
        
        return (s_low + s_high) / 2
    
    # ==================== 液化深度计算 ====================
    
    def _calc_simplified_liquefaction_limit(self) -> float:
        """
        简化公式液化限制深度（仅供参考）
        
        公式: h ≈ D / (2·(Ktanδ)_o)
        来源: 文档 第1.2.4节
        
        注意: 此公式为经验近似值，未考虑吸力大小的影响。
              实际液化深度应由内侧有效应力 σ'_vi ≤ 0 判断。
        """
        if self.coeff.Ktan_delta_o <= 0:
            return float('inf')
        return self.geo.D_o / (2 * self.coeff.Ktan_delta_o)
    
    def _find_actual_liquefaction_depth(self, V_applied: float, 
                                         max_search: float = 10.0) -> float:
        """
        寻找实际液化深度（σ'_vi = 0 的临界深度）
        
        通过二分法求解内侧有效应力为零的深度。
        这是硬性物理极限，超过此深度无法继续贯入。
        
        Parameters:
            V_applied: 施加的竖向荷载 (kN)
            max_search: 最大搜索深度 (m)
        
        Returns:
            实际液化深度 (m)
        """
        def sigma_vi_at_depth(h: float) -> float:
            """计算给定深度的内侧有效应力"""
            if h <= 0:
                return self.soil.gamma_prime * h
            s = self.required_suction(h, V_applied)
            return self._sigma_inner(h, s)
        
        # 检查浅层是否已液化
        if sigma_vi_at_depth(0.5) <= 0:
            return 0.5
        
        # 检查最大搜索深度处是否仍未液化
        if sigma_vi_at_depth(max_search) > 0:
            return max_search  # 未达到液化
        
        # 二分法搜索临界深度
        h_low, h_high = 0.5, max_search
        
        for _ in range(50):
            h_mid = (h_low + h_high) / 2
            if sigma_vi_at_depth(h_mid) <= 0:
                h_high = h_mid
            else:
                h_low = h_mid
            
            if h_high - h_low < 0.01:
                break
        
        return (h_low + h_high) / 2
    
    # ==================== 限制检查 ====================
    
    def _check_reverse_bearing(self, h: float, s: float) -> Dict[str, Any]:
        """
        检查反向承载力破坏（吸力限制，非深度限制）
        
        物理含义：当吸力过大时，锚底部土体可能发生拉伸拔出破坏
        解决方法：降低吸力即可避免
        
        条件: σ'_vo = Nq · σ'_vi
        来源: 文档 第1.2.4节
        """
        Nq = self.soil.calc_Nq()
        sigma_vo = self._sigma_outer(h, s)
        sigma_vi = self._sigma_inner(h, s)
        
        if sigma_vi <= 0:
            # 内侧有效应力为零时，已发生内部液化，反向承载力检查无意义
            return {
                'applicable': False,
                'reason': '内侧有效应力已为零（内部液化）',
                'sigma_vo': sigma_vo,
                'sigma_vi': sigma_vi
            }
        
        current_ratio = sigma_vo / sigma_vi
        is_exceeded = current_ratio >= Nq
        
        return {
            'applicable': True,
            'exceeded': is_exceeded,
            'sigma_vo': sigma_vo,
            'sigma_vi': sigma_vi,
            'current_ratio': current_ratio,
            'critical_ratio': Nq,
            'warning_message': f"当前吸力 {s:.2f}kPa 下，σ'_vo/σ'_vi = {current_ratio:.2f} > {Nq:.2f}，可能发生反向承载力破坏（底部土体拔出）。建议降低吸力。"
        }
    
    def check_depth_feasibility(self, h: float, V_applied: float) -> Dict[str, Any]:
        """
        检查给定深度是否可行
        
        处理逻辑（按优先级）：
            1. 内部液化/管涌：由 σ'_vi ≤ 0 判断（硬性深度限制）
            2. 吸力过大：软性警告，提示吸力超过经验上限
            3. 反向承载力：软性警告，提示可降低吸力避免
        
        Parameters:
            h: 目标深度 (m)
            V_applied: 施加的竖向荷载 (kN)
        
        Returns:
            dict: 包含可行性判断和警告信息
        """
        warnings = []
        is_feasible = True
        
        # 1. 计算所需吸力
        s_needed = self.required_suction(h, V_applied)
        
        # 2. 计算内侧有效应力（用于液化判断）
        sigma_vi = self._sigma_inner(h, s_needed)
        
        # 3. 简化公式参考值（仅用于信息输出）
        simplified_limit = self._calc_simplified_liquefaction_limit()
        
        # 4. 优先检查内部液化/管涌（硬性深度限制）
        #    实际液化深度由 σ'_vi ≤ 0 判断，这是硬性物理极限
        if sigma_vi <= 0:
            warnings.append(
                f"[硬性限制] 深度 {h:.3f}m 处内侧有效应力为零（σ'_vi = {sigma_vi:.2f} kPa），"
                f"发生内部液化/管涌，无法继续贯入。"
            )
            warnings.append(
                f"           简化公式参考值为 {simplified_limit:.3f}m，"
                f"实际限制深度与吸力相关，建议以精确计算为准。"
            )
            is_feasible = False
            return {
                'is_feasible': is_feasible,
                'is_liquefied': True,
                'warnings': warnings,
                'required_suction': s_needed,
                'simplified_liquefaction_limit': simplified_limit,
                'actual_sigma_vi': sigma_vi,
                'reverse_bearing': None
            }
        
        # 5. 吸力超限检查（软性警告）
        if s_needed > self.MAX_SUCTION_WARNING:
            warnings.append(
                f"[操作警告] 所需吸力 {s_needed:.2f}kPa 超过经验上限 {self.MAX_SUCTION_WARNING}kPa，"
                f"工程中可能难以实现。"
            )
        
        # 6. 反向承载力检查（软性警告，降低吸力可避免）
        reverse_check = self._check_reverse_bearing(h, s_needed)
        if reverse_check.get('applicable', False) and reverse_check.get('exceeded', False):
            warnings.append(reverse_check['warning_message'])
        
        # 7. 吸力过大无法求解
        if s_needed > 500:
            warnings.append(
                f"[硬性限制] 所需吸力过大 ({s_needed:.0f}kPa)，"
                f"无法通过吸力达到该深度。"
            )
            is_feasible = False
        
        return {
            'is_feasible': is_feasible,
            'is_liquefied': False,
            'warnings': warnings,
            'required_suction': s_needed,
            'simplified_liquefaction_limit': simplified_limit,
            'actual_sigma_vi': sigma_vi,
            'reverse_bearing': reverse_check if reverse_check.get('applicable', False) else None
        }
    
    def get_max_penetration_depth(self, V_applied: float = 0.0, 
                                   max_search: float = 10.0) -> Dict[str, Any]:
        """
        获取最大可达贯入深度（硬性限制）
        
        硬性限制：内侧有效应力 σ'_vi ≤ 0（内部液化/管涌）
        软性限制（仅输出参考）：简化公式、反向承载力、吸力上限
        
        Parameters:
            V_applied: 施加的竖向荷载 (kN)
            max_search: 最大搜索深度 (m)
        
        Returns:
            dict: 包含实际液化深度和简化公式参考值
        """
        # 实际液化深度（精确计算）
        actual_liquefaction_depth = self._find_actual_liquefaction_depth(V_applied, max_search)
        
        # 简化公式参考值（仅供参考，不参与决策）
        simplified_liquefaction_limit = self._calc_simplified_liquefaction_limit()
        
        # 自重贯入极限（无吸力时，仅供参考）
        h_self_weight = 0.0
        if V_applied > 0:
            test_depths = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
            for h in test_depths:
                res = self.self_weight_penetration(h)
                if res['total'] <= V_applied:
                    h_self_weight = h
                else:
                    break
        
        return {
            'self_weight_limit': h_self_weight,
            'simplified_liquefaction_limit': simplified_liquefaction_limit,
            'actual_liquefaction_depth': actual_liquefaction_depth,
            'max_depth': actual_liquefaction_depth,  # 硬性最大深度
            'limiting_factor': '内部液化/管涌（精确计算）'
        }


# ==================== 辅助函数 ====================

def format_number(value: float, decimals: int = 4) -> str:
    """格式化数字输出，禁用科学计数法"""
    if math.isinf(value):
        return "∞"
    return f"{value:.{decimals}f}"


def print_separator(char: str = "=", length: int = 70) -> None:
    """打印分隔线"""
    print(char * length)