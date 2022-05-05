"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeOption = void 0;
const config_1 = require("../../config");
class RuntimeOption {
    constructor(props) {
        this.flag = "r";
        this.alias = "runtime";
        this.description = "The runtime of the resource";
        this.default = props === null || props === void 0 ? void 0 : props.default;
        this.choices = config_1.ResourceDefinition.function.runtimes;
        this.properties = [{ name: "runtime", required: true }];
        this.required = false;
    }
}
exports.RuntimeOption = RuntimeOption;
