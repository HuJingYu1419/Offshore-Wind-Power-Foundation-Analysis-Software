# -*- coding: utf-8 -*-
"""
验证脚本: 黏土中吸力锚安装计算验证

依据《系泊锚设计》文档案例1进行验证
"""

import sys
import os
from typing import Optional, Dict, Any, Tuple

# 添加核心模块路径（根据实际目录结构调整）
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from suctionAnchor_clayinstall import (
    CaissonGeometry, SoilProfile, Coefficients, SuctionCaissonInstaller,
    format_number, print_separator
)
import numpy as np
import matplotlib.pyplot as plt

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False


def get_soil_params_at_depth(h: float) -> Tuple[float, float]:
    """
    获取案例1的分段土体参数
    
    文档案例1土层:
        - 表层土 (0-2m): 恒定 su = 20 kPa
        - 下层土 (>2m): 线性增长，2m处 su=25kPa，梯度 ρ=2.5 kPa/m
    """
    if h <= 2.0:
        return 20.0, 0.0
    else:
        return 25.0, 2.5


def run_case1_verification():
    """运行文档案例1验证"""
    
    print_separator("=")
    print("案例1：吸力式沉箱安装计算（理论案例）- 验证")
    print("依据：《系泊锚设计》文档 第1.1.6节 案例1")
    print_separator("=")
    
    # ---------- 输入参数 ----------
    print("\n-- 输入参数 --")
    
    # 沉箱几何参数
    D_o = 12.0                      # 外径 (m)
    t = 0.045                       # 壁厚 (m)
    D_i = D_o - 2 * t               # 内径 = 11.91 m
    geometry = CaissonGeometry(D_o=D_o, D_i=D_i, t=t)
    print(f"  外径 D_o = {D_o} m")
    print(f"  内径 D_i = {D_i:.4f} m")
    print(f"  壁厚 t = {t} m")
    
    # 计算系数（文档取值）
    coeff = Coefficients(
        alpha_o=0.6,        # 外侧黏着系数
        alpha_i=0.5,        # 内侧黏着系数
        Nc=9.0,             # 端承系数
        Nc_star=8.5,        # 上拔系数
        f0=None,            # 不启用应力增强修正
        rib_perimeter=None, # 不启用加劲肋
        rib_area=None
    )
    print(f"  外侧黏着系数 α_o = {coeff.alpha_o}")
    print(f"  内侧黏着系数 α_i = {coeff.alpha_i}")
    print(f"  端承系数 N_c = {coeff.Nc}")
    
    # 竖向荷载
    V_applied = 1000.0              # kN
    print(f"  施加竖向荷载 V_applied = {V_applied} kN")
    
    # ---------- 计算结果 ----------
    print("\n-- 中间计算结果 --")
    print(f"{'深度(m)':<10} {'总承载力(kN)':<16} {'外侧摩擦(kN)':<14} {'内侧摩擦(kN)':<14} {'端承力(kN)':<14} {'自重贯入':<10}")
    print("-" * 78)
    
    depths = np.linspace(0.2, 5.0, 50)
    results_no_suction = []
    results_suction = []
    
    for h in depths:
        # 获取当前深度的土体参数
        suo, rho = get_soil_params_at_depth(h)
        soil = SoilProfile(suo=suo, rho=rho, gamma_prime=6.0)
        
        # 创建计算器实例
        installer = SuctionCaissonInstaller(geometry, soil, coeff)
        
        # 自重贯入计算
        res_self = installer.self_weight_penetration(h, V_applied=V_applied)
        
        # 所需吸力计算
        s_req = installer.required_suction(h, V_applied=V_applied)
        
        results_no_suction.append({
            'depth': h,
            'total': res_self['total'],
            'outer': res_self['outer_friction'],
            'inner': res_self['inner_friction'],
            'tip': res_self['tip_bearing'],
            'can_penetrate': res_self['can_penetrate']
        })
        
        results_suction.append({
            'depth': h,
            'suction': s_req
        })
        
        # 打印关键深度结果
        key_depths = [0.5, 1.0, 2.0, 3.0, 4.0, 5.0]
        if any(abs(h - d) < 0.01 for d in key_depths):
            # 简化打印条件
            pass
    
    # 打印关键深度结果（筛选）
    for res in results_no_suction:
        if res['depth'] in [0.5, 1.0, 2.0, 3.0, 4.0, 5.0]:
            status = "可贯入" if res['can_penetrate'] else "不可贯入"
            print(f"{res['depth']:<10.2f} {res['total']:<16.2f} "
                  f"{res['outer']:<14.2f} {res['inner']:<14.2f} "
                  f"{res['tip']:<14.2f} {status:<10}")
    
    print("\n-- 所需吸力计算 --")
    print(f"{'深度(m)':<10} {'所需吸力(kPa)':<16} {'状态':<15}")
    print("-" * 41)
    
    for res in results_suction:
        if res['depth'] in [0.5, 1.0, 2.0, 3.0, 4.0, 5.0]:
            status = "需要吸力" if res['suction'] > 0.1 else "自重可贯入"
            print(f"{res['depth']:<10.2f} {res['suction']:<16.4f} {status:<15}")
    
    # 查找自重贯入临界深度
    critical_depth = None
    for res in results_no_suction:
        if res['can_penetrate']:
            critical_depth = res['depth']
        else:
            break
    
    if critical_depth:
        print(f"\n  自重贯入临界深度 ≈ {critical_depth:.2f} m")
    
    # ---------- 最终结果 ----------
    print_separator("=")
    print("=== 最终结果 ===")
    print_separator("=")
    
    # 计算极限贯入深度比（使用典型土体参数）
    soil_typical = SoilProfile(suo=20.0, rho=2.5, gamma_prime=6.0)
    installer_typical = SuctionCaissonInstaller(geometry, soil_typical, coeff)
    h_D_ratio = installer_typical.ultimate_depth_ratio()
    
    print(f"\n极限贯入深度比 h/D = {h_D_ratio:.4f}")
    print(f"  对应深度 h = {h_D_ratio * geometry.D_avg:.4f} m")
    print(f"  文档预测范围: 均质黏土 h/D≈3, 正常固结软黏土 h/D≈6")
    
    # ---------- 绘图 ----------
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    
    # 图1：自重贯入承载力
    depths_arr = [r['depth'] for r in results_no_suction]
    total_arr = [r['total'] / 1000 for r in results_no_suction]
    outer_arr = [r['outer'] / 1000 for r in results_no_suction]
    inner_arr = [r['inner'] / 1000 for r in results_no_suction]
    tip_arr = [r['tip'] / 1000 for r in results_no_suction]
    
    ax1.plot(total_arr, depths_arr, 'b-', linewidth=2.5, label='总承载力')
    ax1.plot(outer_arr, depths_arr, 'r--', linewidth=2, label='外侧摩擦')
    ax1.plot(inner_arr, depths_arr, 'g--', linewidth=2, label='内侧摩擦')
    ax1.plot(tip_arr, depths_arr, 'm-.', linewidth=2, label='端承力')
    ax1.axvline(x=V_applied/1000, color='k', linestyle=':', alpha=0.7, 
                label=f'施加荷载 = {V_applied/1000:.0f} kN')
    
    ax1.set_xlabel('承载力 (kN)', fontsize=12)
    ax1.set_ylabel('深度 z (m)', fontsize=12)
    ax1.set_title('自重贯入承载力', fontsize=12)
    ax1.set_xlim(0, max(total_arr) * 1.1)
    ax1.set_ylim(max(depths_arr), 0)
    ax1.grid(True, alpha=0.3)
    ax1.legend(loc='lower right')
    
    # 图2：所需吸力
    depths_s = [r['depth'] for r in results_suction]
    suction_s = [r['suction'] for r in results_suction]
    
    ax2.plot(suction_s, depths_s, 'b-o', linewidth=2, markersize=4)
    
    if critical_depth:
        ax2.axhline(y=critical_depth, color='g', linestyle='--', alpha=0.7,
                    label=f'自重贯入极限 = {critical_depth:.2f}m')
    
    ax2.set_xlabel('所需吸力 (kPa)', fontsize=12)
    ax2.set_ylabel('深度 z (m)', fontsize=12)
    ax2.set_title('所需吸力与深度关系', fontsize=12)
    ax2.set_xlim(0, max(suction_s) * 1.1 if max(suction_s) > 0 else 50)
    ax2.set_ylim(max(depths_s), 0)
    ax2.grid(True, alpha=0.3)
    ax2.legend(loc='lower right')
    
    plt.tight_layout()
    plt.show()
    
    return results_no_suction, results_suction


if __name__ == "__main__":
    run_case1_verification()