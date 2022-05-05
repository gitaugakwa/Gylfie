"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StageOption = void 0;
class StageOption {
    constructor(props) {
        this.flag = "s";
        this.alias = "stage";
        this.description = "Add or reference a stage";
        this.default = props === null || props === void 0 ? void 0 : props.default;
        this.properties = [{ name: "name", required: true }];
        this.required = false;
    }
}
exports.StageOption = StageOption;
