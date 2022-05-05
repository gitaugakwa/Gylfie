"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceCommand = void 0;
const tslib_1 = require("tslib");
const command_1 = require("../command");
const config_1 = require("../../config");
const inquirer_1 = require("inquirer");
class ResourceCommand extends command_1.GylfieCommand {
    constructor(props) {
        super();
        this.name = "Resource Command";
        this.flag = "G";
        this.alias = "resource";
        this.description = "Set Resource properties for an Gylfie Resource";
        this.properties = [
            { name: "name" },
            { name: "property" },
            { name: "value" },
        ];
    }
    static resource(name, property, value, options, command) {
        const context = this.getContext();
        const { configPath, cwd } = context;
        try {
            if (context.configExists()) {
                if (!name) {
                    this.namePrompt(context);
                }
                if (name && property && value) {
                }
                return;
            }
            this.uninitialized();
            return;
        }
        catch (err) {
            console.log(err);
        }
    }
    static prompt(type) { }
    static namePrompt(context) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const prompt = (0, inquirer_1.createPromptModule)();
            if (context.config.resources) {
                const answers = yield prompt([
                    {
                        type: "list",
                        name: "name",
                        message: "Name of the resource",
                        choices: [
                            ...Object.keys(context.config.resources),
                            "New resource",
                        ],
                        default: "New resource",
                    },
                ]);
                if (answers.name == "New resource") {
                    this.createResourcePrompt(context);
                }
                return answers;
            }
            return this.createResourcePrompt(context);
        });
    }
    static createResourcePrompt(context) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const prompt = (0, inquirer_1.createPromptModule)();
            const answers = yield prompt([
                {
                    type: "input",
                    name: "name",
                    message: "Name of the resource",
                },
                {
                    type: "list",
                    name: "type",
                    message: "Type of the resource",
                    choices: Object.keys(config_1.ResourceDefinition),
                },
            ]);
            const mod = {
                [answers.name]: {
                    type: answers.type,
                    stages: {},
                    properties: {
                        path: this.getPath(undefined, answers),
                    },
                },
            };
            return answers;
        });
    }
    action(...args) {
        ResourceCommand.resource(...args);
    }
}
exports.ResourceCommand = ResourceCommand;
