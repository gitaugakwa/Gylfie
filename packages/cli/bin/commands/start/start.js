"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartCommand = void 0;
const tslib_1 = require("tslib");
const command_1 = require("../command");
const config_1 = require("../../config");
class StartCommand extends command_1.GylfieCommand {
    constructor(props) {
        super();
        this.name = "Start Command";
        this.flag = "start";
        this.description = "Starts Gylfie Resources";
        this.options = props === null || props === void 0 ? void 0 : props.options;
        this.properties = [{ name: "resources..." }];
    }
    static spawn() {
        console.log("Spawning");
    }
    static start(resources, options, command) {
        const context = this.getContext();
        const { configPath, cwd } = context;
        try {
            if (context.configExists()) {
                const { config } = context;
                if (config.resources) {
                    if (resources) {
                        resources.forEach((resource) => {
                            if (config.resources) {
                                const res = config.resources[resource];
                                if (res) {
                                    this.startResource(context, res, options, resource);
                                }
                                return;
                            }
                        });
                        return;
                    }
                    Object.entries(config.resources).forEach(([name, res]) => {
                        this.startResource(context, res, options, name);
                    });
                }
                this.spawn();
                return;
            }
            this.uninitialized();
            return;
        }
        catch (err) {
            console.log(err);
        }
    }
    static startResource(context, resource, options, name) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const request = {
                context,
                options,
            };
            const { type } = resource;
            switch (type) {
                case "function": {
                    yield new config_1.GylfieFunction(name, resource).start(request);
                    return;
                }
                case "database": {
                    try {
                        yield new config_1.GylfieDatabase(name, resource).start(request);
                    }
                    catch (err) {
                        console.log(err);
                    }
                    return;
                }
                case "service": {
                    yield new config_1.GylfieService(name, resource).start(request);
                    return;
                }
                case "mobile": {
                    yield new config_1.GylfieMobileApp(name, resource).start(request);
                    return;
                }
            }
        });
    }
    action(...args) {
        StartCommand.start(...args);
    }
    static generateStartCommand(defaultBuildCommand, props, globals, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (options === null || options === void 0 ? void 0 : options.watch) {
            return ((_c = (_b = (_a = props === null || props === void 0 ? void 0 : props.startCommand) !== null && _a !== void 0 ? _a : globals === null || globals === void 0 ? void 0 : globals.startCommand) !== null && _b !== void 0 ? _b : defaultBuildCommand) !== null && _c !== void 0 ? _c : "npm run start").concat((_e = (_d = props === null || props === void 0 ? void 0 : props.watchAppend) !== null && _d !== void 0 ? _d : globals === null || globals === void 0 ? void 0 : globals.watchAppend) !== null && _e !== void 0 ? _e : ":watch");
        }
        return ((_h = (_g = (_f = props === null || props === void 0 ? void 0 : props.startCommand) !== null && _f !== void 0 ? _f : globals === null || globals === void 0 ? void 0 : globals.startCommand) !== null && _g !== void 0 ? _g : defaultBuildCommand) !== null && _h !== void 0 ? _h : "npm run start");
    }
}
exports.StartCommand = StartCommand;
