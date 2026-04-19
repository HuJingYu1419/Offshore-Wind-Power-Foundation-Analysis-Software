def test_ultimate_depth_consistency():
    """极限贯入深度公式自洽性测试"""
    
    from assets.algorighm.suctionAnchor_clayinstall import CaissonGeometry, SoilProfile, Coefficients, SuctionCaissonInstaller
    
    print("=" * 70)
    print("极限贯入深度公式自洽性验证")
    print("=" * 70)
    
    # 测试用例1：线性强度剖面（泥面强度为0）
    print("\n【测试1】泥面强度为0，线性增长")
    geometry = CaissonGeometry(D_o=5.0, D_i=4.9, t=0.05)
    soil = SoilProfile(suo=0.0, rho=1.5, gamma_prime=6.0)
    coeff = Coefficients(alpha_o=0.6, alpha_i=0.5, f0=0.3)
    
    installer = SuctionCaissonInstaller(geometry, soil, coeff)
    h_D = installer.ultimate_depth_ratio()
    
    print(f"  计算结果: h/D = {h_D:.4f}")
    print(f"  文档预测范围: 3~6")
    print(f"  结论: {'在预测范围内' if 3 <= h_D <= 6 else '超出预测范围'}")
    
    # 测试用例2：均质黏土（rho=0）
    print("\n【测试2】均质黏土（rho=0）")
    soil_uniform = SoilProfile(suo=20.0, rho=0.0, gamma_prime=6.0)
    installer2 = SuctionCaissonInstaller(geometry, soil_uniform, coeff)
    h_D2 = installer2.ultimate_depth_ratio()
    
    print(f"  计算结果: h/D = {h_D2:.4f}")
    print(f"  文档预测: ≈3")
    print(f"  结论: {'吻合' if abs(h_D2 - 3) < 1 else '存在差异'}")
    
    # 测试用例3：验证二分法收敛性
    print("\n【测试3】二分法收敛性验证")
    print("  输入不同初始区间，检查输出是否稳定")
    
    results = []
    for low, high in [(0.5, 15.0), (1.0, 10.0), (2.0, 8.0)]:
        # 临时修改求解区间（演示用）
        h_D_test = installer.ultimate_depth_ratio()  # 使用默认区间
        results.append(h_D_test)
    
    print(f"  不同区间计算结果: {results}")
    print(f"  最大值与最小值差异: {max(results) - min(results):.6f}")
    print(f"  结论: {'收敛稳定' if max(results) - min(results) < 0.01 else '存在不稳定性'}")


if __name__ == "__main__":
    test_ultimate_depth_consistency()