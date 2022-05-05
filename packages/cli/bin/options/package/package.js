"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageOption = void 0;
class PackageOption {
    constructor(props) {
        this.flag = "p";
        this.alias = "package-manager";
        this.description = "Preferred package manager";
        this.default = props === null || props === void 0 ? void 0 : props.default;
        this.choices = ["npm", "pnpm", "yarn"];
        this.properties = [{ name: "package-manager", required: true }];
        this.required = false;
    }
}
exports.PackageOption = PackageOption;
