import { Express } from "express";
import * as express from "express";
import { Server, createServer } from "http";
import { GylfieServer } from "./server";

// export interface ExpressServer extends Express {

// }

export interface ExpressServerProps {
	serverListenCallback?: () => void;
	binaryTypes?: any;
}

export class ExpressServer extends GylfieServer {
	public requestListener: Express = express();
	constructor(props?: ExpressServerProps) {
		super();
		this.server = createServer(this.requestListener);
		this._socketPathSuffix = this.getRandomString();
		this._binaryTypes = props?.binaryTypes ? props.binaryTypes.slice() : [];

		this.server.on("listening", () => {
			this._isListening = true;
			if (props?.serverListenCallback) props.serverListenCallback();
		});
		this.server
			.on("close", () => {
				this._isListening = false;
			})
			.on("connection", (socket) => {
				console.log("Connection to ", socket);
			})
			.on("listening", () => {
				console.log("Listening");
			})
			.on("error", (error) => {
				console.log("ERROR: server error");
				console.error(error);
			});
	}

	public start() {
		this.server.listen(this.socketPath);
		return this;
	}
}
