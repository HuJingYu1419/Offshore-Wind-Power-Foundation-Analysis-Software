/**
 * @filepath: js/Anchor/plateAnchor/calculator.js
 * @description: 板锚承载力计算逻辑
 *               基于 Merfield et al. (2003) 下限解理论
 *               参考文献: "Three-Dimensional Lower Bound Solutions for Stability of Plate Anchors in Clay"
 */

/**
 * 方形锚形状因子 S 的经验拟合多项式（8次）
 * 来源：师兄笔记，对论文图6曲线的数值拟合
 * 适用范围：H/B 约 1~10
 */
function shapeFactorSquare(x) {
    const a8 = -4.59716e-6;
    const a7 = 0.00020;
    const a6 = -0.00356;
    const a5 = 0.03438;
    const a4 = -0.19108;
    const a3 = 0.60651;
    const a2 = -1.00177;
    const a1 = 0.68234;
    const a0 = 1.59197;
    
    return a8 * Math.pow(x, 8) + a7 * Math.pow(x, 7) + a6 * Math.pow(x, 6) +
           a5 * Math.pow(x, 5) + a4 * Math.pow(x, 4) + a3 * Math.pow(x, 3) +
           a2 * Math.pow(x, 2) + a1 * x + a0;
}

/**
 * 圆形锚形状因子 S 的经验拟合多项式（10次）
 * 来源：师兄笔记，对论文图9曲线的数值拟合
 * 适用范围：H/D 约 1~10
 */
function shapeFactorCircular(x) {
    const a10 = 2.13325e-7;
    const a9 = -1.14903e-5;
    const a8 = 0.00027;
    const a7 = -0.00363;
    const a6 = 0.03122;
    const a5 = -0.17989;
    const a4 = 0.70743;
    const a3 = -1.88547;
    const a2 = 3.27851;
    const a1 = -3.39259;
    const a0 = 3.54920;
    
    return a10 * Math.pow(x, 10) + a9 * Math.pow(x, 9) + a8 * Math.pow(x, 8) +
           a7 * Math.pow(x, 7) + a6 * Math.pow(x, 6) + a5 * Math.pow(x, 5) +
           a4 * Math.pow(x, 4) + a3 * Math.pow(x, 3) + a2 * Math.pow(x, 2) +
           a1 * x + a0;
}

/**
 * 计算无重度土中的承载系数 N_c0（方形/矩形）
 * 论文公式(4): N_c0 = S * [2.56 * ln(2H/B)]
 */
function nC0Square(embedmentRatio, shapeFactor) {
    const term = 2.56 * Math.log(2.0 * embedmentRatio);
    return shapeFactor * term;
}

/**
 * 计算无重度土中的承载系数 N_c0（圆形）
 * 论文公式(5): N_c0 = S * [2.56 * ln(2H/D)]
 */
function nC0Circular(embedmentRatio, shapeFactor) {
    const term = 2.56 * Math.log(2.0 * embedmentRatio);
    return shapeFactor * term;
}

/**
 * 计算锚板面积
 */
function calculateArea(shape, width, length) {
    if (shape === 'square') {
        return width * width;
    } else if (shape === 'circular') {
        const radius = width / 2.0;
        return Math.PI * radius * radius;
    } else {
        return width * length;
    }
}

/**
 * 计算深锚极限承载系数 N_c*
 */
function calculateNcStar(shape, aspectRatio = null) {
    if (shape === 'square') {
        return 11.9;
    } else if (shape === 'circular') {
        return 12.56;
    } else {
        // 矩形锚极限值介于方形(11.9)和条形(11.16)之间
        if (aspectRatio >= 10) {
            return 11.16;
        } else if (aspectRatio <= 1) {
            return 11.9;
        } else {
            const factor = (aspectRatio - 1.0) / 9.0;
            return 11.9 - factor * (11.9 - 11.16);
        }
    }
}

/**
 * 获取矩形锚的形状因子（通过插值）
 */
function getRectangularShapeFactor(embedmentRatio, aspectRatio) {
    const sSquare = shapeFactorSquare(embedmentRatio);
    
    if (aspectRatio >= 10) {
        return 1.0;
    } else if (aspectRatio <= 1) {
        return sSquare;
    } else {
        const t = (aspectRatio - 1.0) / 9.0;
        return sSquare * (1.0 - t) + 1.0 * t;
    }
}

/**
 * 主计算函数
 */
export function calculate(params) {
    const shape = params.shape;
    const width = params.width;
    const length = params.shape === 'rectangular' ? params.length : width;
    const embedmentDepth = params.embedment_depth;
    const su = params.undrained_strength;
    const gamma = params.unit_weight;
    const reductionFactor = params.reduction_factor;
    
    // 计算埋深比
    const embedmentRatio = embedmentDepth / width;
    
    // 计算面积
    const area = calculateArea(shape, width, length);
    
    // 计算长宽比（矩形锚用）
    const aspectRatio = (shape === 'rectangular') ? (length / width) : 1.0;
    
    // ========== 步骤1: 计算形状因子 S ==========
    let shapeFactor;
    if (shape === 'square') {
        shapeFactor = shapeFactorSquare(embedmentRatio);
    } else if (shape === 'circular') {
        shapeFactor = shapeFactorCircular(embedmentRatio);
    } else {
        shapeFactor = getRectangularShapeFactor(embedmentRatio, aspectRatio);
    }
    
    // ========== 步骤2: 计算 N_c0 ==========
    let nC0;
    if (shape === 'circular') {
        nC0 = nC0Circular(embedmentRatio, shapeFactor);
    } else {
        nC0 = nC0Square(embedmentRatio, shapeFactor);
    }
    
    // ========== 步骤3: 计算上覆土压力项 ==========
    const overburdenTerm = gamma * embedmentDepth / su;
    
    // ========== 步骤4: 计算 N_c ==========
    const nCCalc = nC0 + overburdenTerm;
    
    // ========== 步骤5: 深锚极限值 ==========
    const ncStar = calculateNcStar(shape, aspectRatio);
    
    // ========== 步骤6: 判断深锚/浅锚并取最终 N_c ==========
    let anchorType;
    let nCFinal;
    if (nCCalc >= ncStar) {
        nCFinal = ncStar;
        anchorType = "深锚 (Deep Anchor)";
    } else {
        nCFinal = nCCalc;
        anchorType = "浅锚 (Shallow Anchor)";
    }
    
    // ========== 步骤7: 计算极限承载力 ==========
    const quUnreduced = su * nCFinal;
    const quReduced = quUnreduced * reductionFactor;
    const QuUnreduced = quUnreduced * area;
    const QuReduced = QuUnreduced * reductionFactor;
    
    // 判断埋深比是否超出拟合范围
    let warningMessage = null;
    if (embedmentRatio < 1.0) {
        warningMessage = `⚠️ 埋深比 H/B = ${embedmentRatio.toFixed(2)} < 1.0，超出形状因子多项式拟合范围（推荐 1~10）`;
    } else if (embedmentRatio > 10.0) {
        warningMessage = `⚠️ 埋深比 H/B = ${embedmentRatio.toFixed(2)} > 10.0，超出形状因子多项式拟合范围（推荐 1~10）`;
    }
    
    // 构建返回结果
    return {
        value: QuReduced,
        unit: "kN",
        text: `极限抗拔力: ${QuReduced.toFixed(2)} kN`,
        details: {
            // 最终结果
            Qu_reduced_kN: QuReduced,
            Qu_unreduced_kN: QuUnreduced,
            qu_reduced_kPa: quReduced,
            qu_unreduced_kPa: quUnreduced,
            
            // 承载系数
            N_c_final: nCFinal,
            N_c0: nC0,
            N_c_star: ncStar,
            
            // 锚板类型判断
            anchor_type: anchorType,
            
            // 中间计算结果
            shape_factor_S: shapeFactor,
            overburden_term: overburdenTerm,
            embedment_ratio: embedmentRatio,
            area_m2: area,
            
            // 输入参数
            shape: shape === 'square' ? '方形锚' : (shape === 'circular' ? '圆形锚' : '矩形锚'),
            width_m: width,
            length_m: (shape === 'rectangular') ? length : null,
            embedment_depth_m: embedmentDepth,
            undrained_strength_kPa: su,
            unit_weight_kN_m3: gamma,
            reduction_factor_used: reductionFactor,
            
            // 警告信息
            warning: warningMessage
        }
    };
}