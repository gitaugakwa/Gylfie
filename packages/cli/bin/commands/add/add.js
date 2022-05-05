"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCommand = void 0;
const tslib_1 = require("tslib");
const command_1 = require("../command");
const inquirer_1 = require("inquirer");
const config_1 = require("../../config");
class AddCommand extends command_1.GylfieCommand {
    constructor(props) {
        super();
        this.name = "Add Command";
        this.flag = "add";
        this.description = "Add resource of [type]";
        this.options = props === null || props === void 0 ? void 0 : props.options;
        this.properties = [{ name: "type" }, { name: "path" }];
    }
    static add(type, path, options, command) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const context = this.getContext(path);
            const { cwd, configPath } = context;
            try {
                if (context.configExists()) {
                    yield this.addPrompt(context, options, type);
                    return;
                }
                this.uninitialized();
                return;
            }
            catch (err) {
                console.log("Unusual Error encountered during add");
                console.log(err);
            }
        });
    }
    static addPrompt(context, options, type) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const prompt = (0, inquirer_1.createPromptModule)();
            const answers = yield prompt([
                {
                    type: "list",
                    name: "type",
                    message: "Type of instance being added",
                    choices: Object.keys(config_1.ResourceDefinition),
                    default: "function",
                },
            ], Object.assign(Object.assign({}, options), { type }));
            const request = {
                context,
                options,
            };
            switch (answers.type) {
                case "service": {
                    yield new config_1.GylfieService().create(request);
                    return;
                }
                case "function": {
                    yield new config_1.GylfieFunction().create(request);
                    return;
                }
                case "layer": {
                    yield new config_1.GylfieLayer().create(request);
                    return;
                }
                case "database": {
                    yield new config_1.GylfieDatabase().create(request);
                    return;
                }
                case "mobile": {
                    yield new config_1.GylfieMobileApp().create(request);
                    return;
                }
                default: {
                    console.log("Unsupported Type", answers.type);
                }
            }
            return;
        });
    }
    action(...args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            AddCommand.add(...args);
        });
    }
}
exports.AddCommand = AddCommand;
