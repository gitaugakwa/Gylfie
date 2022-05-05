import { spawn, spawnSync, execSync, exec } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { Answers, createPromptModule } from "inquirer";
import { join } from "path";
import { Context } from "../../../config";
import { GylfieCommand } from "../../../commands";
import {
	MobileAppResource,
	MobileAppResourceProperties,
	GylfieResource,
	Request,
	ResourceDefinition,
} from "../resource";
import { merge } from "lodash";

interface IMobileAppResourcePrompt {}

// export const IncludedMobiles: { [key: string]: IncludedMobile } = {
// 	"cognito-local": {
// 		startCommand: "npx cognito-local",
// 		package: {
// 			name: "cognito-local",
// 			version: "1.0.0",
// 			description: "Local Mobile",
// 			scripts: {
// 				start: "npx cognito-local",
// 			},
// 			dependencies: {
// 				"cognito-local": "^2.1.0",
// 			},
// 		},
// 	},
// };

export class GylfieMobileApp extends GylfieResource {
	constructor(private name?: string,
		private resource?: MobileAppResource) {
		super();
	}

	public start(request: Request): void {
		const { context, options } = request;
		const { config } = context;
		const { globals } = config;

		let props: MobileAppResourceProperties;

		if (context.configExists()) {
			const { config } = context;
			if (config.resources && this.name) {
				const res = config.resources[this.name];
				if (res) {
					props = (res as MobileAppResource).properties;
				} else {
					throw new Error("Resource does not exist");
				}
			} else {
				throw new Error("Name is not provided");
			}
			// this.spawn();
		} else {
			throw new Error("Gylfie Config does not exist");
		}

		console.log(`Starting ${this.name} Mobile App`);
		const cmd = this.generateStartCommand(
			"npm run android",
			props,
			globals?.function,
			options
		);

		const command = GylfieCommand.parseCommand(cmd.split(" ")[0]);
		const args = cmd.split(" ");
		args.shift();
		// console.log(properties.path);
		const instance = spawn(command, args, {
			cwd: props.path,
			detached: true,
			windowsHide: false,
			shell: true,
			// stdio: "pipe", // Send to the parent
			stdio: "ignore", // To ignore the parent
		});
		// console.log(instance);
		// console.log(instance.stdout.toString());
		// console.log(instance.stderr.toString());
		instance.unref(); // To detach from the parent
		console.log(`${this.name} Started`);
		return;
	}

	public async create(
		request: Request,
		// flags
		setup?: IMobileAppResourcePrompt
	) {
		const prompt = createPromptModule();
		const { context, options } = request;
		const { config } = context;
		let answers: { [key: string]: any } = { type: "mobile" };

		const name = await prompt([
			{
				type: "input",
				name: "name",
				message: "Name of the Mobile App",
			},
		]);
		merge(answers, name);
		if (
			config.resources &&
			config.resources[answers.name] &&
			!options?.force
		) {
			console.log("Resource already exists");
			return;
		}

		// Prompt for adding custom values to the Mobile
		const properties = await prompt(
			[
				{
					type: "input",
					name: "path",
					message: (answers: Answers) => {
						return `Path to the ${answers.type}: ${answers.name}`;
					},
					default: GylfieCommand.getPath(undefined, answers),
					filter: (input, answers) => {
						return GylfieCommand.getPath(input, answers);
					},
				},
				// {
				// 	type: "list",
				// 	name: "runtime",
				// 	message: (answers: Answers) => {
				// 		return `Runtime for the ${answers.type}: ${answers.name}`;
				// 	},
				// 	choices: ResourceDefinition.layer.runtimes,
				// },
				{
					type: "input",
					name: "startCommand",
					message: (answers: Answers) => {
						return `Start Command for the ${answers.type}: ${answers.name}`;
					},
					filter: (input, answers) => {
						return input ? input : undefined;
					},
				},
				{
					type: "input",
					name: "buildCommand",
					message: (answers: Answers) => {
						return `Build Command for the ${answers.type}: ${answers.name}`;
					},
					filter: (input, answers) => {
						return input ? input : undefined;
					},
				},
			],
			answers
		);
		merge(answers, properties);

		const func: { [key: string]: MobileAppResource } = {
			[answers.name]: {
				type: answers.type,
				stages: {},
				properties: {
					path: GylfieCommand.getPath(answers.path, answers),
					startCommand: answers.startCommand,
					// runtime: answers.runtime,
				},
			},
		};

		context.addToConfig({ resources: func });
		return func;
	}

	public async build(request: Request) {
		const { context, options } = request;
		const { config } = context;
		const { globals } = config;

		const stage = options ? options["stage"] : undefined;

		let props: MobileAppResourceProperties;

		if (context.configExists()) {
			const { config } = context;
			if (config.resources && this.name) {
				const res = config.resources[this.name];
				if (res) {
					if (stage) {
						props = (res as MobileAppResource).stages[stage];
					} else {
						props = (res as MobileAppResource).properties;
					}
				} else {
					throw new Error("Resource does not exist");
				}
			} else {
				throw new Error("Name is not provided");
			}
			// this.spawn();
		} else {
			throw new Error("Gylfie Config does not exist");
		}

		// if (options && options["stage"]) {
		// 	const stage = options["stage"];
		// 	console.log(`Building ${this.name}:${stage} Mobile App`);
		// 	// console.log(`At path: ${props.path}`);
		// }

		console.log(
			`Building ${this.name}${stage ? `:${stage}` : ""} Mobile App`
		);
		let cmd = this.generateBuildCommand(
			"react-native bundle " +
				"--platform android " +
				"--dev false " +
				"--entry-file index.js " +
				"--bundle-output android/app/src/main/assets/index.android.bundle " +
				"--assets-dest android/app/src/main/res",
			props,
			globals?.mobile,
			options
		);
		// Default
		// cmd = GylfieCommand.addCommand(cmd, "cd android");
		// cmd = GylfieCommand.addCommand(cmd, "./gradlew assembleDebug");
		let command = GylfieCommand.parseCommand(cmd.split(" ")[0]);
		let args = cmd.split(" ");
		args.shift();

		const react = spawnSync(command, args, {
			cwd: props.path,
			// detached: true,
			windowsHide: false,
			shell: true,
			stdio: "inherit", // Send to the parent
			// stdio: "ignore", // To ignore the parent
		});

		// console.log("Going to gradle");
		cmd = "cmd.exe /c gradlew.bat assembleDebug";
		command = GylfieCommand.parseCommand(cmd.split(" ")[0]);
		args = ["/c gradlew.bat assembleDebug"];
		// console.log(args);
		const gradle = spawn(command, args, {
			cwd: join(props.path, "android"),
			detached: true,
			windowsHide: false,
			shell: true,
			// stdio: "inherit", // Send to the parent
			stdio: "ignore", // To ignore the parent
		});

		gradle.unref(); // To detach from the parent
		console.log(`${this.name} Built`);
		return;
	}

	public async clean(request: Request) {
		const { context, options } = request;
		const { config } = context;
		const { globals } = config;

		const stage = options ? options["stage"] : undefined;

		let props: MobileAppResourceProperties;

		if (context.configExists()) {
			const { config } = context;
			if (config.resources && this.name) {
				const res = config.resources[this.name];
				if (res) {
					if (stage) {
						props = (res as MobileAppResource).stages[stage];
					} else {
						props = (res as MobileAppResource).properties;
					}
				} else {
					throw new Error("Resource does not exist");
				}
			} else {
				throw new Error("Name is not provided");
			}
			// this.spawn();
		} else {
			throw new Error("Gylfie Config does not exist");
		}

		let cmd = this.generateCleanCommand(
			"rimraf android/app/src/main/assets/index.android.bundle ",
			props,
			globals?.mobile,
			options
		);
		// console.log(cmd);

		cmd = GylfieCommand.addCommand(
			cmd,
			"rimraf android/app/src/main/res/drawable*"
		);
		cmd = GylfieCommand.addCommand(cmd, "rimraf android/app/src/main/res/raw");
		// cmd = GylfieCommand.addCommand(
		// 	cmd,
		// 	"rimraf android/app/build/outputs/apk-debug.apk"
		// );

		let command = GylfieCommand.parseCommand(cmd.split(" ")[0]);
		let args = cmd.split(" ");
		args.shift();

		const rimraf = spawnSync(command, args, {
			cwd: props.path,
			// detached: true,
			windowsHide: false,
			shell: true,
			stdio: "inherit", // Send to the parent
			// stdio: "ignore", // To ignore the parent
		});
		// rimraf.unref(); // To detach from the parent
		console.log(`${this.name} Cleaned`);
		return;
	}
}
