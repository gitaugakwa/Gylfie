import { spawn, spawnSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { Answers, createPromptModule } from "inquirer";
import { join } from "path";
import { Context } from "../../../config";
import { GylfieCommand } from "../../../commands";
import {
	GylfieResource,
	Request,
	ServiceResource,
	ServiceResourceProperties,
} from "../resource";
import { merge } from "lodash";

interface IServiceResourcePrompt {}

export interface PackageJson {
	name: string;
	version: string;
	type?: string;
	private?: boolean;
	description: string;
	main?: string;
	scripts: { [key: string]: string };
	keywords?: string[];
	bin?: string | { [key: string]: string };
	devDependencies?: { [key: string]: string };
	dependencies?: { [key: string]: string };
	bundledDependencies?: string[];
	author?: string | { name: string; url: string; organization: boolean };
	license?: string;
}

interface IncludedService {
	startCommand?: string;
	package?: PackageJson;
}

export const IncludedServices: { [key: string]: IncludedService } = {
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

export class GylfieService extends GylfieResource {
	constructor(private name?: string, private resource?: ServiceResource) {
		super();
	}

	public clean(request: Request): void {
		throw new Error("Method not implemented.");
	}
	public build(request: Request): void {
		throw new Error("Method not implemented.");
	}
	public async start(request: Request) {
		const { context, options } = request;
		const { config } = context;
		const { globals } = config;
		const { properties, stages } = this.resource ?? {};

		if (options?.stage && stages) {
			merge(properties, stages[options.stage]);
		}

		const { path } = properties ?? {};

		console.log(
			`Starting Service: ${this.name} Stage: ${
				options?.stage ?? "default"
			}`
		);
		const cmd = this.generateStartCommand(
			"npm run start",
			properties,
			globals?.service,
			options
		);

		const command = GylfieCommand.parseCommand(cmd.split(" ")[0]);
		const args = cmd.split(" ");
		args.shift();
		// console.log(properties.path);
		const instance = spawn(command, args, {
			cwd: path,
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
		console.log(
			`Started Service: ${this.name} Stage: ${
				options?.stage ?? "default"
			}`
		);
	}

	public async create(request: Request, setup?: IServiceResourcePrompt) {
		const { context, options } = request;
		const { config } = context;
		const prompt = createPromptModule();
		let answers: { [key: string]: any } = { type: "service" };

		const name = await prompt([
			{
				type: "list",
				name: "serviceName",
				message: "Choose an available service",
				choices: [...Object.keys(IncludedServices), "New service"],
				filter: (input, answers) => {
					if (input != "New Service") {
						answers.name = input;
					}
				},
			},
			{
				type: "input",
				name: "name",
				message: (answers: Answers) => {
					return `Name of the ${answers.type}`;
				},
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
		if (Object.keys(IncludedServices).includes(answers.name)) {
			await this.initializeIncludedService(
				answers.name,
				IncludedServices[answers.name],
				{
					path: GylfieCommand.getPath(undefined, answers),
				}
			);

			const service: { [key: string]: ServiceResource } = {
				[answers.name]: {
					type: answers.type,
					stages: {},
					properties: {
						path: GylfieCommand.getPath(undefined, answers),
						startCommand:
							IncludedServices[answers.name].startCommand,
					},
				},
			};

			context.addToConfig({ resources: service });

			return service;
		}
		// Prompt for adding custom values to the service
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
					type: "input",
					name: "startCommand",
					message: (answers: Answers) => {
						return `Start Command for the ${answers.type}: ${answers.name}`;
					},
					filter: (input, answers) => {
						return input ? input : undefined;
					},
				},
			],
			answers
		);
		merge(answers, properties);

		const service: { [key: string]: ServiceResource } = {
			[answers.name]: {
				type: answers.type,
				stages: {},
				properties: {
					path: GylfieCommand.getPath(undefined, answers),
					startCommand: answers.startCommand,
				},
			},
		};

		context.addToConfig({ resources: service });
		return service;
	}
	public async initializeIncludedService(
		name: string,
		service: IncludedService,
		config: ServiceResourceProperties
	) {
		// this[name];
		switch (name) {
			case "cognito-local": {
				try {
					mkdirSync(config.path, { recursive: true });
				} catch (err) {
					switch ((err as any).code) {
						case "EEXIST": {
							// Directory already exists
							return;
						}
						default: {
							console.log(
								`Unexpected Error: Make Directory for Service: ${name}`,
								err,
								config
							);
						}
					}
				}
				try {
					writeFileSync(
						join(config.path, "package.json"),
						JSON.stringify(service.package, null, 4)
					);
				} catch (err) {
					console.log(
						`Unexpected Error: Write File Package for Service: ${name}`,
						err,
						config
					);
				}

				try {
					const command = GylfieCommand.parseCommand("npm");
					spawnSync(command, ["i"], { cwd: config.path });
				} catch (err) {
					console.log(
						`Unexpected Error: npm install for Service: ${name}`,
						err,
						config
					);
				}

				config.startCommand = "npx cognito-local";
			}
		}
	}
}
