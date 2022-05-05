"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildCommand = void 0;
const tslib_1 = require("tslib");
const command_1 = require("../command");
const child_process_1 = require("child_process");
const config_1 = require("../../config");
class BuildCommand extends command_1.GylfieCommand {
    constructor(props) {
        super();
        this.name = "Build Command";
        this.flag = "build";
        this.description = "Builds Gylfie Resources";
        this.options = props === null || props === void 0 ? void 0 : props.options;
        this.properties = [{ name: "resources..." }];
    }
    static spawn() {
        console.log("Spawning");
    }
    static build(resources, options, command) {
        const context = this.getContext();
        const { configPath, cwd } = context;
        const { config } = context;
        try {
            if (context.configExists() && config && config.resources) {
                if (resources) {
                    for (const resource of resources) {
                        const res = config.resources[resource];
                        if (res) {
                            this.buildResource(resource, res, config, context, options);
                        }
                    }
                    return;
                }
                Object.entries(config.resources).forEach(([name, resource]) => {
                    this.buildResource(name, resource, config, context, options);
                });
            }
            this.uninitialized();
            return;
        }
        catch (err) {
            console.log(err);
        }
    }
    static buildResource(name, resource, config, context, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (resource.type == "database") {
                const {} = resource;
            }
            const { type, properties, stages } = resource;
            const { globals } = config;
            const request = {
                context,
                options,
            };
            switch (type) {
                case "function": {
                    const props = properties;
                    console.log(`Building ${name} Function`);
                    const cmd = this.generateBuildCommand("npm run build", props, globals === null || globals === void 0 ? void 0 : globals.function, options);
                    const command = this.parseCommand(cmd.split(" ")[0]);
                    const args = cmd.split(" ");
                    args.shift();
                    const instance = (0, child_process_1.spawn)(command, args, {
                        cwd: props.path,
                        detached: true,
                        windowsHide: false,
                        shell: true,
                        stdio: "ignore",
                    });
                    instance.unref();
                    console.log(`${name} Built`);
                    return;
                }
                case "layer": {
                    const props = properties;
                    console.log(`Building ${name} Service`);
                    const cmd = this.generateBuildCommand("npm run build", props, globals === null || globals === void 0 ? void 0 : globals.layer, options);
                    const command = this.parseCommand(cmd.split(" ")[0]);
                    const args = cmd.split(" ");
                    args.shift();
                    const instance = (0, child_process_1.spawn)(command, args, {
                        cwd: props.path,
                        detached: true,
                        windowsHide: false,
                        shell: true,
                        stdio: "ignore",
                    });
                    instance.unref();
                    console.log(`${name} Built`);
                }
                case "mobile": {
                    yield new config_1.GylfieMobileApp(name).build(request);
                    return;
                }
            }
        });
    }
    action(...args) {
        BuildCommand.build(...args);
    }
    static generateBuildCommand(defaultBuildCommand, props, globals, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (options === null || options === void 0 ? void 0 : options.watch) {
            return ((_c = (_b = (_a = props === null || props === void 0 ? void 0 : props.buildCommand) !== null && _a !== void 0 ? _a : globals === null || globals === void 0 ? void 0 : globals.buildCommand) !== null && _b !== void 0 ? _b : defaultBuildCommand) !== null && _c !== void 0 ? _c : "npm run build").concat((_e = (_d = props === null || props === void 0 ? void 0 : props.watchAppend) !== null && _d !== void 0 ? _d : globals === null || globals === void 0 ? void 0 : globals.watchAppend) !== null && _e !== void 0 ? _e : ":watch");
        }
        return ((_h = (_g = (_f = props === null || props === void 0 ? void 0 : props.buildCommand) !== null && _f !== void 0 ? _f : globals === null || globals === void 0 ? void 0 : globals.buildCommand) !== null && _g !== void 0 ? _g : defaultBuildCommand) !== null && _h !== void 0 ? _h : "npm run build");
    }
}
exports.BuildCommand = BuildCommand;
