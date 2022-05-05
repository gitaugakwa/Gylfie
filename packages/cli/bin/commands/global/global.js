"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalCommand = void 0;
const command_1 = require("../command");
class GlobalCommand extends command_1.GylfieCommand {
    constructor(props) {
        super();
        this.name = "Global Command";
        this.flag = "G";
        this.alias = "global";
        this.description = "Set global properties for Gylfie Resources";
        this.properties = [
            { name: "type" },
            { name: "property" },
            { name: "value" },
        ];
    }
    static global(type, property, value, options, command) {
        const context = this.getContext();
        const { configPath, cwd } = context;
        try {
            if (context.configExists()) {
                if (type && property && value) {
                    context.addToConfig({
                        globals: {
                            [type]: {
                                [property]: value,
                            },
                        },
                    });
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
    action(...args) {
        GlobalCommand.global(...args);
    }
}
exports.GlobalCommand = GlobalCommand;
