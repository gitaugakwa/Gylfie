"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitializeCommand = void 0;
const tslib_1 = require("tslib");
const fs_1 = require("fs");
const command_1 = require("../command");
const options_1 = require("../../options");
const inquirer_1 = require("inquirer");
class InitializeCommand extends command_1.GylfieCommand {
    constructor(props) {
        super();
        this.name = "Initialize Command";
        this.flag = "init";
        this.description = "Initializes the Gylfie CLI";
        this.alias = "initialize";
        this.options = props === null || props === void 0 ? void 0 : props.options;
        this.properties = [{ name: "path" }];
    }
    static initialize(path, options, command) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const context = this.getContext(path);
            const { cwd, configPath } = context;
            try {
                if (context.configExists()) {
                    if (options === null || options === void 0 ? void 0 : options.force) {
                        const answers = yield this.prompt(options);
                        const config = {
                            developer: answers.developer,
                            name: answers.name,
                            package: answers.packageManager,
                        };
                        (0, fs_1.writeFileSync)(configPath, JSON.stringify(config, null, 4));
                        return;
                    }
                    this.uninitialized();
                    return;
                }
                const answers = yield this.prompt(options);
                const config = {
                    name: answers.name,
                    developer: answers.developer,
                    package: answers.packageManager,
                };
                (0, fs_1.writeFileSync)(configPath, JSON.stringify(config, null, 4));
                return;
            }
            catch (err) {
                console.log("Unusual Error encountered during initialization");
                console.log(err);
            }
        });
    }
    static prompt(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const prompt = (0, inquirer_1.createPromptModule)();
            const packageOpt = new options_1.PackageOption();
            const answers = yield prompt([
                {
                    type: "input",
                    name: "name",
                    message: "Name of the application",
                },
                {
                    type: "input",
                    name: "developer",
                    message: "Developer of the application",
                },
                {
                    type: "list",
                    name: "packageManager",
                    message: "Select your current package manager",
                    choices: packageOpt.choices,
                    default: packageOpt.default,
                    when: (answer) => {
                        return answer.packageManager ? false : true;
                    },
                },
            ], Object.assign({}, options));
            return answers;
        });
    }
    action(...args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            InitializeCommand.initialize(...args);
        });
    }
}
exports.InitializeCommand = InitializeCommand;
