import { spawnSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { Answers, createPromptModule } from "inquirer";
import { join } from "path";
import { Context } from "../../../config";
import { GylfieCommand } from "../../../commands";
import {
	LayerResource,
	LayerResourceProperties,
	GylfieResource,
	Request,
	ResourceDefinition,
} from "../resource";
import { merge } from "lodash";

interface ILayerResourcePrompt {}

// export const IncludedLayers: { [key: string]: IncludedLayer } = {
// 	"cognito-local": {
// 		startCommand: "npx cognito-local",
// 		package: {
// 			name: "cognito-local",
// 			version: "1.0.0",
// 			description: "Local Layer",
// 			scripts: {
// 				start: "npx cognito-local",
// 			},
// 			dependencies: {
// 				"cognito-local": "^2.1.0",
// 			},
// 		},
// 	},
// };

export class GylfieLayer extends GylfieResource {
	public clean(request: Request): void {
		throw new Error("Method not implemented.");
	}
	public build(request: Request): void {
		throw new Error("Method not implemented.");
	}
	public start(request: Request): void {
		throw new Error("Method not implemented.");
	}
	constructor() {
		super();
	}

	public async create(
		request: Request,
		// flags
		setup?: ILayerResourcePrompt
	) {
		const prompt = createPromptModule();
		const { context, options } = request;
		const { config } = context;
		let answers: { [key: string]: any } = { type: "layer" };

		const name = await prompt([
			{
				type: "input",
				name: "name",
				message: "Name of the Layer",
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

		// Prompt for adding custom values to the Layer
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
					choices: ResourceDefinition.layer.runtimes,
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

		const layer: { [key: string]: LayerResource } = {
			[answers.name]: {
				type: answers.type,
				stages: {},
				properties: {
					path: GylfieCommand.getPath(undefined, answers),
					startCommand: answers.startCommand,
					runtime: answers.runtime,
				},
			},
		};

		context.addToConfig({ resources: layer });
		return layer;
	}
}
