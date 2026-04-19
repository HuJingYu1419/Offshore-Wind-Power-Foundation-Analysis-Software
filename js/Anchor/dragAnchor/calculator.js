/**
 * @filepath: js/Anchor/dragAnchor/calculator.js
 * @description: 拖曳锚极限嵌入深度计算逻辑
 *               基于杨涵婷(2009)天津大学硕士学位论文
 *               公式(4-23)饱和粘土 + 公式(4-44)饱和砂土
 */

// 预定义锚板尺寸（论文第61页 表4-1）
const ANCHOR_PRESETS = {
    custom: {
        name: "自定义锚板",
        length: 0.250,
        width: 0.250,
        thickness: 0.014,
        A_bearing: 3500e-6,
        A_shearing: 132000e-6,
        O: 0.300,
        desc: "用户自定义参数"
    },
    small: {
        name: "小锚板 As",
        length: 0.200,
        width: 0.200,
        thickness: 0.012,
        A_bearing: 2400e-6,
        A_shearing: 84800e-6,
        O: 0.240,
        desc: "0.20m × 0.20m，端面积24cm²"
    },
    medium: {
        name: "中锚板 Am",
        length: 0.250,
        width: 0.250,
        thickness: 0.014,
        A_bearing: 3500e-6,
        A_shearing: 132000e-6,
        O: 0.300,
        desc: "0.25m × 0.25m，端面积35cm²"
    },
    large: {
        name: "大锚板 Al",
        length: 0.300,
        width: 0.300,
        thickness: 0.016,
        A_bearing: 4800e-6,
        A_shearing: 189600e-6,
        O: 0.360,
        desc: "0.30m × 0.30m，端面积48cm²"
    }
};

const CHAIN_TYPE = { CHAIN: 'chain', WIRE: 'wire' };

function getEffectiveWidth(d, chainType) {
    return chainType === CHAIN_TYPE.CHAIN ? 2.5 * d : d;
}

function calcDeltaZ(O, cRad, thetaMRad) {
    return O * Math.sin(cRad - thetaMRad);
}

function computeM1Clay(cRad, thetaMRad) {
    const angleDiff = cRad - thetaMRad;
    const cosVal = Math.cos(angleDiff);
    if (Math.abs(cosVal) < 1e-6) return 1e6;
    return (angleDiff * angleDiff) / cosVal;
}

function computeM2Clay(cRad, alpha, Nc, thetaMRad) {
    const angleDiff = cRad - thetaMRad;
    const cosVal = Math.cos(angleDiff);
    if (Math.abs(cosVal) < 1e-6) return 1e6;
    return (alpha * angleDiff * angleDiff) / (Nc * cosVal);
}

function computeM1Sand(cRad, K0, thetaMRad) {
    const angleDiff = cRad - thetaMRad;
    const cosVal = Math.cos(angleDiff);
    if (Math.abs(cosVal) < 1e-6) return 1e6;
    return (K0 * angleDiff * angleDiff) / cosVal;
}

function computeM2Sand(cRad, tanDelta, Nq, thetaMRad) {
    const angleDiff = cRad - thetaMRad;
    const cosVal = Math.cos(angleDiff);
    if (Math.abs(cosVal) < 1e-6) return 1e6;
    return (tanDelta * angleDiff * angleDiff) / (Nq * cosVal);
}

function computeNq(phiDeg) {
    const phiRad = phiDeg * Math.PI / 180;
    const expTerm = Math.exp(Math.PI * Math.tan(phiRad));
    const tanTerm = Math.pow(Math.tan(Math.PI / 4 + phiRad / 2), 2);
    return expTerm * tanTerm;
}

function getAnchorParams(params) {
    if (params.use_preset && params.anchor_type !== 'custom') {
        const preset = ANCHOR_PRESETS[params.anchor_type];
        if (preset) {
            return {
                name: preset.name,
                length: preset.length,
                width: preset.width,
                thickness: preset.thickness,
                A_bearing: preset.A_bearing,
                A_shearing: preset.A_shearing,
                O: preset.O,
                desc: preset.desc
            };
        }
    }
    return {
        name: "自定义锚板",
        length: params.custom_length,
        width: params.custom_width,
        thickness: params.custom_thickness,
        A_bearing: params.custom_A_bearing,
        A_shearing: params.custom_A_shearing,
        O: params.custom_O,
        desc: `自定义: ${params.custom_length}m × ${params.custom_width}m`
    };
}

function calculateClay(anchor, params) {
    const cRad = params.c_deg * Math.PI / 180;
    const thetaMRad = params.theta_m_deg * Math.PI / 180;
    const b = getEffectiveWidth(params.d, params.chain_type);
    const deltaZ = calcDeltaZ(anchor.O, cRad, thetaMRad);
    const m1 = computeM1Clay(cRad, thetaMRad);
    const m2 = computeM2Clay(cRad, params.alpha, params.Nc, thetaMRad);
    const T = m1 * anchor.A_bearing + m2 * anchor.A_shearing;
    const t1 = T / (2 * b);
    const t2 = params.k > 1e-6 ? params.su0 / params.k : 0;
    const sqrtInner = t1 * t1 + t2 * t2 + 2 * deltaZ * t1;
    const sqrtTerm = sqrtInner > 0 ? Math.sqrt(sqrtInner) : 0;
    const zUed = Math.max(0, t1 - t2 + deltaZ + sqrtTerm);
    return { zUed, b, deltaZ, m1, m2, T, t1, t2, sqrtInner, sqrtTerm };
}

function calculateSand(anchor, params) {
    const cRad = params.c_deg * Math.PI / 180;
    const thetaMRad = params.theta_m_deg * Math.PI / 180;
    const b = getEffectiveWidth(params.d, params.chain_type);
    const deltaZ = calcDeltaZ(anchor.O, cRad, thetaMRad);
    const Nq = computeNq(params.phi);
    const tanDelta = params.delta_fac * Math.tan(params.phi * Math.PI / 180);
    const m1 = computeM1Sand(cRad, params.K0, thetaMRad);
    const m2 = computeM2Sand(cRad, tanDelta, Nq, thetaMRad);
    const T = m1 * anchor.A_bearing + m2 * anchor.A_shearing;
    const t1 = T / (2 * b);
    const sqrtInner = t1 * t1 + 2 * deltaZ * t1;
    const sqrtTerm = sqrtInner > 0 ? Math.sqrt(sqrtInner) : 0;
    const zUed = Math.max(0, t1 + deltaZ + sqrtTerm);
    return { zUed, b, deltaZ, Nq, tanDelta, m1, m2, T, t1, sqrtInner, sqrtTerm };
}

export function calculate(params) {
    const anchor = getAnchorParams(params);
    const isClay = params.soil_type === 'clay';
    const calcResult = isClay ? calculateClay(anchor, params) : calculateSand(anchor, params);
    const zUed = calcResult.zUed;
    
    const result = {
        value: zUed,
        unit: "m",
        text: `极限嵌入深度: ${zUed.toFixed(4)} m (${(zUed * 1000).toFixed(1)} mm)`,
        details: {
            soil_type: isClay ? "饱和粘土" : "饱和砂土",
            anchor_name: anchor.name,
            anchor_desc: anchor.desc,
            c_deg: params.c_deg,
            d_mm: (params.d * 1000).toFixed(2),
            chain_type: params.chain_type === 'wire' ? "钢索 (b=d)" : "钢链 (b=2.5d)",
            theta_m_deg: params.theta_m_deg,
            anchor_length_m: anchor.length,
            anchor_width_m: anchor.width,
            anchor_thickness_mm: anchor.thickness * 1000,
            A_bearing_cm2: anchor.A_bearing * 10000,
            A_shearing_cm2: anchor.A_shearing * 10000,
            O_mm: anchor.O * 1000,
            effective_width_b_m: calcResult.b,
            delta_z_m: calcResult.deltaZ,
            m1: calcResult.m1,
            m2: calcResult.m2,
            T: calcResult.T,
            t1: calcResult.t1,
            z_ued_m: zUed,
            z_ued_mm: zUed * 1000,
            z_ued_ratio: zUed / anchor.length
        }
    };
    
    if (isClay) {
        result.details.t2 = calcResult.t2;
        result.details.sqrt_inner = calcResult.sqrtInner;
        result.details.sqrt_term = calcResult.sqrtTerm;
        result.details.su0 = params.su0;
        result.details.k = params.k;
        result.details.alpha = params.alpha;
        result.details.Nc = params.Nc;
    } else {
        result.details.Nq = calcResult.Nq;
        result.details.tan_delta = calcResult.tanDelta;
        result.details.sqrt_inner = calcResult.sqrtInner;
        result.details.sqrt_term = calcResult.sqrtTerm;
        result.details.phi = params.phi;
        result.details.delta_fac = params.delta_fac;
        result.details.K0 = params.K0;
        result.details.gamma = params.gamma;
    }
    
    return result;
}