// Definition

import { OptionValues } from "commander";
import { join } from "path";
import { Context } from "../context";
import { DatabaseType } from "./database";
import { PackageJson } from "./service";

interface ResourceTypeDefinition {
	folder: string;
}

interface FunctionResourceTypeDefinition extends ResourceTypeDefinition {
	runtimes: string[];
}

interface LayerResourceTypeDefinition extends ResourceTypeDefinition {
	runtimes: string[];
}

interface DatabaseResourceTypeDefinition extends ResourceTypeDefinition {
	// runtimes: string[];
}

interface ServiceResourceTypeDefinition extends ResourceTypeDefinition {
	// runtimes: string[];
}

interface BucketResourceTypeDefinition extends ResourceTypeDefinition {
	// runtimes: string[];
}

interface MobileResourceTypeDefinition extends ResourceTypeDefinition {
	// runtimes: string[];
}

interface ResourceTypesDefinition {
	function: FunctionResourceTypeDefinition;
	database: DatabaseResourceTypeDefinition;
	layer: LayerResourceTypeDefinition;
	service: ServiceResourceTypeDefinition;
	bucket: BucketResourceTypeDefinition;
	mobile: MobileResourceTypeDefinition;
}

// ResourceType Definition

export const ResourceDefinition: ResourceTypesDefinition = {
	function: {
		folder: "Functions",
		runtimes: ["nodejs12.x", "nodejs14.x"],
	},
	database: { folder: "Databases" },
	layer: { folder: "Layers", runtimes: ["nodejs12.x", "nodejs14.x"] },
	service: {
		folder: "Services",
		// runtimes: ["nodejs12.x", "nodejs14.x"]
	},
	bucket: {
		folder: "Buckets",
	},
	mobile: {
		folder: "Mobile",
	},
};

export type ResourceType = keyof ResourceTypesDefinition;

// Resource
// Add stages

interface Stages<TResourceProperties extends ResourceProperties> {
	[key: string]: TResourceProperties;
}

type StageResource<
	TResourceType extends ResourceType,
	TResourceProperties extends ResourceProperties
> = { type: TResourceType; stages: Stages<TResourceProperties> };

type PropertyResource<
	TResourceType extends ResourceType,
	TResourceProperties extends ResourceProperties
> = {
	type: TResourceType;
	properties: TResourceProperties;
};

type Resource<
	TResourceType extends ResourceType,
	TResourceProperties extends ResourceProperties
> = StageResource<TResourceType, TResourceProperties> &
	PropertyResource<TResourceType, TResourceProperties>;

// export interface Resource {
// 	type: ResourceType;
// 	stages: Stages
// 	properties: ResourceProperties;
// }

export interface ResourceProperties {
	path: string;
}

export type FunctionResource = Resource<"function", FunctionResourceProperties>;

export interface FunctionResourceProperties
	extends ResourceProperties,
		StartableResource,
		BuildableResource {
	runtime: string;
	handler: string;
	timeout?: number;
	port?: number;
	services?: string[];
}

export type DatabaseResource = Resource<"database", DatabaseResourceProperties>;

export interface DatabaseResourceProperties
	extends ResourceProperties,
		StartableResource {
	port?: number;
	sharedDb?: boolean;
	type: DatabaseType;
}

export type LayerResource = Resource<"layer", LayerResourceProperties>;

export interface LayerResourceProperties
	extends ResourceProperties,
		StartableResource,
		BuildableResource {
	runtime: string;
}

export type ServiceResource = Resource<"service", ServiceResourceProperties>;

export interface ServiceResourceProperties
	extends ResourceProperties,
		StartableResource {
	// package?: PackageJson;
}

export type MobileAppResource = Resource<"mobile", MobileAppResourceProperties>;

export interface MobileAppResourceProperties
	extends ResourceProperties,
		StartableResource {
	// package?: PackageJson;
}

export interface BuildableResource {
	buildCommand?: string;
	watchAppend?: string;
}

export interface StartableResource {
	startCommand?: string;
	watchAppend?: string;
}

export abstract class GylfieResource {
	public abstract create(request: Request): void;
	public abstract start(request: Request): void;
	public abstract build(request: Request): void;
	public abstract clean(request: Request): void;

	protected generateStartCommand(
		defaultBuildCommand: string,
		props?: StartableResource,
		globals?: StartableResource,
		options?: OptionValues
	): string {
		if (options?.watch) {
			// As much as it would be nice to default watch to :watch
			// For situations that aren't configured for that,
			// should be left in normal start
			return (
				props?.startCommand ??
				globals?.startCommand ??
				defaultBuildCommand ??
				"npm run start"
			).concat(props?.watchAppend ?? globals?.watchAppend ?? ":watch");
		}
		return (
			props?.startCommand ??
			globals?.startCommand ??
			defaultBuildCommand ??
			"npm run start"
		);
	}

	protected generateBuildCommand(
		defaultBuildCommand: string,
		props?: BuildableResource,
		globals?: BuildableResource,
		options?: OptionValues
	): string {
		if (options?.watch) {
			return (
				props?.buildCommand ??
				globals?.buildCommand ??
				defaultBuildCommand ??
				"npm run build"
			).concat(props?.watchAppend ?? globals?.watchAppend ?? ":watch");
		}
		return (
			props?.buildCommand ??
			globals?.buildCommand ??
			defaultBuildCommand ??
			"npm run build"
		);
	}

	protected generateCleanCommand(
		defaultBuildCommand: string,
		props?: BuildableResource,
		globals?: BuildableResource,
		options?: OptionValues
	): string {
		if (options?.watch) {
			return (
				props?.buildCommand ??
				globals?.buildCommand ??
				defaultBuildCommand ??
				"npm run clean"
			).concat(props?.watchAppend ?? globals?.watchAppend ?? ":watch");
		}
		return (
			props?.buildCommand ??
			globals?.buildCommand ??
			defaultBuildCommand ??
			"npm run clean"
		);
	}
}

export interface Request {
	context: Context;
	options?: OptionValues;
}
export const resourcePath: string = join(__dirname, "../../resources");
