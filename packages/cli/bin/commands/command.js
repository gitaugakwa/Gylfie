"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandFactory = exports.GylfieCommand = void 0;
const commander_1 = require("commander");
const options_1 = require("../options");
const factory_1 = require("../factory");
const path_1 = require("path");
const config_1 = require("../config");
class GylfieCommand {
    static derivePath(path) {
        const cwd = process.cwd();
        return (0, path_1.join)(`${path ? ((0, path_1.isAbsolute)(path) ? path : (0, path_1.join)(cwd, path)) : cwd}`, "gylfie.json");
    }
    static getPath(path, answers) {
        var _a;
        const cwd = process.cwd();
        if (path) {
            return (0, path_1.isAbsolute)(path) ? path : (0, path_1.join)(cwd, path);
        }
        if (answers) {
            return (0, path_1.join)(cwd, config_1.ResourceDefinition[answers.type].folder, answers.name, (_a = answers.stage) !== null && _a !== void 0 ? _a : "");
        }
        return "";
    }
    static getContext(path) {
        try {
            return new config_1.Context(path);
        }
        catch (err) {
            console.log("Problem deriving Gylfie context");
            throw new Error("Unable to derive context");
        }
    }
    static parseCommand(cmd) {
        switch (cmd) {
            case "npm": {
                return /^win/.test(process.platform) ? "npm.cmd" : "npm";
            }
            default: {
                return cmd;
                throw new Error("Unsupported command");
            }
        }
    }
    static addCommand(original, command) {
        return original.concat(` && ${command}`);
    }
    static uninitialized() {
        console.log("Gylfie configuration does not exist");
        return;
    }
}
exports.GylfieCommand = GylfieCommand;
class CommandFactory extends factory_1.Factory {
    constructor(program) {
        super();
        this.program = program;
    }
    add(...coms) {
        coms.forEach((com) => {
            const command = (0, commander_1.createCommand)(com.flag);
            command.arguments(this.parseCommandFlag(com)).action(com.action);
            if (com.alias) {
                command.alias(com.alias);
            }
            if (com.description) {
                command.description(com.description);
            }
            if (com.options) {
                const optionFactory = new options_1.OptionFactory(command);
                optionFactory.add(...com.options);
            }
            this.program.addCommand(command);
        });
        return this;
    }
    parseCommandFlag(prop) {
        var _a;
        return ((_a = prop.properties) !== null && _a !== void 0 ? _a : [])
            .map((property) => this.parseProperty(property))
            .join(" ");
    }
}
exports.CommandFactory = CommandFactory;
