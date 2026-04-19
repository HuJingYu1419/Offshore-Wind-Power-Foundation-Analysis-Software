/**
 * @filepath: js/Anchor/suctionAnchor/installation-sand/validator.js
 * @description: 吸力锚 - 安装计算（砂土）占位校验
 */

import { ValidationResult } from '../../shared/baseValidator.js';

export function validate(params) {
    const result = new ValidationResult();
    result.addInfo("安装计算（砂土）模块开发中，当前为占位版本");
    return result;
}