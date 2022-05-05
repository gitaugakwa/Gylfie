"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DryRunOption = void 0;
class DryRunOption {
    constructor(props) {
        this.flag = "d";
        this.alias = "dry-run";
        this.description =
            "Reports changes that would be made, but does not change the filesystem";
        this.default = props === null || props === void 0 ? void 0 : props.default;
        this.required = false;
    }
}
exports.DryRunOption = DryRunOption;
