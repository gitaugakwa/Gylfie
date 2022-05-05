"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchOption = void 0;
class WatchOption {
    constructor(props) {
        this.flag = "w";
        this.alias = "watch";
        this.description = "Run in watch mode";
        this.default = props === null || props === void 0 ? void 0 : props.default;
        this.required = false;
    }
}
exports.WatchOption = WatchOption;
