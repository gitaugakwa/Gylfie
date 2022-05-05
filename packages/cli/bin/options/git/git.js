"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitOption = void 0;
class GitOption {
    constructor(props) {
        this.flag = "g";
        this.alias = "skip-git";
        this.description = "Skip git repository initialization";
        this.default = props === null || props === void 0 ? void 0 : props.default;
        this.required = false;
    }
}
exports.GitOption = GitOption;
