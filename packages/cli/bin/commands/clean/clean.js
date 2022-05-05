"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanCommand = void 0;
const tslib_1 = require("tslib");
const command_1 = require("../command");
const config_1 = require("../../config");
class CleanCommand extends command_1.GylfieCommand {
    constructor(props) {
        super();
        this.name = "Clean Command";
        this.flag = "clean";
        this.description = "Clean resource";
        this.options = props === null || props === void 0 ? void 0 : props.options;
        this.properties = [{ name: "resources..." }];
    }
    static clean(resources, options, command) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const context = this.getContext();
            const { configPath, cwd } = context;
            const { config } = context;
            try {
                if (context.configExists() && config && config.resources) {
                    if (resources) {
                        for (const resource of resources) {
                            const res = config.resources[resource];
                            if (res) {
                                this.cleanResource(resource, res, config, context, options);
                            }
                        }
                        return;
                    }
                    Object.entries(config.resources).forEach(([name, resource]) => {
                        this.cleanResource(name, resource, config, context, options);
                    });
                }
                this.uninitialized();
                return;
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    static cleanResource(name, resource, config, context, options) {
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
                case "mobile": {
                    console.log("call mobile clean");
                    yield new config_1.GylfieMobileApp(name).clean(request);
                    return;
                }
                default: {
                    console.log("Unsupported Type", type);
                }
            }
            return;
        });
    }
    action(...args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            CleanCommand.clean(...args);
        });
    }
}
exports.CleanCommand = CleanCommand;
