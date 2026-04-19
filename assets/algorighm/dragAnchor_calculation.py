"""
模块名称: 拖曳锚极限嵌入深度(UED)计算工具
功能描述: 基于杨涵婷(2009)天津大学硕士学位论文公式(4-23)和(4-44)，
         计算深海拖曳锚在饱和粘土/饱和砂土中的极限嵌入深度
引用文献: 杨涵婷. 拖曳锚嵌入运动轨迹的理论预测模型[D]. 天津大学, 2009.
         - 粘土公式: 第54页 公式(4-23)
         - 砂土公式: 第60页 公式(4-44)
         - 锚板尺寸: 第61页 表4-1
         - Nq公式: 第56页 (Meyerhof承载力公式)
适用范围: 法向承力锚(如表中As、Am、Al三种规格)，忽略锚胫影响(A_sb=0, A_ss=0)
计算假设: 
         1. 极限嵌入状态下锚板被抬平，取 θm = 0
         2. 土体抗剪强度随深度线性变化: su = su0 + k*z (粘土)
         3. 砂土中忽略 Nγ·γ'·t 项
警告: 本工具为研究性代码，实际工程应用需经专业校核
"""

import numpy as np
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional, Tuple
import warnings
import math


class SoilType(Enum):
    """土体类型枚举"""
    CLAY = "clay"      # 饱和粘土
    SAND = "sand"      # 饱和砂土


class ChainType(Enum):
    """拖缆类型枚举"""
    CHAIN = "chain"    # 钢链: b = 2.5d
    WIRE = "wire"      # 钢索: b = d


@dataclass
class AnchorGeometry:
    """锚板几何参数 (单位: 米, 平方米)
    
    基于论文第61页 表4-1 定义
    """
    name: str                     # 锚板名称 ("small", "medium", "large")
    length: float                 # 长 (m)
    width: float                  # 宽 (m)
    thickness: float              # 厚 (m)
    A_bearing: float              # 端阻力有效承载面积 (m²) - 对应表4-1中 A_lb
    A_shearing: float             # 剪切面积 (m²) - 对应表4-1中 A_fs
    O: float                      # 系缆点至锚板重心的距离 (m) - 表4-1中 O
    
    def get_delta_z(self, c_rad: float, theta_m_rad: float = 0.0) -> float:
        """计算 Δz = O * sin(c - θm)
        
        论文第56页: Δz = O·sin(c - θm)
        极限嵌入状态下锚板被抬平，通常取 θm = 0
        """
        return self.O * np.sin(c_rad - theta_m_rad)


@dataclass
class ClaySoilParams:
    """饱和粘土参数
    
    基于论文第40页 公式(4-1): su = su0 + k*z
    """
    su0: float                    # 表面不排水抗剪强度 (kPa)
    k: float                      # 抗剪强度梯度 (kPa/m), k > 0
    alpha: float                  # 粘滞系数 (0.2-0.8 典型值)
    Nc: float                     # 承载力系数 (通常 7.6，深埋时取7.6)
    
    def get_su(self, z: float) -> float:
        """计算深度z处的不排水抗剪强度"""
        return self.su0 + self.k * z


@dataclass
class SandSoilParams:
    """饱和砂土参数
    
    基于论文第56页定义
    """
    gamma: float                  # 土体浮容重 (kN/m³) - 注：公式中实际上被消去，此处保留用于参数分析
    phi: float                    # 内摩擦角 (度)
    delta_fac: float              # 摩擦比 (tanδ / tanφ)，通常取0.5
    K0: float                     # 侧压力系数 (0.4-0.6 典型值)
    
    def get_Nq(self) -> float:
        """计算承载力系数 Nq (Meyerhof/Berezantsev 公式)
        
        论文第56页: Nq = e^(π·tanφ) · tan²(45° + φ/2)
        
        这是砂土承载力计算的标准公式，与同事HTML中的实现一致
        """
        phi_rad = np.radians(self.phi)
        # 第一项: e^(π·tanφ)
        exp_term = math.exp(math.pi * math.tan(phi_rad))
        # 第二项: tan²(45° + φ/2)
        tan_term = math.tan(math.pi / 4 + phi_rad / 2) ** 2
        return exp_term * tan_term
    
    def get_tan_delta(self) -> float:
        """计算 tanδ = delta_fac * tanφ"""
        phi_rad = np.radians(self.phi)
        return self.delta_fac * math.tan(phi_rad)


# ========== 预定义锚板尺寸 ==========
# 基于论文第61页 表4-1 (转换为SI单位)
# 注: 表4-1中 A_lb 对应端面积(A_bearing), A_fs 对应剪切面积(A_shearing)
ANCHORS: Dict[str, AnchorGeometry] = {
    "small": AnchorGeometry(
        name="小锚板 As",
        length=0.200, width=0.200, thickness=0.012,
        A_bearing=2400e-6, A_shearing=84800e-6, O=0.240
    ),
    "medium": AnchorGeometry(
        name="中锚板 Am",
        length=0.250, width=0.250, thickness=0.014,
        A_bearing=3500e-6, A_shearing=132000e-6, O=0.300
    ),
    "large": AnchorGeometry(
        name="大锚板 Al",
        length=0.300, width=0.300, thickness=0.016,
        A_bearing=4800e-6, A_shearing=189600e-6, O=0.360
    ),
}


def get_effective_width(d: float, chain_type: ChainType) -> float:
    """计算嵌入缆有效承载宽度 b
    
    论文第52页: 
        - 钢链: b = 2.5d
        - 钢索: b = d
    DNV规范建议值，参照Degenkamp模型试验确定
    """
    if chain_type == ChainType.CHAIN:
        return 2.5 * d
    else:  # WIRE
        return d


def compute_m1_clay(c_rad: float, theta_m_rad: float = 0.0) -> float:
    """粘土中 m1 系数
    
    论文第54页 公式(4-23):
        m1 = (c - θm)^2 / cos(c - θm)
    
    极限嵌入状态下锚板被抬平，通常取 θm = 0
    """
    angle_diff = c_rad - theta_m_rad
    cos_val = np.cos(angle_diff)
    
    if np.abs(cos_val) < 1e-6:
        warnings.warn(f"cos(c-θm) = {cos_val:.2e} 接近零，m1趋于无穷大")
        return float('inf')
    
    # 注意: 同事HTML中使用的是 c_rad * c_rad (假设θm=0)
    # 这里保留一般形式
    return angle_diff ** 2 / cos_val


def compute_m2_clay(c_rad: float, alpha: float, Nc: float, theta_m_rad: float = 0.0) -> float:
    """粘土中 m2 系数
    
    论文第54页 公式(4-23):
        m2 = α·(c - θm)^2 / (Nc·cos(c - θm))
    """
    angle_diff = c_rad - theta_m_rad
    cos_val = np.cos(angle_diff)
    
    if np.abs(cos_val) < 1e-6:
        return float('inf')
    
    return alpha * angle_diff ** 2 / (Nc * cos_val)


def compute_m1_sand(c_rad: float, K0: float, theta_m_rad: float = 0.0) -> float:
    """砂土中 m1 系数
    
    论文第60页 公式(4-44):
        m1 = K0·(c - θm)^2 / cos(c - θm)
    """
    angle_diff = c_rad - theta_m_rad
    cos_val = np.cos(angle_diff)
    
    if np.abs(cos_val) < 1e-6:
        warnings.warn(f"cos(c-θm) = {cos_val:.2e} 接近零，m1趋于无穷大")
        return float('inf')
    
    return K0 * angle_diff ** 2 / cos_val


def compute_m2_sand(c_rad: float, tan_delta: float, Nq: float, theta_m_rad: float = 0.0) -> float:
    """砂土中 m2 系数
    
    论文第60页 公式(4-44):
        m2 = tanδ·(c - θm)^2 / (Nq·cos(c - θm))
    """
    angle_diff = c_rad - theta_m_rad
    cos_val = np.cos(angle_diff)
    
    if np.abs(cos_val) < 1e-6:
        return float('inf')
    
    return tan_delta * angle_diff ** 2 / (Nq * cos_val)


def ued_clay(
    anchor: AnchorGeometry,
    soil: ClaySoilParams,
    c_deg: float,
    d: float,
    chain_type: ChainType = ChainType.WIRE,
    theta_m_deg: float = 0.0,
    ignore_shank: bool = True
) -> Dict:
    """
    饱和粘土中极限嵌入深度计算 (论文公式4-23)
    
    核心公式 (与同事HTML逻辑一致):
        t1 = (m1·Ab + m2·As) / (2·b)
        t2 = su0 / k
        z = t1 - t2 + Δz + sqrt( t1² + t2² + Δz·2·t1 )
    
    参数:
        anchor: 锚板几何参数
        soil: 饱和粘土参数
        c_deg: 系缆点拖缆与锚板板面夹角 (度)
        d: 拖缆直径 (m)
        chain_type: 拖缆类型 (钢链/钢索)
        theta_m_deg: 行进方向与锚板上板面夹角 (度)，极限状态下取0
        ignore_shank: 是否忽略锚胫影响 (默认True，即A_sb=A_ss=0)
    
    返回:
        包含计算过程和结果的字典
    """
    # 角度转弧度
    c_rad = np.radians(c_deg)
    theta_m_rad = np.radians(theta_m_deg)
    
    # 计算有效承载宽度 b
    b = get_effective_width(d, chain_type)
    
    # 计算 Δz
    delta_z = anchor.get_delta_z(c_rad, theta_m_rad)
    
    # 有效面积 (考虑是否忽略锚胫)
    if ignore_shank:
        A_bearing = anchor.A_bearing
        A_shearing = anchor.A_shearing
    else:
        # 完整公式需要用户提供 A_sb, A_ss
        warnings.warn("锚胫影响未完整实现，请提供 A_sb, A_ss 参数")
        A_bearing = anchor.A_bearing
        A_shearing = anchor.A_shearing
    
    # 计算 m1, m2 (取θm=0时，c_rad即为角度差)
    m1 = compute_m1_clay(c_rad, theta_m_rad)
    m2 = compute_m2_clay(c_rad, soil.alpha, soil.Nc, theta_m_rad)
    
    # 计算组合项 T = m1·A_bearing + m2·A_shearing
    T = m1 * A_bearing + m2 * A_shearing
    
    # 计算 t1 = T / (2·b)
    # 同事HTML中变量名为 t1
    t1 = T / (2 * b)
    
    # 计算 t2 = su0 / k
    # 同事HTML中变量名为 t2
    if soil.k > 1e-6:
        t2 = soil.su0 / soil.k
    else:
        t2 = 0.0
        if soil.su0 > 0:
            warnings.warn("k=0 且 su0>0，su0/k项趋于无穷")
    
    # 平方根内部: t1² + t2² + Δz·2·t1
    # 同事HTML中的实现: root = t1*t1 + t2*t2 + dz*2*t1
    sqrt_inner = t1 * t1 + t2 * t2 + delta_z * 2 * t1
    
    if sqrt_inner < -1e-6:
        warnings.warn(f"平方根内部为负值({sqrt_inner:.4f})，计算结果可能不物理")
        sqrt_term = 0.0
    elif sqrt_inner < 0:
        sqrt_term = 0.0
    else:
        sqrt_term = np.sqrt(sqrt_inner)
    
    # 最终结果: z = t1 - t2 + Δz + sqrt(...)
    z_ued = t1 - t2 + delta_z + sqrt_term
    
    # 确保结果为非负
    z_ued = max(0.0, z_ued)
    
    # 输出详细分项
    result = {
        "formula": "公式(4-23) 饱和粘土极限嵌入深度",
        "input_params": {
            "c (度)": c_deg,
            "θm (度)": theta_m_deg,
            "su0 (kPa)": soil.su0,
            "k (kPa/m)": soil.k,
            "α (粘滞系数)": soil.alpha,
            "Nc (承载力系数)": soil.Nc,
            "d (拖缆直径 m)": d,
            "拖缆类型": "钢链" if chain_type == ChainType.CHAIN else "钢索",
            "b (有效承载宽度 m)": b,
            "Δz (m)": delta_z,
            "锚板型号": anchor.name,
            "A_bearing (m²)": A_bearing,
            "A_shearing (m²)": A_shearing,
            "忽略锚胫": ignore_shank
        },
        "intermediate": {
            "m1": m1,
            "m2": m2,
            "T = m1·Ab + m2·As": T,
            "t1 = T/(2b)": t1,
            "t2 = su0/k": t2,
            "Δz": delta_z,
            "sqrt_inner (t1² + t2² + 2Δz·t1)": sqrt_inner,
            "sqrt_term": sqrt_term
        },
        "final": {
            "z_UED (m)": z_ued,
            "z_UED (mm)": z_ued * 1000,
            "z_UED (倍锚板长)": z_ued / anchor.length
        }
    }
    
    return result


def ued_sand(
    anchor: AnchorGeometry,
    soil: SandSoilParams,
    c_deg: float,
    d: float,
    chain_type: ChainType = ChainType.WIRE,
    theta_m_deg: float = 0.0,
    ignore_shank: bool = True
) -> Dict:
    """
    饱和砂土中极限嵌入深度计算 (论文公式4-44)
    
    核心公式 (与同事HTML逻辑一致):
        t1 = (m1·Ab + m2·As) / (2·b)
        z = t1 + Δz + sqrt( t1² + Δz·2·t1 )
    
    其中 Nq 使用 Meyerhof 公式计算:
        Nq = e^(π·tanφ) · tan²(45° + φ/2)
    
    参数:
        anchor: 锚板几何参数
        soil: 饱和砂土参数
        c_deg: 系缆点拖缆与锚板板面夹角 (度)
        d: 拖缆直径 (m)
        chain_type: 拖缆类型 (钢链/钢索)
        theta_m_deg: 行进方向与锚板上板面夹角 (度)，极限状态下取0
        ignore_shank: 是否忽略锚胫影响 (默认True)
    
    返回:
        包含计算过程和结果的字典
    """
    # 角度转弧度
    c_rad = np.radians(c_deg)
    theta_m_rad = np.radians(theta_m_deg)
    
    # 计算相关参数
    b = get_effective_width(d, chain_type)
    delta_z = anchor.get_delta_z(c_rad, theta_m_rad)
    
    # 计算 Nq (使用正确的Meyerhof公式)
    Nq = soil.get_Nq()
    tan_delta = soil.get_tan_delta()
    
    # 有效面积
    if ignore_shank:
        A_bearing = anchor.A_bearing
        A_shearing = anchor.A_shearing
    else:
        A_bearing = anchor.A_bearing
        A_shearing = anchor.A_shearing
    
    # 计算 m1, m2 (砂土)
    m1 = compute_m1_sand(c_rad, soil.K0, theta_m_rad)
    m2 = compute_m2_sand(c_rad, tan_delta, Nq, theta_m_rad)
    
    # 计算组合项 T = m1·A_bearing + m2·A_shearing
    T = m1 * A_bearing + m2 * A_shearing
    
    # 计算 t1 = T / (2·b)
    # 同事HTML中变量名为 t1
    t1 = T / (2 * b)
    
    # 平方根内部: t1² + Δz·2·t1
    # 同事HTML中的实现: root = t1*t1 + dz*2*t1
    sqrt_inner = t1 * t1 + delta_z * 2 * t1
    
    if sqrt_inner < -1e-6:
        warnings.warn(f"平方根内部为负值({sqrt_inner:.4f})，计算结果可能不物理")
        sqrt_term = 0.0
    elif sqrt_inner < 0:
        sqrt_term = 0.0
    else:
        sqrt_term = np.sqrt(sqrt_inner)
    
    # 最终结果: z = t1 + Δz + sqrt(...)
    z_ued = t1 + delta_z + sqrt_term
    
    # 确保结果为非负
    z_ued = max(0.0, z_ued)
    
    result = {
        "formula": "公式(4-44) 饱和砂土极限嵌入深度 (Meyerhof Nq公式)",
        "input_params": {
            "c (度)": c_deg,
            "θm (度)": theta_m_deg,
            "γ (kN/m³)": soil.gamma,
            "φ (度)": soil.phi,
            "摩擦比 (tanδ/tanφ)": soil.delta_fac,
            "tanδ": tan_delta,
            "K0": soil.K0,
            "Nq (Meyerhof公式)": Nq,
            "d (拖缆直径 m)": d,
            "拖缆类型": "钢链" if chain_type == ChainType.CHAIN else "钢索",
            "b (有效承载宽度 m)": b,
            "Δz (m)": delta_z,
            "锚板型号": anchor.name,
            "A_bearing (m²)": A_bearing,
            "A_shearing (m²)": A_shearing,
            "忽略锚胫": ignore_shank
        },
        "intermediate": {
            "m1": m1,
            "m2": m2,
            "T = m1·Ab + m2·As": T,
            "t1 = T/(2b)": t1,
            "Δz": delta_z,
            "sqrt_inner (t1² + 2Δz·t1)": sqrt_inner,
            "sqrt_term": sqrt_term
        },
        "final": {
            "z_UED (m)": z_ued,
            "z_UED (mm)": z_ued * 1000,
            "z_UED (倍锚板长)": z_ued / anchor.length
        }
    }
    
    return result


def calculate_ued(
    soil_type: SoilType,
    anchor_key: str,
    c_deg: float,
    d: float,
    soil_params: Dict,
    chain_type: ChainType = ChainType.WIRE,
    theta_m_deg: float = 0.0,
    ignore_shank: bool = True
) -> Dict:
    """
    统一计算接口
    
    参数:
        soil_type: SoilType.CLAY 或 SoilType.SAND
        anchor_key: "small", "medium", "large"
        c_deg: 系缆点拖缆与锚板板面夹角 (度)
        d: 拖缆直径 (m)
        soil_params: 土体参数字典
            - 粘土: {"su0": float, "k": float, "alpha": float, "Nc": float}
            - 砂土: {"gamma": float, "phi": float, "delta_fac": float, "K0": float}
        chain_type: 拖缆类型
        theta_m_deg: 行进方向与锚板上板面夹角 (度)，默认0
        ignore_shank: 是否忽略锚胫影响
    
    返回:
        包含计算过程和结果的字典
    """
    # 获取锚板几何
    if anchor_key not in ANCHORS:
        raise ValueError(f"锚板类型必须是 {list(ANCHORS.keys())} 之一")
    anchor = ANCHORS[anchor_key]
    
    # 参数合理性检查
    if c_deg <= 0 or c_deg >= 90:
        warnings.warn(f"夹角 c={c_deg}° 超出典型范围(0-90°)")
    
    if d <= 0:
        raise ValueError(f"拖缆直径 d={d} 必须大于0")
    
    if soil_type == SoilType.CLAY:
        required = ["su0", "k", "alpha", "Nc"]
        for key in required:
            if key not in soil_params:
                raise ValueError(f"粘土参数缺少 {key}")
        clay_params = ClaySoilParams(**{k: soil_params[k] for k in required})
        
        if clay_params.k <= 1e-6 and clay_params.su0 > 0:
            warnings.warn("k≈0 表示强度不随深度增加，su0/k项将趋于无穷")
        
        return ued_clay(anchor, clay_params, c_deg, d, chain_type, theta_m_deg, ignore_shank)
    
    elif soil_type == SoilType.SAND:
        required = ["gamma", "phi", "delta_fac", "K0"]
        for key in required:
            if key not in soil_params:
                raise ValueError(f"砂土参数缺少 {key}")
        sand_params = SandSoilParams(**{k: soil_params[k] for k in required})
        return ued_sand(anchor, sand_params, c_deg, d, chain_type, theta_m_deg, ignore_shank)
    
    else:
        raise ValueError(f"不支持的土体类型: {soil_type}")


def compare_with_html_implementation():
    """
    与同事HTML实现进行结果对比验证
    """
    print("\n" + "=" * 80)
    print("与同事HTML实现的结果对比验证")
    print("=" * 80)
    
    # 使用与HTML相同的默认参数
    # 粘土: c=30°, d=6mm, su0=10, k=1.5, alpha=0.5, Nc=7.6
    print("\n【验证1】饱和粘土 - 中锚板, c=30°, d=6mm (钢索)")
    print("-" * 60)
    
    clay_result = calculate_ued(
        soil_type=SoilType.CLAY,
        anchor_key="medium",
        c_deg=30.0,
        d=0.006,
        soil_params={"su0": 10.0, "k": 1.5, "alpha": 0.5, "Nc": 7.6},
        chain_type=ChainType.WIRE,
        theta_m_deg=0.0
    )
    
    print(f"  Python计算结果: z_UED = {clay_result['final']['z_UED (m)']:.4f} m")
    print("  同事HTML预期: ~0.42m (中锚板, c=30°时)")
    print(f"  差异: 需要实际运行HTML确认")
    
    # 砂土验证
    print("\n【验证2】饱和砂土 - 中锚板, c=30°, d=6mm (钢索)")
    print("-" * 60)
    print("  参数: γ=10kN/m³, φ=25°, K0=0.5, 摩擦比=0.5")
    
    sand_result = calculate_ued(
        soil_type=SoilType.SAND,
        anchor_key="medium",
        c_deg=30.0,
        d=0.006,
        soil_params={"gamma": 10.0, "phi": 25.0, "delta_fac": 0.5, "K0": 0.5},
        chain_type=ChainType.WIRE,
        theta_m_deg=0.0
    )
    
    print(f"  Python计算结果: z_UED = {sand_result['final']['z_UED (m)']:.4f} m")
    print(f"  Nq (Meyerhof公式) = {sand_result['input_params']['Nq (Meyerhof公式)']:.4f}")
    
    # 输出完整的中间结果便于对比
    print("\n--- 粘土中间结果详情 ---")
    for k, v in clay_result['intermediate'].items():
        if isinstance(v, float):
            print(f"  {k}: {v:.6f}")
        else:
            print(f"  {k}: {v}")
    
    print("\n--- 砂土中间结果详情 ---")
    for k, v in sand_result['intermediate'].items():
        if isinstance(v, float):
            print(f"  {k}: {v:.6f}")
        else:
            print(f"  {k}: {v}")


# ========== 使用示例 ==========
if __name__ == "__main__":
    print("=" * 80)
    print("拖曳锚极限嵌入深度(UED)计算工具 (修正版)")
    print("基于: 杨涵婷(2009) 天津大学硕士学位论文")
    print("公式: 粘土(4-23), 砂土(4-44)")
    print("修正: Nq使用Meyerhof公式 e^(π·tanφ)·tan²(45°+φ/2)")
    print("=" * 80)
    
    # 示例1: 粘土计算
    print("\n【示例1】饱和粘土 - 中锚板, c=30°, d=6mm (钢索)")
    print("-" * 60)
    
    clay_result = calculate_ued(
        soil_type=SoilType.CLAY,
        anchor_key="medium",
        c_deg=30.0,
        d=0.006,
        soil_params={"su0": 10.0, "k": 1.5, "alpha": 0.5, "Nc": 7.6},
        chain_type=ChainType.WIRE,
        theta_m_deg=0.0
    )
    
    print("\n--- 输入参数 ---")
    for k, v in clay_result['input_params'].items():
        print(f"  {k}: {v}")
    
    print("\n--- 中间计算结果 ---")
    for k, v in clay_result['intermediate'].items():
        if isinstance(v, float):
            print(f"  {k}: {v:.6f}")
        else:
            print(f"  {k}: {v}")
    
    print("\n=== 最终结果 ===")
    for k, v in clay_result['final'].items():
        if isinstance(v, float):
            print(f"  {k}: {v:.4f}" if v < 1000 else f"  {k}: {v:.2f}")
        else:
            print(f"  {k}: {v}")
    
    # 示例2: 砂土计算
    print("\n【示例2】饱和砂土 - 中锚板, c=30°, d=6mm (钢索)")
    print("-" * 60)
    
    sand_result = calculate_ued(
        soil_type=SoilType.SAND,
        anchor_key="medium",
        c_deg=40.0,
        d=0.006,
        soil_params={"gamma": 10.0, "phi": 25.0, "delta_fac": 0.5, "K0": 0.5},
        chain_type=ChainType.WIRE,
        theta_m_deg=0.0
    )
    
    print("\n--- 输入参数 ---")
    for k, v in sand_result['input_params'].items():
        print(f"  {k}: {v}")
    
    print("\n--- 中间计算结果 ---")
    for k, v in sand_result['intermediate'].items():
        if isinstance(v, float):
            print(f"  {k}: {v:.6f}")
        else:
            print(f"  {k}: {v}")
    
    print("\n=== 最终结果 ===")
    for k, v in sand_result['final'].items():
        if isinstance(v, float):
            print(f"  {k}: {v:.4f}" if v < 1000 else f"  {k}: {v:.2f}")
        else:
            print(f"  {k}: {v}")
    
    # 与HTML实现对比验证
    compare_with_html_implementation()