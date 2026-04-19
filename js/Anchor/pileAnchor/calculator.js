/**
 * @filepath: js/Anchor/pileAnchor/calculator.js
 * @description: 桩锚承载力计算逻辑 - 刚性锚桩斜向抗拔承载力计算
 *               基于黄挺等(2023)论文《密实砂中刚性锚桩斜向抗拔承载特性》
 */

/**
 * 计算 Nq (Meyerhof/Berezantsev 公式)
 */
function computeNq(phiDeg) {
    const phiRad = phiDeg * Math.PI / 180;
    const expTerm = Math.exp(Math.PI * Math.tan(phiRad));
    const tanTerm = Math.pow(Math.tan(Math.PI / 4 + phiRad / 2), 2);
    return expTerm * tanTerm;
}

/**
 * 计算被动土压力系数 Kp
 */
function computeKp(phiDeg) {
    const phiRad = phiDeg * Math.PI / 180;
    return Math.pow(Math.tan(Math.PI / 4 + phiRad / 2), 2);
}

const PileAnchorCalculator = {
    checkDeltaRange(deltaDeg) {
        if (deltaDeg <= 26.0) return "low";
        if (deltaDeg < 39.0) return "middle";
        return "high";
    },

    calculateVerticalCapacity(params) {
        const L = params.L;
        const D = params.D;
        const G = params.m_pile * 9.81;
        const Ab = Math.PI * D * D / 4;
        const phiRad = params.phi_deg * Math.PI / 180;
        const phiCritRad = params.phi_crit_deg * Math.PI / 180;
        const deltaRad = params.delta_deg * Math.PI / 180;
        
        const tanRatio = Math.tan(deltaRad) / Math.tan(phiRad);
        let m = 1.5 * Math.log(Math.max(tanRatio, 1e-6)) + 1.0;
        m = Math.max(0.0, Math.min(1.0, m));
        
        const termVermeerBase = 1.0 + 2.0 * (m * L * D) / Ab * Math.tan(phiRad) * Math.cos(phiCritRad);
        const termVermeer = termVermeerBase * Ab * params.gamma * m * L;
        
        const avgStress = params.gamma * (1.0 + m) / 2.0 * L;
        const friction = avgStress * params.K0 * Math.tan(deltaRad);
        const termInterface = G + Math.PI * L * D * friction;
        
        const deltaRange = this.checkDeltaRange(params.delta_deg);
        
        let Vu;
        if (deltaRange === "low") {
            Vu = G + (Math.PI * D / 2.0) * Math.pow(L, 2) * params.K0 * Math.tan(deltaRad);
        } else if (deltaRange === "middle") {
            Vu = termVermeer + (1.0 - m) * termInterface;
        } else {
            Vu = (1.0 + 2.0 * (L * D) / Ab * Math.tan(phiRad) * Math.cos(phiCritRad)) * Ab * params.gamma * L;
        }
        
        return Vu;
    },

    calculateRotationPointA(params) {
        const L = params.L;
        const e = params.e;
        
        const term1 = -(0.567 * L + 2.7 * e);
        const term2Sqrt = Math.sqrt(5.307 * L * L + 7.29 * e * e + 10.541 * e * L);
        let a = (term1 + term2Sqrt) / 2.20;
        a = Math.max(0, Math.min(L, a));
        return a;
    },

    calculateHorizontalCapacity(params, useKnownHu = false, knownHu = null) {
        if (useKnownHu && knownHu !== null) {
            return knownHu;
        }
        
        const a = this.calculateRotationPointA(params);
        const Kp = computeKp(params.phi_deg);
        const K_param = params.K_param !== undefined ? params.K_param : Kp;
        const tanDelta = Math.tan(params.delta_deg * Math.PI / 180);
        
        const comboCoef = params.eta * Math.pow(Kp, 2) + params.xi * K_param * tanDelta;
        const bracketTerm = 2.7 * a - 1.7 * params.L;
        
        let Hu = 0.3 * comboCoef * params.gamma * a * params.D * bracketTerm;
        Hu = Math.max(0, Hu);
        
        return Hu;
    },

    calculateNCoefficient(params) {
        const tanDelta = Math.tan(params.delta_deg * Math.PI / 180);
        const tanPhi = Math.tan(params.phi_deg * Math.PI / 180);
        const tanRatio = tanDelta / tanPhi;
        const t = 1.0 - tanRatio;
        
        let n = 8.60 * Math.pow(t, 2) - 1.15 * t + 0.06;
        n = Math.max(0.01, n);
        
        return n;
    },

    calculateLoadingAngleI(thetaDeg, Vu, Hu) {
        const thetaRad = thetaDeg * Math.PI / 180;
        const iRad = Math.atan2(Hu * Math.tan(thetaRad), Vu);
        return iRad * 180 / Math.PI;
    },

    envelopeVRatio(ratioH, n) {
        const SEGMENT_RATIO = 0.82;
        if (ratioH <= SEGMENT_RATIO) {
            return -5.6 * ratioH + 5.6;
        } else {
            let term = -14.57 * Math.pow(ratioH, 3) + 6.90 * Math.pow(ratioH, 2) + 3.77 * ratioH + 1.0;
            term = Math.max(1e-6, term);
            return Math.pow(term, n);
        }
    },

    solveObliqueCapacity(thetaDeg, Vu, Hu, params) {
        const thetaRad = thetaDeg * Math.PI / 180;
        const tanTheta = Math.tan(thetaRad);
        const n = this.calculateNCoefficient(params);
        
        if (Math.abs(tanTheta) < 1e-6) {
            return { H: Hu, V: 0, iDeg: 0, HRatio: 1.0, VRatio: 0.0 };
        }
        if (thetaDeg >= 89.9) {
            return { H: 0, V: Vu, iDeg: 90, HRatio: 0.0, VRatio: 1.0 };
        }
        
        const envelopeVRatio = (ratioH) => this.envelopeVRatio(ratioH, n);
        
        const residual = (ratioH) => ratioH * tanTheta - envelopeVRatio(ratioH);
        
        let low = 0.0, high = 1.0;
        let resLow = residual(low);
        let resHigh = residual(high);
        
        if (resLow * resHigh > 0) {
            for (const testHigh of [0.9, 0.8, 0.7, 0.6, 0.5]) {
                const resTest = residual(testHigh);
                if (resLow * resTest <= 0) {
                    high = testHigh;
                    resHigh = resTest;
                    break;
                }
            }
        }
        
        if (resLow * resHigh > 0) {
            let ratioH = tanTheta > 0 ? 1.0 / (1.0 + 1.0 / tanTheta) : 0;
            ratioH = Math.max(0, Math.min(1, ratioH));
            let ratioV = ratioH * tanTheta;
            ratioV = Math.min(ratioV, envelopeVRatio(ratioH));
            return {
                H: ratioH * Hu,
                V: ratioV * Vu,
                iDeg: ratioH > 1e-6 ? Math.atan2(ratioV, ratioH) * 180 / Math.PI : 0,
                HRatio: ratioH,
                VRatio: ratioV
            };
        }
        
        for (let i = 0; i < 100; i++) {
            const mid = (low + high) / 2;
            const resMid = residual(mid);
            if (Math.abs(resMid) < 1e-8) {
                low = high = mid;
                break;
            }
            if (resLow * resMid < 0) {
                high = mid;
                resHigh = resMid;
            } else {
                low = mid;
                resLow = resMid;
            }
        }
        
        const ratioH = Math.max(0, Math.min(1, (low + high) / 2));
        const ratioV = ratioH * tanTheta;
        
        return {
            H: ratioH * Hu,
            V: ratioV * Vu,
            iDeg: ratioH > 1e-6 ? Math.atan2(ratioV, ratioH) * 180 / Math.PI : 0,
            HRatio: ratioH,
            VRatio: ratioV
        };
    }
};

export function calculate(params) {
    const L = params.L;
    const D = params.D;
    const G = params.m_pile * 9.81;
    const Ab = Math.PI * D * D / 4;
    const Kp = computeKp(params.phi_deg);
    
    const Vu = PileAnchorCalculator.calculateVerticalCapacity(params);
    
    const PAPER_HU = 3349.85;
    const usePaperHu = params.use_paper_hu === true || params.use_paper_hu === "true";
    
    let Hu;
    if (usePaperHu) {
        Hu = PAPER_HU;
    } else {
        Hu = PileAnchorCalculator.calculateHorizontalCapacity(params, false);
    }
    
    const a = PileAnchorCalculator.calculateRotationPointA(params);
    const n = PileAnchorCalculator.calculateNCoefficient(params);
    const iDeg = PileAnchorCalculator.calculateLoadingAngleI(params.theta_deg, Vu, Hu);
    const oblique = PileAnchorCalculator.solveObliqueCapacity(params.theta_deg, Vu, Hu, params);
    
    const typicalAngles = [0, 22.5, 45, 67.5, 90];
    const angleResults = {};
    for (const ang of typicalAngles) {
        const res = PileAnchorCalculator.solveObliqueCapacity(ang, Vu, Hu, params);
        angleResults[`theta_${ang}`] = {
            H: res.H,
            V: res.V,
            i: res.iDeg,
            H_ratio: res.HRatio,
            V_ratio: res.VRatio
        };
    }
    
    return {
        value: oblique.H,
        unit: "kN",
        text: `斜向承载力 H = ${oblique.H.toFixed(2)} kN, V = ${oblique.V.toFixed(2)} kN (θ = ${params.theta_deg}°)`,
        details: {
            L_m: L,
            D_m: D,
            m_pile_t: params.m_pile,
            G_kN: G,
            Ab_m2: Ab,
            e_m: params.e,
            phi_deg: params.phi_deg,
            gamma_kN_m3: params.gamma,
            delta_deg: params.delta_deg,
            K0: params.K0,
            eta: params.eta,
            xi: params.xi,
            K_param: params.K_param,
            Kp: Kp,
            a_m: a,
            n_exp: n,
            i_deg: iDeg,
            Vu_kN: Vu,
            Hu_kN: Hu,
            Hu_calc_method: usePaperHu ? "论文验证值" : "公式计算",
            theta_deg: params.theta_deg,
            H_kN: oblique.H,
            V_kN: oblique.V,
            H_Hu_ratio: oblique.HRatio,
            V_Vu_ratio: oblique.VRatio,
            typical_results: angleResults
        }
    };
}