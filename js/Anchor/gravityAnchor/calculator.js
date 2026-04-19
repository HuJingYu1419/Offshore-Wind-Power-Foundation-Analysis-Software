/**
 * @filepath: js/Anchor/gravityAnchor/calculator.js
 * @description: 重力锚承载力计算逻辑
 *               基于黄博晓(2021)硕士论文 + DNV/API规范
 */

const NC_DESIGN = 9.0;
const NC_PAPER = 6.095;

const F_COEFF_ROUGH = { a: 2.56, b: 0.457, c: 0.713, d: 1.38 };
const F_COEFF_SMOOTH = { a: 1.372, b: 0.07, c: -0.128, d: 0.342 };

function getSuAtDepth(Sum, k, z) {
    return Sum + k * z;
}

function getAverageSu(Sum, k, zMin, zMax) {
    const suMin = getSuAtDepth(Sum, k, zMin);
    const suMax = getSuAtDepth(Sum, k, zMax);
    return (suMin + suMax) / 2;
}

function calculateFactorF(x, useRoughContact = true) {
    const coeff = useRoughContact ? F_COEFF_ROUGH : F_COEFF_SMOOTH;
    const { a, b, c, d } = coeff;
    const inner = c + b * x;
    const F = a + b * x - Math.sqrt(inner * inner + d * d);
    return Math.max(0.1, Math.min(2.0, F));
}

function calculateSu2(F, Nc, Su0, kappa, B_prime) {
    return F * (Nc * Su0 + kappa * B_prime / 4) / Nc;
}

function calculateFactorKc(B_prime, L_prime, D, Su0, Su_ave, Su2, H_prime, A_prime, nu = 0, beta = 0, k = 0) {
    const x = Su0 > 0 ? Math.max(0, Math.min(10, k * B_prime / Su0)) : 0;
    const scv = 0.18 - 0.155 * Math.sqrt(x) + 0.021 * x;
    const ratio = (A_prime * Su0) > 0 ? Math.max(0, Math.min(0.999, H_prime / (A_prime * Su0))) : 0;
    const ic = 0.5 - 0.5 * Math.sqrt(1 - ratio);
    const sc = scv * (1 - 2 * ic) * (B_prime / L_prime);
    let dc = 0;
    if (Su2 > 0 && B_prime > 0) {
        dc = 0.3 * (Su_ave / Su2) * Math.atan(D / B_prime);
    }
    const bc = 0.4 * nu;
    const gc = 0.4 * beta;
    let Kc = 1 + sc + dc - ic - bc - gc;
    Kc = Math.max(0.5, Math.min(2.0, Kc));
    return Kc;
}

function calculateHorizontalCapacityFlat(params, A_base, B) {
    const z = params.skirt_depth > 0 ? params.skirt_depth : 0.26;
    const su_z = getSuAtDepth(params.Sum, params.k, z);
    const su_a = getAverageSu(params.Sum, params.k, 0, z);
    const term1 = su_z * A_base;
    const term2_inner = 2 * su_a * z + params.gamma_b * 0.5 * z * z;
    const term2 = term2_inner * B;
    const fh = term1 + term2;
    return {
        horizontal_capacity_kN: fh,
        su_at_base_kPa: su_z,
        average_su_kPa: su_a,
        term1_base_adhesion_kN: term1,
        term2_lateral_resistance_kN: term2,
        effective_depth_m: z
    };
}

function calculateHorizontalCapacitySkirted(params, A_base, B) {
    let zs = params.skirt_depth;
    if (zs <= 0) zs = 0.26;
    const su_z = getSuAtDepth(params.Sum, params.k, zs);
    const su_a = getAverageSu(params.Sum, params.k, 0, zs);
    const term1 = su_z * A_base;
    const term2_inner = 2 * su_a * zs + params.gamma_b * 0.5 * zs * zs;
    const term2 = term2_inner * B;
    const fh = term1 + term2;
    return {
        horizontal_capacity_kN: fh,
        skirt_depth_m: zs,
        su_at_base_kPa: su_z,
        average_su_kPa: su_a,
        term1_base_adhesion_kN: term1,
        term2_skirt_resistance_kN: term2
    };
}

function calculateUpliftCapacity(params, A_base, B, L, skirt_depth) {
    const Nc = params.use_paper_nc ? NC_PAPER : NC_DESIGN;
    const useRough = params.contact_type === 'rough';
    const Su0 = getSuAtDepth(params.Sum, params.k, skirt_depth);
    const Su_ave = getAverageSu(params.Sum, params.k, 0, skirt_depth);
    const kappa = params.k;
    const B_prime = B;
    const A_prime = A_base;
    const D = skirt_depth;
    const L_prime = L;
    const x = Su0 > 0 ? Math.max(0, Math.min(10, kappa * B_prime / Su0)) : 0;
    const F = calculateFactorF(x, useRough);
    const bearing_term = Su0 * Nc + kappa * B_prime / 4;
    const Su2 = calculateSu2(F, Nc, Su0, kappa, B_prime);
    const Kc = calculateFactorKc(B_prime, L_prime, D, Su0, Su_ave, Su2, 0, A_prime, 0, 0, params.k);
    const Ve = F * bearing_term * Kc * A_prime;
    const perimeter = 2 * (L + B);
    const As = perimeter * skirt_depth;
    const Vs = params.alpha * As * Su_ave;
    const total_uplift = Ve + Vs + params.weight_in_water;
    return {
        uplift_capacity_kN: total_uplift,
        ve_base_capacity_kN: Ve,
        vs_skirt_friction_kN: Vs,
        anchor_weight_kN: params.weight_in_water,
        factor_F: F,
        factor_Kc: Kc,
        x_parameter: x,
        bearing_term_kPa: bearing_term,
        su2_calculated_kPa: Su2,
        Nc_used: Nc
    };
}

function calculatePenetrationResistance(params, A_base, L, B, penetration_depth) {
    const Nc = params.use_paper_nc ? NC_PAPER : NC_DESIGN;
    const z = penetration_depth;
    const su_avg = getAverageSu(params.Sum, params.k, 0, z);
    const su_tip = getSuAtDepth(params.Sum, params.k, z);
    const perimeter = 2 * (L + B);
    const A_side = perimeter * z;
    const A_tip = A_base;
    const Qside = A_side * params.alpha * su_avg;
    const Qtip = (Nc * su_tip + params.gamma_b * z) * A_tip;
    const Qtot = Qside + Qtip;
    return {
        penetration_resistance_kN: Qtot,
        qside_side_resistance_kN: Qside,
        qtip_tip_resistance_kN: Qtip,
        su_average_kPa: su_avg,
        su_tip_kPa: su_tip,
        Nc_used: Nc,
        A_side_m2: A_side,
        A_tip_m2: A_tip
    };
}

function calculateOverturningStability(params) {
    const MO = params.design_load_T * params.A_arm;
    const MR = params.weight_in_water * params.L_arm;
    const safety_factor = MO > 0 ? MR / MO : Infinity;
    const is_stable = safety_factor >= 1.5;
    return {
        overturning_moment_MO_kN_m: MO,
        resisting_moment_MR_kN_m: MR,
        safety_factor: safety_factor,
        is_stable: is_stable,
        stability_status: is_stable ? '稳定 (安全系数 ≥ 1.5)' : '不稳定 (安全系数 < 1.5，可能倾覆)',
        A_arm_m: params.A_arm,
        L_arm_m: params.L_arm
    };
}

export function calculate(params) {
    const A_base = params.L * params.B;
    const isSkirted = params.anchor_type === 'skirted';
    const skirtDepth = isSkirted ? params.skirt_depth : 0;
    
    let horizontalResult;
    if (isSkirted) {
        horizontalResult = calculateHorizontalCapacitySkirted(params, A_base, params.B);
    } else {
        horizontalResult = calculateHorizontalCapacityFlat(params, A_base, params.B);
    }
    
    const upliftResult = calculateUpliftCapacity(params, A_base, params.B, params.L, skirtDepth);
    const penDepth = params.penetration_depth || skirtDepth || 0.26;
    const penetrationResult = calculatePenetrationResistance(params, A_base, params.L, params.B, penDepth);
    const overturningResult = calculateOverturningStability(params);
    
    const resultText = `水平承载力: ${horizontalResult.horizontal_capacity_kN.toFixed(1)} kN; 上拔力: ${upliftResult.uplift_capacity_kN.toFixed(1)} kN; 贯入阻力: ${penetrationResult.penetration_resistance_kN.toFixed(1)} kN; 抗倾覆安全系数: ${overturningResult.safety_factor.toFixed(3)}`;
    
    return {
        value: horizontalResult.horizontal_capacity_kN,
        unit: "kN",
        text: resultText,
        details: {
            anchor_type: isSkirted ? "带剪力键(裙板)重力锚" : "平底重力锚",
            L_m: params.L,
            B_m: params.B,
            H_m: params.H,
            A_base_m2: A_base,
            skirt_depth_m: skirtDepth,
            weight_in_water_kN: params.weight_in_water,
            use_paper_nc: params.use_paper_nc ? "是 (Nc=6.095)" : "否 (Nc=9.0)",
            contact_type: params.contact_type === 'rough' ? "粗糙接触" : "光滑接触",
            horizontal_capacity: horizontalResult,
            uplift_capacity: upliftResult,
            penetration_resistance: penetrationResult,
            overturning_stability: overturningResult
        }
    };
}