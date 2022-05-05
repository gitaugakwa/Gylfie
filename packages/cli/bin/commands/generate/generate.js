"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateCommand = void 0;
const command_1 = require("../command");
const child_process_1 = require("child_process");
class GenerateCommand extends command_1.GylfieCommand {
    constructor(props) {
        super();
        this.name = "Generate Command";
        this.flag = "g";
        this.alias = "generate";
        this.description = "Generate new Gylfie Resource";
        this.properties = [{ name: "type" }, { name: "path" }];
    }
    static generate(type, path, options, command) {
        const context = this.getContext();
        const { cwd, configPath } = context;
        try {
            if (context.configExists()) {
                (0, child_process_1.spawn)("");
                return;
            }
            this.uninitialized();
            return;
        }
        catch (err) {
            console.log(err);
        }
    }
    action(...args) {
        GenerateCommand.generate(...args);
    }
}
exports.GenerateCommand = GenerateCommand;
