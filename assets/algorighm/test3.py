# -*- coding: utf-8 -*-
"""验证脚本: 砂土案例1a - 以内侧有效应力为硬性限制"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import numpy as np
import matplotlib.pyplot as plt
from suctionAnchor_sandinstall import (
    CaissonGeometrySand, SoilProfileSand, CoefficientsSand, 
    SuctionCaissonInstallerSand, format_number, print_separator
)

plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False


def run_case1a_final():
    """运行案例1a - 以内侧有效应力为硬性限制"""
    
    print_separator("=")
    print("案例1a：吸力桶安装（Tenby）- 简化均匀应力模式")
    print("硬性限制：内侧有效应力 σ'_vi ≤ 0（内部液化/管涌）")
    print("简化公式仅作参考")
    print_separator("=")
    
    # 参数
    geometry = CaissonGeometrySand(D_o=2.0, D_i=2.0 - 2*0.008, t=0.008)
    soil = SoilProfileSand(gamma_prime=8.5, phi=40.0)
    coeff = CoefficientsSand(Ktan_delta_o=0.48, Ktan_delta_i=0.48, a=0.3,
                             formula_mode='exact')
    
    print(f"\n-- 输入参数 --")
    print(f"  几何: D_o={geometry.D_o}m, D_i={geometry.D_i:.4f}m, t={geometry.t}m")
    print(f"  土体: γ'={soil.gamma_prime}kN/m³, φ={soil.phi}°, Nq={soil.calc_Nq():.2f}")
    print(f"  系数: Ktanδ={coeff.Ktan_delta_o}, a={coeff.a}")
    print(f"  荷载: V_applied=10.0kN")
    
    installer = SuctionCaissonInstallerSand(geometry, soil, coeff)
    
    # 极限深度分析
    print("\n" + "-" * 50)
    print("-- 极限深度分析 --")
    max_depth_info = installer.get_max_penetration_depth(10.0)
    print(f"  自重贯入极限（无吸力）: {max_depth_info['self_weight_limit']:.3f}m")
    print(f"  简化公式参考值: {max_depth_info['simplified_liquefaction_limit']:.3f}m")
    print(f"  实际液化深度（精确计算）: {max_depth_info['actual_liquefaction_depth']:.3f}m")
    print(f"  → 硬性最大深度: {max_depth_info['max_depth']:.3f}m")
    print(f"  → 限制因素: {max_depth_info['limiting_factor']}")
    
    # 各深度计算结果
    print("\n-- 各深度计算结果 --")
    print(f"{'深度(m)':<8} {'所需吸力(kPa)':<14} {'σ_vo(kPa)':<14} {'σ_vi(kPa)':<14} {'状态'}")
    print("-" * 65)
    
    for h in [0.5, 1.0, 1.2, 1.4, 1.5, 1.6, 1.8, 2.0]:
        s_req = installer.required_suction(h, 10.0)
        sigma_vo = installer._sigma_outer(h, s_req)
        sigma_vi = installer._sigma_inner(h, s_req)
        
        if sigma_vi <= 0:
            status = "✗ 内部液化（硬性限制）"
        elif s_req > installer.MAX_SUCTION_WARNING:
            status = "⚠ 吸力过大"
        else:
            status = "✓ 可行"
        
        print(f"{h:<8.2f} {s_req:<14.4f} {sigma_vo:<14.2f} {sigma_vi:<14.2f} {status}")
    
    # 深度1.5m可行性检查
    print("\n" + "-" * 50)
    print("-- 深度1.5m可行性检查 --")
    feasibility = installer.check_depth_feasibility(1, 10.0)
    
    print(f"  可行性: {'✓ 可行' if feasibility['is_feasible'] else '✗ 不可行'}")
    print(f"  所需吸力: {feasibility['required_suction']:.2f} kPa")
    print(f"  内侧有效应力 σ'_vi: {feasibility.get('actual_sigma_vi', 0):.2f} kPa")
    print(f"  简化公式参考值: {feasibility['simplified_liquefaction_limit']:.3f} m")
    
    if feasibility['warnings']:
        print(f"\n  提示信息:")
        for w in feasibility['warnings']:
            print(f"    {w}")
    
    # 深度2.0m可行性检查
    print("\n" + "-" * 50)
    print("-- 深度2.0m可行性检查 --")
    feasibility_2m = installer.check_depth_feasibility(2.0, 10.0)
    
    print(f"  可行性: {'✓ 可行' if feasibility_2m['is_feasible'] else '✗ 不可行'}")
    print(f"  所需吸力: {feasibility_2m['required_suction']:.2f} kPa")
    print(f"  内侧有效应力 σ'_vi: {feasibility_2m.get('actual_sigma_vi', 0):.2f} kPa")
    
    if feasibility_2m['warnings']:
        print(f"\n  提示信息:")
        for w in feasibility_2m['warnings']:
            print(f"    {w}")
    
    # 最终结论
    print_separator("=")
    print("=== 最终结论 ===")
    print_separator("=")
    
    print(f"\n根据精确计算（σ'_vi ≤ 0）：")
    print(f"  最大可达深度: {max_depth_info['actual_liquefaction_depth']:.3f} m")
    print(f"  简化公式参考值: {max_depth_info['simplified_liquefaction_limit']:.3f} m")
    print(f"  注意: 简化公式仅供参考，实际深度限制以内侧有效应力为准")
    
    # 绘图
    depths = np.linspace(0.2, 2.0, 50)
    suction_vals = [installer.required_suction(h, 10.0) for h in depths]
    sigma_vi_vals = [installer._sigma_inner(h, installer.required_suction(h, 10.0)) for h in depths]
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    
    # 图1：所需吸力
    ax1.plot(suction_vals, depths, 'b-', lw=2, label='所需吸力')
    ax1.axhline(y=max_depth_info['actual_liquefaction_depth'], c='orange', ls='--', 
                label=f'实际液化深度={max_depth_info["actual_liquefaction_depth"]:.3f}m')
    ax1.axhline(y=max_depth_info['simplified_liquefaction_limit'], c='red', ls=':', 
                label=f'简化公式参考值={max_depth_info["simplified_liquefaction_limit"]:.3f}m')
    ax1.axvline(x=installer.MAX_SUCTION_WARNING, c='r', ls='--', 
                label=f'吸力警告上限={installer.MAX_SUCTION_WARNING}kPa')
    ax1.set_xlabel('所需吸力 (kPa)')
    ax1.set_ylabel('深度 (m)')
    ax1.set_title('所需吸力 vs 深度')
    ax1.set_ylim(max(depths), 0)
    ax1.grid(alpha=0.3)
    ax1.legend()
    
    # 图2：内侧有效应力
    ax2.plot(sigma_vi_vals, depths, 'g-', lw=2, label='σ\'_vi')
    ax2.axvline(x=0, c='k', ls='-', alpha=0.5, label='σ\'_vi = 0（液化界限）')
    ax2.axhline(y=max_depth_info['actual_liquefaction_depth'], c='orange', ls='--', 
                label=f'实际液化深度={max_depth_info["actual_liquefaction_depth"]:.3f}m')
    ax2.set_xlabel('内侧有效应力 σ\'_vi (kPa)')
    ax2.set_ylabel('深度 (m)')
    ax2.set_title('内侧有效应力 vs 深度')
    ax2.set_ylim(max(depths), 0)
    ax2.grid(alpha=0.3)
    ax2.legend()
    
    plt.tight_layout()
    plt.show()
    
    return max_depth_info, feasibility_2m


if __name__ == "__main__":
    run_case1a_final()