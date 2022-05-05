"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GylfieService = exports.IncludedServices = void 0;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const inquirer_1 = require("inquirer");
const path_1 = require("path");
const commands_1 = require("../../../commands");
const resource_1 = require("../resource");
const lodash_1 = require("lodash");
exports.IncludedServices = {
    "cognito-local": {
        startCommand: "npx cognito-local",
        package: {
            name: "cognito-local",
            version: "1.0.0",
            description: "Local Cognito Service",
            scripts: {
                start: "npx cognito-local",
            },
            dependencies: {
                "cognito-local": "^2.1.0",
            },
        },
    },
};
class GylfieService extends resource_1.GylfieResource {
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { context, options } = request;
            const { config } = context;
            const { globals } = config;
            const { properties, stages } = (_a = this.resource) !== null && _a !== void 0 ? _a : {};
            if ((options === null || options === void 0 ? void 0 : options.stage) && stages) {
                (0, lodash_1.merge)(properties, stages[options.stage]);
            }
            const { path } = properties !== null && properties !== void 0 ? properties : {};
            console.log(`Starting Service: ${this.name} Stage: ${(_b = options === null || options === void 0 ? void 0 : options.stage) !== null && _b !== void 0 ? _b : "default"}`);
            const cmd = this.generateStartCommand("npm run start", properties, globals === null || globals === void 0 ? void 0 : globals.service, options);
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
            console.log(`Started Service: ${this.name} Stage: ${(_c = options === null || options === void 0 ? void 0 : options.stage) !== null && _c !== void 0 ? _c : "default"}`);
        });
    }
    create(request, setup) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { context, options } = request;
            const { config } = context;
            const prompt = (0, inquirer_1.createPromptModule)();
            let answers = { type: "service" };
            const name = yield prompt([
                {
                    type: "list",
                    name: "serviceName",
                    message: "Choose an available service",
                    choices: [...Object.keys(exports.IncludedServices), "New service"],
                    filter: (input, answers) => {
                        if (input != "New Service") {
                            answers.name = input;
                        }
                    },
                },
                {
                    type: "input",
                    name: "name",
                    message: (answers) => {
                        return `Name of the ${answers.type}`;
                    },
                },
            ]);
            (0, lodash_1.merge)(answers, name);
            if (config.resources &&
                config.resources[answers.name] &&
                !(options === null || options === void 0 ? void 0 : options.force)) {
                console.log("Resource already exists");
                return;
            }
            if (Object.keys(exports.IncludedServices).includes(answers.name)) {
                yield this.initializeIncludedService(answers.name, exports.IncludedServices[answers.name], {
                    path: commands_1.GylfieCommand.getPath(undefined, answers),
                });
                const service = {
                    [answers.name]: {
                        type: answers.type,
                        stages: {},
                        properties: {
                            path: commands_1.GylfieCommand.getPath(undefined, answers),
                            startCommand: exports.IncludedServices[answers.name].startCommand,
                        },
                    },
                };
                context.addToConfig({ resources: service });
                return service;
            }
            const properties = yield prompt([
                {
                    type: "input",
                    name: "path",
                    message: (answers) => {
                        return `Path to the ${answers.type}: ${answers.name}`;
                    },
                    default: commands_1.GylfieCommand.getPath(undefined, answers),
                    filter: (input, answers) => {
                        return commands_1.GylfieCommand.getPath(input, answers);
                    },
                },
                {
                    type: "input",
                    name: "startCommand",
                    message: (answers) => {
                        return `Start Command for the ${answers.type}: ${answers.name}`;
                    },
                    filter: (input, answers) => {
                        return input ? input : undefined;
                    },
                },
            ], answers);
            (0, lodash_1.merge)(answers, properties);
            const service = {
                [answers.name]: {
                    type: answers.type,
                    stages: {},
                    properties: {
                        path: commands_1.GylfieCommand.getPath(undefined, answers),
                        startCommand: answers.startCommand,
                    },
                },
            };
            context.addToConfig({ resources: service });
            return service;
        });
    }
    initializeIncludedService(name, service, config) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            switch (name) {
                case "cognito-local": {
                    try {
                        (0, fs_1.mkdirSync)(config.path, { recursive: true });
                    }
                    catch (err) {
                        switch (err.code) {
                            case "EEXIST": {
                                return;
                            }
                            default: {
                                console.log(`Unexpected Error: Make Directory for Service: ${name}`, err, config);
                            }
                        }
                    }
                    try {
                        (0, fs_1.writeFileSync)((0, path_1.join)(config.path, "package.json"), JSON.stringify(service.package, null, 4));
                    }
                    catch (err) {
                        console.log(`Unexpected Error: Write File Package for Service: ${name}`, err, config);
                    }
                    try {
                        const command = commands_1.GylfieCommand.parseCommand("npm");
                        (0, child_process_1.spawnSync)(command, ["i"], { cwd: config.path });
                    }
                    catch (err) {
                        console.log(`Unexpected Error: npm install for Service: ${name}`, err, config);
                    }
                    config.startCommand = "npx cognito-local";
                }
            }
        });
    }
}
exports.GylfieService = GylfieService;
