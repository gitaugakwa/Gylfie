"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const lodash_1 = require("lodash");
class Context {
    constructor(path) {
        this.cwd = process.cwd();
        this.configPath = this.derivePath(path);
    }
    get config() {
        var _a;
        if (!this.configExists()) {
            throw new Error("Gylfie Config does not exist");
        }
        return ((_a = this._config) !== null && _a !== void 0 ? _a : (this._config = JSON.parse((0, fs_1.readFileSync)(this.configPath, "utf8"))));
    }
    derivePath(path) {
        const cwd = process.cwd();
        return (0, path_1.join)(`${path ? ((0, path_1.isAbsolute)(path) ? path : (0, path_1.join)(cwd, path)) : cwd}`, "gylfie.json");
    }
    addToConfig(object) {
        this.config;
        (0, lodash_1.merge)(this._config, object);
        this.flush();
    }
    configExists() {
        try {
            return (0, fs_1.existsSync)(this.configPath);
        }
        catch (err) {
            switch (err.code) {
                case "ENOENT": {
                    return false;
                }
                default: {
                    return false;
                }
            }
        }
    }
    flush() {
        (0, fs_1.writeFileSync)(this.configPath, JSON.stringify(this.config, null, 4));
    }
}
exports.Context = Context;
