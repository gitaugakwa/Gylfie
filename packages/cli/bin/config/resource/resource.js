"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourcePath = exports.GylfieResource = exports.ResourceDefinition = void 0;
const path_1 = require("path");
exports.ResourceDefinition = {
    function: {
        folder: "Functions",
        runtimes: ["nodejs12.x", "nodejs14.x"],
    },
    database: { folder: "Databases" },
    layer: { folder: "Layers", runtimes: ["nodejs12.x", "nodejs14.x"] },
    service: {
        folder: "Services",
    },
    bucket: {
        folder: "Buckets",
    },
    mobile: {
        folder: "Mobile",
    },
};
class GylfieResource {
    generateStartCommand(defaultBuildCommand, props, globals, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (options === null || options === void 0 ? void 0 : options.watch) {
            return ((_c = (_b = (_a = props === null || props === void 0 ? void 0 : props.startCommand) !== null && _a !== void 0 ? _a : globals === null || globals === void 0 ? void 0 : globals.startCommand) !== null && _b !== void 0 ? _b : defaultBuildCommand) !== null && _c !== void 0 ? _c : "npm run start").concat((_e = (_d = props === null || props === void 0 ? void 0 : props.watchAppend) !== null && _d !== void 0 ? _d : globals === null || globals === void 0 ? void 0 : globals.watchAppend) !== null && _e !== void 0 ? _e : ":watch");
        }
        return ((_h = (_g = (_f = props === null || props === void 0 ? void 0 : props.startCommand) !== null && _f !== void 0 ? _f : globals === null || globals === void 0 ? void 0 : globals.startCommand) !== null && _g !== void 0 ? _g : defaultBuildCommand) !== null && _h !== void 0 ? _h : "npm run start");
    }
    generateBuildCommand(defaultBuildCommand, props, globals, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (options === null || options === void 0 ? void 0 : options.watch) {
            return ((_c = (_b = (_a = props === null || props === void 0 ? void 0 : props.buildCommand) !== null && _a !== void 0 ? _a : globals === null || globals === void 0 ? void 0 : globals.buildCommand) !== null && _b !== void 0 ? _b : defaultBuildCommand) !== null && _c !== void 0 ? _c : "npm run build").concat((_e = (_d = props === null || props === void 0 ? void 0 : props.watchAppend) !== null && _d !== void 0 ? _d : globals === null || globals === void 0 ? void 0 : globals.watchAppend) !== null && _e !== void 0 ? _e : ":watch");
        }
        return ((_h = (_g = (_f = props === null || props === void 0 ? void 0 : props.buildCommand) !== null && _f !== void 0 ? _f : globals === null || globals === void 0 ? void 0 : globals.buildCommand) !== null && _g !== void 0 ? _g : defaultBuildCommand) !== null && _h !== void 0 ? _h : "npm run build");
    }
    generateCleanCommand(defaultBuildCommand, props, globals, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (options === null || options === void 0 ? void 0 : options.watch) {
            return ((_c = (_b = (_a = props === null || props === void 0 ? void 0 : props.buildCommand) !== null && _a !== void 0 ? _a : globals === null || globals === void 0 ? void 0 : globals.buildCommand) !== null && _b !== void 0 ? _b : defaultBuildCommand) !== null && _c !== void 0 ? _c : "npm run clean").concat((_e = (_d = props === null || props === void 0 ? void 0 : props.watchAppend) !== null && _d !== void 0 ? _d : globals === null || globals === void 0 ? void 0 : globals.watchAppend) !== null && _e !== void 0 ? _e : ":watch");
        }
        return ((_h = (_g = (_f = props === null || props === void 0 ? void 0 : props.buildCommand) !== null && _f !== void 0 ? _f : globals === null || globals === void 0 ? void 0 : globals.buildCommand) !== null && _g !== void 0 ? _g : defaultBuildCommand) !== null && _h !== void 0 ? _h : "npm run clean");
    }
}
exports.GylfieResource = GylfieResource;
exports.resourcePath = (0, path_1.join)(__dirname, "../../resources");
