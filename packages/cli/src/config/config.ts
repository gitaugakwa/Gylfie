import {
	DatabaseResource,
	DatabaseResourceProperties,
	FunctionResource,
	FunctionResourceProperties,
	LayerResource,
	LayerResourceProperties,
	MobileAppResource,
	MobileAppResourceProperties,
	ServiceResource,
	ServiceResourceProperties,
} from "./resource";

export type SupportedResources =
	| FunctionResource
	| DatabaseResource
	| ServiceResource
	| LayerResource
	| MobileAppResource;

export interface Config {
	name: string;
	developer: string;
	package: string;
	resources?: {
		[key: string]: SupportedResources;
	};
	globals?: Globals;
}

interface Globals {
	function?: Partial<FunctionResourceProperties>;
	database?: Partial<DatabaseResourceProperties>;
	layer?: Partial<LayerResourceProperties>;
	service?: Partial<ServiceResourceProperties>;
	mobile?: Partial<MobileAppResourceProperties>;
}
