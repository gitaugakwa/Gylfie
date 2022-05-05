"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GylfieDatabase = exports.DatabaseDefinition = void 0;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const inquirer_1 = require("inquirer");
const path_1 = require("path");
const commands_1 = require("../../../commands");
const resource_1 = require("../resource");
const lodash_1 = require("lodash");
const fs_2 = require("fs");
const axios_1 = tslib_1.__importDefault(require("axios"));
const https_1 = require("https");
const cli_progress_1 = require("cli-progress");
const adm_zip_1 = tslib_1.__importDefault(require("adm-zip"));
console.log(resource_1.resourcePath);
const databasePath = (0, path_1.join)(resource_1.resourcePath, "databases");
exports.DatabaseDefinition = {
    dynamodb: {
        path: (0, path_1.join)(databasePath, "dynamoDB"),
        startCommand: `java -D"java.library.path=./DynamoDBLocal_lib" -jar DynamoDBLocal.jar {{options}}`,
    },
};
class GylfieDatabase extends resource_1.GylfieResource {
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
    create(request, setup) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const prompt = (0, inquirer_1.createPromptModule)();
            const { context, options } = request;
            const { config } = context;
            let answers = {
                type: "database",
                stage: options ? options["stage"] : undefined,
            };
            const name = yield prompt([
                {
                    type: "input",
                    name: "name",
                    message: "Name of the Database",
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
                        return `Path to the ${answers.type}: ${answers.name} ${answers.stage ? `Stage: ${answers.stage}` : ""}`;
                    },
                    default: commands_1.GylfieCommand.getPath(undefined, answers),
                    filter: (input, answers) => {
                        return commands_1.GylfieCommand.getPath(input, answers);
                    },
                },
                {
                    type: "list",
                    name: "databaseType",
                    message: (answers) => {
                        return `Database type for the ${answers.type}: ${answers.name} ${answers.stage ? `Stage: ${answers.stage}` : ""}`;
                    },
                    choices: Object.keys(exports.DatabaseDefinition),
                    default: "dynamodb",
                    filter: (input, answers) => {
                        return input ? input : undefined;
                    },
                },
                {
                    type: "input",
                    name: "port",
                    message: (answers) => {
                        return `Port for the ${answers.type}: ${answers.name} ${answers.stage ? `Stage: ${answers.stage}` : ""}`;
                    },
                    filter: (input, answers) => {
                        return input ? input : undefined;
                    },
                },
                {
                    type: "confirm",
                    name: "sharedDb",
                    default: true,
                    message: (answers) => {
                        return `Is the ${answers.type}: ${answers.name} ${answers.stage ? `Stage: ${answers.stage}` : ""} shared?`;
                    },
                    filter: (input, answers) => {
                        return input ? input : undefined;
                    },
                },
            ], answers);
            (0, lodash_1.merge)(answers, properties);
            const props = {
                path: commands_1.GylfieCommand.getPath(answers.path, answers),
                startCommand: answers.startCommand,
                type: answers.databaseType,
                port: answers.port,
                sharedDb: answers.sharedDb,
            };
            switch (answers.databaseType) {
                case "dynamodb": {
                    const client = axios_1.default.create({
                        baseURL: "https://s3.eu-central-1.amazonaws.com",
                        timeout: 30000,
                    });
                    const dynamoPath = (0, path_1.join)(databasePath, "dynamoDB");
                    const zipPath = (0, path_1.join)(dynamoPath, "src/dynamodb_local_latest.zip");
                    try {
                        if (!(0, fs_2.existsSync)(zipPath)) {
                            console.log("Downloading Local DynamoDB");
                            (0, fs_1.mkdirSync)((0, path_1.dirname)(zipPath), { recursive: true });
                            const progBar = new cli_progress_1.SingleBar({ etaBuffer: 100 }, cli_progress_1.Presets.shades_grey);
                            const data = yield download("https://s3.eu-central-1.amazonaws.com/dynamodb-local-frankfurt/dynamodb_local_latest.zip", zipPath, {
                                start: (total) => {
                                    progBar.start(total, 0);
                                },
                                update: (added) => {
                                    progBar.increment(added);
                                },
                            });
                            progBar.stop();
                        }
                    }
                    catch (err) {
                        console.log(err);
                        throw err;
                    }
                    if (!(0, fs_2.existsSync)((0, path_1.join)(dynamoPath, "DynamoDBLocal.jar"))) {
                        console.log("Unzipping DynamoDB Emulator");
                        const dbZip = new adm_zip_1.default(zipPath);
                        dbZip.extractAllTo(dynamoPath, true);
                        console.log("Unzipping complete");
                    }
                    break;
                }
            }
            (0, fs_1.mkdirSync)(props.path);
            if (answers.stage) {
                const stage = {
                    [answers.name]: {
                        type: answers.type,
                        stages: { [answers.stage]: props },
                        properties: {},
                    },
                };
                context.addToConfig({
                    resources: stage,
                });
                return stage;
            }
            else {
                const database = {
                    [answers.name]: {
                        type: answers.type,
                        stages: {},
                        properties: props,
                    },
                };
                context.addToConfig({ resources: database });
                return database;
            }
        });
    }
    update(request) {
        var _a;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { context, options } = request;
            const { config } = context;
            const { resources } = config;
            const updated = {};
            const databaseRes = Object.values(resources !== null && resources !== void 0 ? resources : {}).filter(({ type }) => type == "database");
            for (const { properties, stages } of databaseRes) {
                const type = (_a = properties.type) !== null && _a !== void 0 ? _a : Object.values(stages)[0].type;
                if (!updated[type]) {
                    switch (type) {
                        case "dynamodb": {
                            const client = axios_1.default.create({
                                baseURL: "https://s3.eu-central-1.amazonaws.com",
                                timeout: 30000,
                            });
                            const dynamoPath = (0, path_1.join)(databasePath, "dynamoDB");
                            const zipPath = (0, path_1.join)(dynamoPath, "src/dynamodb_local_latest.zip");
                            try {
                                if (!(0, fs_2.existsSync)(zipPath)) {
                                    console.log("Downloading Local DynamoDB");
                                    (0, fs_1.mkdirSync)((0, path_1.dirname)(zipPath), {
                                        recursive: true,
                                    });
                                    const progBar = new cli_progress_1.SingleBar({ etaBuffer: 100 }, cli_progress_1.Presets.shades_grey);
                                    const data = yield download("https://s3.eu-central-1.amazonaws.com/dynamodb-local-frankfurt/dynamodb_local_latest.zip", zipPath, {
                                        start: (total) => {
                                            progBar.start(total, 0);
                                        },
                                        update: (added) => {
                                            progBar.increment(added);
                                        },
                                    });
                                    progBar.stop();
                                }
                            }
                            catch (err) {
                                console.log(err);
                                throw err;
                            }
                            if (!(0, fs_2.existsSync)((0, path_1.join)(dynamoPath, "DynamoDBLocal.jar"))) {
                                console.log("Unzipping DynamoDB Emulator");
                                const dbZip = new adm_zip_1.default(zipPath);
                                dbZip.extractAllTo(dynamoPath, true);
                                console.log("Unzipping complete");
                            }
                            break;
                        }
                    }
                }
                updated[type] = true;
            }
        });
    }
    start(request) {
        var _a, _b, _c, _d;
        const { context, options } = request;
        const { config } = context;
        const { globals } = config;
        const { properties, stages } = (_a = this.resource) !== null && _a !== void 0 ? _a : {};
        if ((options === null || options === void 0 ? void 0 : options.stage) && stages) {
            (0, lodash_1.merge)(properties, stages[options.stage]);
        }
        console.log(`Starting Database: ${this.name} Stage: ${(_b = options === null || options === void 0 ? void 0 : options.stage) !== null && _b !== void 0 ? _b : "default"}`);
        const cmd = this.getStartCommand(properties);
        console.log(cmd);
        console.log(this.generateWorkingDir(properties));
        const args = cmd.split(" ");
        const command = args[0];
        args.shift();
        const instance = (0, child_process_1.spawn)(command, args, {
            cwd: this.generateWorkingDir(properties),
            detached: true,
            windowsHide: false,
            shell: properties
                ? (_c = exports.DatabaseDefinition[properties.type].shell) !== null && _c !== void 0 ? _c : true
                : true,
            stdio: "ignore",
        });
        instance.unref();
        if (options === null || options === void 0 ? void 0 : options.watch) {
        }
        console.log(`Started Database: ${this.name} Stage: ${(_d = options === null || options === void 0 ? void 0 : options.stage) !== null && _d !== void 0 ? _d : "default"}`);
    }
    generateWorkingDir(properties) {
        if (properties === null || properties === void 0 ? void 0 : properties.type) {
            return exports.DatabaseDefinition[properties.type].path;
        }
        throw new Error("Error while generating working directory.");
    }
    getStartCommand(properties) {
        if (properties === null || properties === void 0 ? void 0 : properties.type) {
            const startCommand = exports.DatabaseDefinition[properties === null || properties === void 0 ? void 0 : properties.type].startCommand;
            if (startCommand) {
                return this.replacePlaceholders(startCommand, properties);
            }
            throw new Error("Database does not have a type.");
        }
        throw new Error("Database type is not supported.");
    }
    replacePlaceholders(command, properties) {
        switch (properties === null || properties === void 0 ? void 0 : properties.type) {
            case "dynamodb": {
                return command.replace(/{{(\w+)}}/g, (match, value) => {
                    switch (value) {
                        case "options": {
                            return Object.entries({
                                port: properties === null || properties === void 0 ? void 0 : properties.port,
                                dbPath: `"${properties === null || properties === void 0 ? void 0 : properties.path}"`,
                                sharedDb: properties === null || properties === void 0 ? void 0 : properties.sharedDb,
                            })
                                .filter(([name, value]) => typeof value != "undefined")
                                .flatMap(([name, value]) => [`-${name}`, value])
                                .join(" ");
                        }
                        default: {
                            return "";
                        }
                    }
                });
            }
            case undefined: {
                throw new Error("Database does not have a type.");
            }
            default: {
                throw new Error("Database type is not supported.");
            }
        }
    }
    parseCommand(cmd) {
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
}
exports.GylfieDatabase = GylfieDatabase;
function download(url, path, callbacks) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            var request = (0, https_1.get)(url, function (response) {
                var _a;
                var total = parseInt((_a = response.headers["content-length"]) !== null && _a !== void 0 ? _a : "", 10);
                var cur = 0;
                callbacks.start(total);
                response.pipe((0, fs_1.createWriteStream)(path));
                response.on("data", function (chunk) {
                    callbacks.update(chunk.length);
                    cur += chunk.length;
                });
                response.on("end", function () {
                    resolve();
                });
                request.on("error", function (e) {
                    reject(e);
                });
            });
        });
    });
}
