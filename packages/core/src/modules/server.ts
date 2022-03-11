import { GylfieEvent } from "../events";
import { GylfieServer } from "../servers";
import { GylfieModule, GylfieModuleProps } from "./module";

export interface GylfieServerModuleProps extends GylfieModuleProps {}

export abstract class GylfieServerModule<
	TServer extends GylfieServer
> extends GylfieModule {
	protected abstract server: TServer;
	constructor(props?: GylfieServerModuleProps) {
		super(props);
	}
}
