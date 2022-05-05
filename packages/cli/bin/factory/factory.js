"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Factory = void 0;
class Factory {
    parseProperty(prop) {
        if (prop.required) {
            return `<${prop.name}>`;
        }
        return `[${prop.name}]`;
    }
}
exports.Factory = Factory;
