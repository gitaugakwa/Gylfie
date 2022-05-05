"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionFactory = void 0;
const commander_1 = require("commander");
const factory_1 = require("../factory");
class OptionFactory extends factory_1.Factory {
    constructor(program) {
        super();
        this.program = program;
    }
    add(...options) {
        options.forEach((option) => {
            const parsedOption = this.parseOption(option);
            this.program.addOption(parsedOption);
        });
        return this;
    }
    parseOption(opt) {
        const option = new commander_1.Option(this.parseOptionFlag(opt), opt.description);
        if (opt.default) {
            if (typeof opt.default == "object") {
                const { value, description } = opt.default;
                option.default(value, description);
            }
            else {
                option.default(opt.default);
            }
        }
        option.makeOptionMandatory(opt.required);
        if (opt.help == false) {
            option.hideHelp();
        }
        if (opt.choices) {
            option.choices(opt.choices);
        }
        return option;
    }
    parseOptionFlag(prop) {
        return `-${prop.flag}${prop.alias ? `, --${prop.alias}` : ""}${prop.properties
            ? ` ${prop.properties
                .map((property) => this.parseProperty(property))
                .join(" ")}`
            : ""}`;
    }
}
exports.OptionFactory = OptionFactory;
