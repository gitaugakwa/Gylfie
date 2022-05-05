"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCommand = void 0;
const tslib_1 = require("tslib");
const command_1 = require("../command");
const inquirer_1 = require("inquirer");
const config_1 = require("../../config");
class UpdateCommand extends command_1.GylfieCommand {
    constructor(props) {
        super();
        this.name = "Update Command";
        this.flag = "update";
        this.description = "Update resource of [type]";
        this.options = props === null || props === void 0 ? void 0 : props.options;
        this.properties = [{ name: "type" }, { name: "path" }];
    }
    static update(type, path, options, command) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const context = this.getContext(path);
            const { cwd, configPath } = context;
            try {
                if (context.configExists()) {
                    yield this.updatePrompt(context, options, type);
                    return;
                }
                this.uninitialized();
                return;
            }
            catch (err) {
                console.log("Unusual Error encountered during update");
                console.log(err);
            }
        });
    }
    static updatePrompt(context, options, type) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const prompt = (0, inquirer_1.createPromptModule)();
            const answers = yield prompt([
                {
                    type: "list",
                    name: "type",
                    message: "Type of instance being updated",
                    choices: Object.keys(config_1.ResourceDefinition),
                    default: "function",
                },
            ], Object.assign(Object.assign({}, options), { type }));
            const request = {
                context,
                options,
            };
            switch (answers.type) {
                case "database": {
                    yield new config_1.GylfieDatabase().update(request);
                    return;
                }
            }
            return;
        });
    }
    action(...args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            UpdateCommand.update(...args);
        });
    }
}
exports.UpdateCommand = UpdateCommand;
