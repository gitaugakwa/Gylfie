"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GylfieFunction = void 0;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const inquirer_1 = require("inquirer");
const commands_1 = require("../../../commands");
const resource_1 = require("../resource");
const lodash_1 = require("lodash");
class GylfieFunction extends resource_1.GylfieResource {
    constructor(name, resource) {
        super();
        this.name = name;
        this.resource = resource;
    }
    clean(request) {
        throw new Error("Method not implemented.");
    }
    build(request) {
        throw new Error("Method not implemented.");
    }
    start(request) {
        var _a, _b, _c;
        const { context, options } = request;
        const { config } = context;
        const { properties, stages } = (_a = this.resource) !== null && _a !== void 0 ? _a : {};
        const { globals } = config;
        if ((options === null || options === void 0 ? void 0 : options.stage) && stages) {
            (0, lodash_1.merge)(properties, stages[options.stage]);
        }
        const { path } = properties !== null && properties !== void 0 ? properties : {};
        console.log(`Starting Function: ${this.name} Stage: ${(_b = options === null || options === void 0 ? void 0 : options.stage) !== null && _b !== void 0 ? _b : "default"}`);
        const cmd = this.generateStartCommand("npm run start", properties, globals === null || globals === void 0 ? void 0 : globals.function, options);
        const command = commands_1.GylfieCommand.parseCommand(cmd.split(" ")[0]);
        const args = cmd.split(" ");
        args.shift();
        const instance = (0, child_process_1.spawn)(command, args, {
            cwd: path,
            detached: true,
            windowsHide: false,
            shell: true,
            stdio: "ignore",
        });
        instance.unref();
        console.log(`Started Function: ${this.name} Stage: ${(_c = options === null || options === void 0 ? void 0 : options.stage) !== null && _c !== void 0 ? _c : "default"}`);
    }
    create(request, setup) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const prompt = (0, inquirer_1.createPromptModule)();
            const { context, options } = request;
            const { config } = context;
            let answers = {
                type: "function",
                stage: options ? options["stage"] : undefined,
            };
            const name = yield prompt([
                {
                    type: "input",
                    name: "name",
                    message: "Name of the Function",
                },
            ]);
            (0, lodash_1.merge)(answers, name);
            if (config.resources &&
                config.resources[answers.name] &&
                !(options === null || options === void 0 ? void 0 : options.force)) {
                console.log("Resource already exists");
                return;
            }
            const properties = yield prompt([
                {
                    type: "input",
                    name: "path",
                    message: (answers) => {
                        return `Path to the ${answers.type}: ${answers.name}  ${answers.stage ? `Stage: ${answers.stage}` : ""}`;
                    },
                    default: commands_1.GylfieCommand.getPath(undefined, answers),
                    filter: (input, answers) => {
                        return commands_1.GylfieCommand.getPath(input, answers);
                    },
                },
                {
                    type: "list",
                    name: "runtime",
                    message: (answers) => {
                        return `Runtime for the ${answers.type}: ${answers.name}  ${answers.stage ? `Stage: ${answers.stage}` : ""}`;
                    },
                    choices: resource_1.ResourceDefinition.function.runtimes,
                },
                {
                    type: "input",
                    name: "handler",
                    message: (answers) => {
                        return `Path to the Handler function for the ${answers.type}: ${answers.name}  ${answers.stage ? `Stage: ${answers.stage}` : ""}`;
                    },
                    default: "dist/main.handler",
                },
                {
                    type: "input",
                    name: "startCommand",
                    message: (answers) => {
                        return `Start Command for the ${answers.type}: ${answers.name}  ${answers.stage ? `Stage: ${answers.stage}` : ""}`;
                    },
                    filter: (input, answers) => {
                        return input ? input : undefined;
                    },
                },
                {
                    type: "input",
                    name: "buildCommand",
                    message: (answers) => {
                        return `Build Command for the ${answers.type}: ${answers.name}  ${answers.stage ? `Stage: ${answers.stage}` : ""}`;
                    },
                    filter: (input, answers) => {
                        return input ? input : undefined;
                    },
                },
                {
                    type: "input",
                    name: "watchAppend",
                    message: (answers) => {
                        return `Watch Append for the ${answers.type}: ${answers.name}  ${answers.stage ? `Stage: ${answers.stage}` : ""}`;
                    },
                    filter: (input, answers) => {
                        return input ? input : undefined;
                    },
                },
            ], answers);
            (0, lodash_1.merge)(answers, properties);
            const func = {
                [answers.name]: {
                    type: answers.type,
                    stages: {},
                    properties: {
                        path: commands_1.GylfieCommand.getPath(undefined, answers),
                        startCommand: answers.startCommand,
                        handler: answers.handler,
                        runtime: answers.runtime,
                        buildCommand: answers.buildCommand,
                        watchAppend: answers.watchAppend,
                    },
                },
            };
            context.addToConfig({ resources: func });
            return func;
        });
    }
}
exports.GylfieFunction = GylfieFunction;
