"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForceOption = void 0;
class ForceOption {
    constructor(props) {
        this.flag = "f";
        this.alias = "force";
        this.description = "Force a command";
        this.default = props === null || props === void 0 ? void 0 : props.default;
        this.required = false;
    }
}
exports.ForceOption = ForceOption;
