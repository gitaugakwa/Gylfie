import { spawn, spawnSync } from "child_process";
import { createWriteStream, mkdir, mkdirSync, writeFileSync } from "fs";
import { Answers, createPromptModule } from "inquirer";
import { dirname, join } from "path";
import { GylfieCommand } from "../../../commands";
import {
	DatabaseResource,
	DatabaseResourceProperties,
	GylfieResource,
	Request,
	ResourceDefinition,
	resourcePath,
} from "../resource";
import { merge } from "lodash";
import { OptionValues } from "commander";
import { openSync, existsSync } from "fs";
import axios from "axios";
import { get } from "https";
import { SingleBar, Presets } from "cli-progress";
import zip from "adm-zip";

interface IDatabaseResourcePrompt {}

// export const IncludedDatabases: { [key: string]: IncludedDatabase } = {
// 	"cognito-local": {
// 		startCommand: "npx cognito-local",
// 		package: {
// 			name: "cognito-local",
// 			version: "1.0.0",
// 			description: "Local Cognito Database",
// 			scripts: {
// 				start: "npx cognito-local",
// 			},
// 			dependencies: {
// 				"cognito-local": "^2.1.0",
// 			},
// 		},
// 	},
// };

interface DatabaseTypeDefinition {
	path: string;
	startCommand: string;
	shell?: string;
}

interface DatabaseTypesDefinition {
	dynamodb: DatabaseTypeDefinition;
}

console.log(resourcePath);
const databasePath = join(resourcePath, "databases");

export const DatabaseDefinition: DatabaseTypesDefinition = {
	dynamodb: {
		// set this as the cwd of the database instance
		// then have an options param -> {{options}}
		path: join(databasePath, "dynamoDB"),
		startCommand: `java -D"java.library.path=./DynamoDBLocal_lib" -jar DynamoDBLocal.jar {{options}}`,
		// shell: "pwsh.exe",
	},
};

export type DatabaseType = keyof DatabaseTypesDefinition;

export class GylfieDatabase extends GylfieResource {
	constructor(private name?: string, private resource?: DatabaseResource) {
		super();
	}

	public clean(request: Request): void {
		throw new Error("Method not implemented.");
	}
	public build(request: Request): void {
		throw new Error("Method not implemented.");
	}

	// Add support for custom databases

	public async create(request: Request, setup?: IDatabaseResourcePrompt) {
		const prompt = createPromptModule();
		const { context, options } = request;
		const { config } = context;
		let answers: { [key: string]: any } = {
			type: "database",
			stage: options ? options["stage"] : undefined,
		};

		const name = await prompt([
			{
				type: "input",
				name: "name",
				message: "Name of the Database",
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

		// Prompt for adding custom values to the Database
		const properties = await prompt(
			[
				{
					type: "input",
					name: "path",
					message: (answers: Answers) => {
						return `Path to the ${answers.type}: ${answers.name} ${
							answers.stage ? `Stage: ${answers.stage}` : ""
						}`;
					},
					default: GylfieCommand.getPath(undefined, answers),
					filter: (input, answers) => {
						return GylfieCommand.getPath(input, answers);
					},
				},
				{
					type: "list",
					name: "databaseType",
					message: (answers: Answers) => {
						return `Database type for the ${answers.type}: ${
							answers.name
						} ${answers.stage ? `Stage: ${answers.stage}` : ""}`;
					},
					choices: Object.keys(DatabaseDefinition),
					default: "dynamodb",

					filter: (input, answers) => {
						return input ? input : undefined;
					},
				},
				{
					type: "input",
					name: "port",
					message: (answers: Answers) => {
						return `Port for the ${answers.type}: ${answers.name} ${
							answers.stage ? `Stage: ${answers.stage}` : ""
						}`;
					},
					filter: (input, answers) => {
						return input ? input : undefined;
					},
				},
				{
					type: "confirm",
					name: "sharedDb",
					default: true,
					message: (answers: Answers) => {
						return `Is the ${answers.type}: ${answers.name} ${
							answers.stage ? `Stage: ${answers.stage}` : ""
						} shared?`;
					},
					filter: (input, answers) => {
						return input ? input : undefined;
					},
				},
				// For custom database
				// {
				// 	type: "input",
				// 	name: "startCommand",
				// 	message: (answers: Answers) => {
				// 		return `Start Command for the ${answers.type}: ${answers.name}`;
				// 	},
				// 	filter: (input, answers) => {
				// 		return input ? input : undefined;
				// 	},
				// },
			],
			answers
		);

		merge(answers, properties);

		const props: DatabaseResourceProperties = {
			path: GylfieCommand.getPath(answers.path, answers),
			startCommand: answers.startCommand,
			type: answers.databaseType,
			port: answers.port,
			sharedDb: answers.sharedDb,
		};

		switch (answers.databaseType) {
			case "dynamodb": {
				const client = axios.create({
					baseURL: "https://s3.eu-central-1.amazonaws.com",
					timeout: 30000,
				});
				const dynamoPath = join(databasePath, "dynamoDB");
				const zipPath = join(
					dynamoPath,
					"src/dynamodb_local_latest.zip"
				);
				try {
					if (!existsSync(zipPath)) {
						console.log("Downloading Local DynamoDB");
						mkdirSync(dirname(zipPath), { recursive: true });
						const progBar = new SingleBar(
							{ etaBuffer: 100 },
							Presets.shades_grey
						);
						const data = await download(
							"https://s3.eu-central-1.amazonaws.com/dynamodb-local-frankfurt/dynamodb_local_latest.zip",
							zipPath,
							{
								start: (total) => {
									progBar.start(total, 0);
								},
								update: (added) => {
									progBar.increment(added);
								},
							}
						);
						progBar.stop();
						// openSync(zipPath, "w+");
						// writeFileSync(zipPath, data);
					}
				} catch (err) {
					console.log(err);
					throw err;
				}

				if (!existsSync(join(dynamoPath, "DynamoDBLocal.jar"))) {
					console.log("Unzipping DynamoDB Emulator");
					const dbZip = new zip(zipPath);
					dbZip.extractAllTo(dynamoPath, true);
					console.log("Unzipping complete");
				}
				break;
			}
		}

		if (!existsSync(props.path)) {
			mkdirSync(props.path, { recursive: true });
		}

		if (answers.stage) {
			const stage = {
				[answers.name]: {
					type: answers.type,
					stages: { [answers.stage]: props },
					// properties: {},
				},
			};
			context.addToConfig({
				resources: stage,
			});
			return stage;
		} else {
			const database: { [key: string]: DatabaseResource } = {
				[answers.name]: {
					type: answers.type,
					stages: {},
					properties: props,
				},
			};

			context.addToConfig({ resources: database });
			return database;
		}
	}

	public async update(request: Request) {
		// const prompt = createPromptModule();
		const { context, options } = request;
		const { config } = context;
		const { resources } = config;

		const updated: { [key: string]: boolean } = {};

		const databaseRes = Object.values(resources ?? {}).filter(
			({ type }) => type == "database"
		);

		for (const { properties, stages } of databaseRes) {
			const type =
				(properties as DatabaseResourceProperties).type ??
				(Object.values(stages)[0] as DatabaseResourceProperties).type;
			if (!updated[type]) {
				switch (type) {
					case "dynamodb": {
						const client = axios.create({
							baseURL: "https://s3.eu-central-1.amazonaws.com",
							timeout: 30000,
						});
						const dynamoPath = join(databasePath, "dynamoDB");
						const zipPath = join(
							dynamoPath,
							"src/dynamodb_local_latest.zip"
						);
						try {
							if (!existsSync(zipPath)) {
								console.log("Downloading Local DynamoDB");
								mkdirSync(dirname(zipPath), {
									recursive: true,
								});
								const progBar = new SingleBar(
									{ etaBuffer: 100 },
									Presets.shades_grey
								);
								const data = await download(
									"https://s3.eu-central-1.amazonaws.com/dynamodb-local-frankfurt/dynamodb_local_latest.zip",
									zipPath,
									{
										start: (total) => {
											progBar.start(total, 0);
										},
										update: (added) => {
											progBar.increment(added);
										},
									}
								);
								progBar.stop();
								// openSync(zipPath, "w+");
								// writeFileSync(zipPath, data);
							}
						} catch (err) {
							console.log(err);
							throw err;
						}

						if (
							!existsSync(join(dynamoPath, "DynamoDBLocal.jar"))
						) {
							console.log("Unzipping DynamoDB Emulator");
							const dbZip = new zip(zipPath);
							dbZip.extractAllTo(dynamoPath, true);
							console.log("Unzipping complete");
						}
						break;
					}
				}
			}
			updated[type] = true;
		}
	}

	public start(request: Request) {
		const { context, options } = request;
		const { config } = context;
		const { globals } = config;
		const { properties, stages } = this.resource ?? {};

		if (options?.stage && stages) {
			merge(properties, stages[options.stage]);
		}

		// this.spawn();

		console.log(
			`Starting Database: ${this.name} Stage: ${
				options?.stage ?? "default"
			}`
		);
		const cmd = this.getStartCommand(properties);
		console.log(cmd);
		console.log(this.generateWorkingDir(properties));
		const args = cmd.split(" ");
		const command = args[0];
		args.shift();

		const instance = spawn(command, args, {
			cwd: this.generateWorkingDir(properties),
			detached: true,
			windowsHide: false,
			shell: properties
				? DatabaseDefinition[properties.type].shell ?? true
				: true,
			// stdio: "pipe", // Send to the parent
			stdio: "ignore", // To ignore the parent
		});
		instance.unref();
		if (options?.watch) {
		}
		console.log(
			`Started Database: ${this.name} Stage: ${
				options?.stage ?? "default"
			}`
		);
	}

	private generateWorkingDir(
		properties?: DatabaseResourceProperties
	): string {
		if (properties?.type) {
			return DatabaseDefinition[properties.type].path;
		}
		throw new Error("Error while generating working directory.");
	}

	private getStartCommand(properties?: DatabaseResourceProperties) {
		if (properties?.type) {
			const startCommand =
				DatabaseDefinition[properties?.type].startCommand;
			if (startCommand) {
				return this.replacePlaceholders(startCommand, properties);
			}
			throw new Error("Database does not have a type.");
		}
		throw new Error("Database type is not supported.");
	}

	private replacePlaceholders(
		command: string,
		properties?: DatabaseResourceProperties
	) {
		switch (properties?.type) {
			case "dynamodb": {
				return command.replace(/{{(\w+)}}/g, (match, value) => {
					switch (value) {
						case "options": {
							return Object.entries({
								port: properties?.port,
								dbPath: `"${properties?.path}"`,
								sharedDb: properties?.sharedDb,
							})
								.filter(
									([name, value]) =>
										typeof value != "undefined"
								)
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

	private parseCommand(cmd: string): string {
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

async function download(
	url: string,
	path: string,
	callbacks: {
		start: (totalBytes: number) => void;
		update: (addedBytes: number) => void;
	}
) {
	return new Promise<void>((resolve, reject) => {
		var request = get(url, function (response) {
			// response.setEncoding("utf-8");
			var total = parseInt(response.headers["content-length"] ?? "", 10);
			// let buffer: Uint8Array[] = [];
			var cur = 0;

			callbacks.start(total);
			response.pipe(createWriteStream(path));

			response.on("data", function (chunk) {
				// buffer.push(chunk);
				callbacks.update(chunk.length);
				cur += chunk.length;
			});

			response.on("end", function () {
				// const file = Buffer.concat(buffer);
				resolve();
			});

			request.on("error", function (e) {
				reject(e);
			});
		});
	});
}
