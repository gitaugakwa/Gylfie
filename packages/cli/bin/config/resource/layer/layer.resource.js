"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GylfieLayer = void 0;
const tslib_1 = require("tslib");
const inquirer_1 = require("inquirer");
const commands_1 = require("../../../commands");
const resource_1 = require("../resource");
const lodash_1 = require("lodash");
class GylfieLayer extends resource_1.GylfieResource {
    clean(request) {
        throw new Error("Method not implemented.");
    }
    build(request) {
        throw new Error("Method not implemented.");
    }
    start(request) {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super();
    }
    create(request, setup) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const prompt = (0, inquirer_1.createPromptModule)();
            const { context, options } = request;
            const { config } = context;
            let answers = { type: "layer" };
            const name = yield prompt([
                {
                    type: "input",
                    name: "name",
                    message: "Name of the Layer",
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
                        return `Path to the ${answers.type}: ${answers.name}`;
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
                        return `Runtime for the ${answers.type}: ${answers.name}`;
                    },
                    choices: resource_1.ResourceDefinition.layer.runtimes,
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
            const layer = {
                [answers.name]: {
                    type: answers.type,
                    stages: {},
                    properties: {
                        path: commands_1.GylfieCommand.getPath(undefined, answers),
                        startCommand: answers.startCommand,
                        runtime: answers.runtime,
                    },
                },
            };
            context.addToConfig({ resources: layer });
            return layer;
        });
    }
}
exports.GylfieLayer = GylfieLayer;
