import { spawn, spawnSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { Answers, createPromptModule } from "inquirer";
import { join } from "path";
import { Context } from "../../../config";
import { GylfieCommand } from "../../../commands";
import {
	FunctionResource,
	FunctionResourceProperties,
	GylfieResource,
	Request,
	ResourceDefinition,
} from "../resource";
import { merge } from "lodash";

interface IFunctionResourcePrompt {}

// export const IncludedFunctions: { [key: string]: IncludedFunction } = {
// 	"cognito-local": {
// 		startCommand: "npx cognito-local",
// 		package: {
// 			name: "cognito-local",
// 			version: "1.0.0",
// 			description: "Local Cognito Function",
// 			scripts: {
// 				start: "npx cognito-local",
// 			},
// 			dependencies: {
// 				"cognito-local": "^2.1.0",
// 			},
// 		},
// 	},
// };

export class GylfieFunction extends GylfieResource {
	constructor(private name?: string, private resource?: FunctionResource) {
		super();
	}

	public clean(request: Request): void {
		throw new Error("Method not implemented.");
	}
	public build(request: Request): void {
		throw new Error("Method not implemented.");
	}
	public start(request: Request): void {
		const { context, options } = request;
		const { config } = context;
		const { properties, stages } = this.resource ?? {};
		const { globals } = config;

		if (options?.stage && stages) {
			merge(properties, stages[options.stage]);
		}
		const { path } = properties ?? {};

		console.log(
			`Starting Function: ${this.name} Stage: ${
				options?.stage ?? "default"
			}`
		);
		const cmd = this.generateStartCommand(
			"npm run start",
			properties,
			globals?.function,
			options
		);

		const command = GylfieCommand.parseCommand(cmd.split(" ")[0]);
		const args = cmd.split(" ");
		args.shift();

		const instance = spawn(command, args, {
			cwd: path,
			detached: true,
			windowsHide: false,
			shell: true,
			// stdio: "pipe", // Send to the parent
			stdio: "ignore", // To ignore the parent
		});
		instance.unref(); // To detach from the parent
		console.log(
			`Started Function: ${this.name} Stage: ${
				options?.stage ?? "default"
			}`
		);
	}

	public async create(
		request: Request,
		// flags
		setup?: IFunctionResourcePrompt
	) {
		const prompt = createPromptModule();
		const { context, options } = request;
		const { config } = context;
		let answers: { [key: string]: any } = { type: "function" };

		const name = await prompt([
			{
				type: "input",
				name: "name",
				message: "Name of the Function",
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

		// Prompt for adding custom values to the Function
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
				{
					type: "list",
					name: "runtime",
					message: (answers: Answers) => {
						return `Runtime for the ${answers.type}: ${answers.name}`;
					},
					choices: ResourceDefinition.function.runtimes,
				},
				{
					type: "input",
					name: "handler",
					message: (answers: Answers) => {
						return `Path to the Handler function for the ${answers.type}: ${answers.name}`;
					},
					default: "dist/main.handler",
					// filter: (input, answers) => {
					// 	answers.path = GylfieCommand.getPath(input, answers);
					// },
				},
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
				{
					type: "input",
					name: "watchAppend",
					message: (answers: Answers) => {
						return `Watch Append for the ${answers.type}: ${answers.name}`;
					},
					filter: (input, answers) => {
						return input ? input : undefined;
					},
				},
			],
			answers
		);
		merge(answers, properties);

		const func: { [key: string]: FunctionResource } = {
			[answers.name]: {
				type: answers.type,
				stages: {},
				properties: {
					path: GylfieCommand.getPath(undefined, answers),
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
	}
}
