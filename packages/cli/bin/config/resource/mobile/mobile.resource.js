"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GylfieMobileApp = void 0;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const inquirer_1 = require("inquirer");
const path_1 = require("path");
const commands_1 = require("../../../commands");
const resource_1 = require("../resource");
const lodash_1 = require("lodash");
class GylfieMobileApp extends resource_1.GylfieResource {
    constructor(name, resource) {
        super();
        this.name = name;
        this.resource = resource;
    }
    start(request) {
        const { context, options } = request;
        const { config } = context;
        const { globals } = config;
        let props;
        if (context.configExists()) {
            const { config } = context;
            if (config.resources && this.name) {
                const res = config.resources[this.name];
                if (res) {
                    props = res.properties;
                }
                else {
                    throw new Error("Resource does not exist");
                }
            }
            else {
                throw new Error("Name is not provided");
            }
        }
        else {
            throw new Error("Gylfie Config does not exist");
        }
        console.log(`Starting ${this.name} Mobile App`);
        const cmd = this.generateStartCommand("npm run android", props, globals === null || globals === void 0 ? void 0 : globals.function, options);
        const command = commands_1.GylfieCommand.parseCommand(cmd.split(" ")[0]);
        const args = cmd.split(" ");
        args.shift();
        const instance = (0, child_process_1.spawn)(command, args, {
            cwd: props.path,
            detached: true,
            windowsHide: false,
            shell: true,
            stdio: "ignore",
        });
        instance.unref();
        console.log(`${this.name} Started`);
        return;
    }
    create(request, setup) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const prompt = (0, inquirer_1.createPromptModule)();
            const { context, options } = request;
            const { config } = context;
            let answers = { type: "mobile" };
            const name = yield prompt([
                {
                    type: "input",
                    name: "name",
                    message: "Name of the Mobile App",
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
                    type: "input",
                    name: "startCommand",
                    message: (answers) => {
                        return `Start Command for the ${answers.type}: ${answers.name}`;
                    },
                    filter: (input, answers) => {
                        return input ? input : undefined;
                    },
                },
                {
                    type: "input",
                    name: "buildCommand",
                    message: (answers) => {
                        return `Build Command for the ${answers.type}: ${answers.name}`;
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
                        path: commands_1.GylfieCommand.getPath(answers.path, answers),
                        startCommand: answers.startCommand,
                    },
                },
            };
            context.addToConfig({ resources: func });
            return func;
        });
    }
    build(request) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { context, options } = request;
            const { config } = context;
            const { globals } = config;
            const stage = options ? options["stage"] : undefined;
            let props;
            if (context.configExists()) {
                const { config } = context;
                if (config.resources && this.name) {
                    const res = config.resources[this.name];
                    if (res) {
                        if (stage) {
                            props = res.stages[stage];
                        }
                        else {
                            props = res.properties;
                        }
                    }
                    else {
                        throw new Error("Resource does not exist");
                    }
                }
                else {
                    throw new Error("Name is not provided");
                }
            }
            else {
                throw new Error("Gylfie Config does not exist");
            }
            console.log(`Building ${this.name}${stage ? `:${stage}` : ""} Mobile App`);
            let cmd = this.generateBuildCommand("react-native bundle " +
                "--platform android " +
                "--dev false " +
                "--entry-file index.js " +
                "--bundle-output android/app/src/main/assets/index.android.bundle " +
                "--assets-dest android/app/src/main/res", props, globals === null || globals === void 0 ? void 0 : globals.mobile, options);
            let command = commands_1.GylfieCommand.parseCommand(cmd.split(" ")[0]);
            let args = cmd.split(" ");
            args.shift();
            const react = (0, child_process_1.spawnSync)(command, args, {
                cwd: props.path,
                windowsHide: false,
                shell: true,
                stdio: "inherit",
            });
            cmd = "cmd.exe /c gradlew.bat assembleDebug";
            command = commands_1.GylfieCommand.parseCommand(cmd.split(" ")[0]);
            args = ["/c gradlew.bat assembleDebug"];
            const gradle = (0, child_process_1.spawn)(command, args, {
                cwd: (0, path_1.join)(props.path, "android"),
                detached: true,
                windowsHide: false,
                shell: true,
                stdio: "ignore",
            });
            gradle.unref();
            console.log(`${this.name} Built`);
            return;
        });
    }
    clean(request) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { context, options } = request;
            const { config } = context;
            const { globals } = config;
            const stage = options ? options["stage"] : undefined;
            let props;
            if (context.configExists()) {
                const { config } = context;
                if (config.resources && this.name) {
                    const res = config.resources[this.name];
                    if (res) {
                        if (stage) {
                            props = res.stages[stage];
                        }
                        else {
                            props = res.properties;
                        }
                    }
                    else {
                        throw new Error("Resource does not exist");
                    }
                }
                else {
                    throw new Error("Name is not provided");
                }
            }
            else {
                throw new Error("Gylfie Config does not exist");
            }
            let cmd = this.generateCleanCommand("rimraf android/app/src/main/assets/index.android.bundle ", props, globals === null || globals === void 0 ? void 0 : globals.mobile, options);
            cmd = commands_1.GylfieCommand.addCommand(cmd, "rimraf android/app/src/main/res/drawable*");
            cmd = commands_1.GylfieCommand.addCommand(cmd, "rimraf android/app/src/main/res/raw");
            let command = commands_1.GylfieCommand.parseCommand(cmd.split(" ")[0]);
            let args = cmd.split(" ");
            args.shift();
            const rimraf = (0, child_process_1.spawnSync)(command, args, {
                cwd: props.path,
                windowsHide: false,
                shell: true,
                stdio: "inherit",
            });
            console.log(`${this.name} Cleaned`);
            return;
        });
    }
}
exports.GylfieMobileApp = GylfieMobileApp;
