import { Server } from "http";
import { tmpdir } from "os";
import { join } from "path";

export interface ServerType {
	server: Server;
	_socketPathSuffix?: string;
	_binaryTypes?: any;
	_isListening?: boolean;
}

export abstract class GylfieServer implements ServerType {
	server: Server = new Server();
	_socketPathSuffix?: string;
	_binaryTypes?: any;
	_isListening?: boolean;
	abstract requestListener: any;
	protected _socketPath?: string;

	abstract start(): GylfieServer;
	protected getRandomString() {
		return Math.random().toString(36).substring(2, 15);
	}
	public get socketPath(): string {
		if (this._socketPath) {
			return this._socketPath;
		}
		if (/^win/.test(process.platform)) {
			return (this._socketPath = join(
				"\\\\?\\pipe",
				process.cwd(),
				`server-${this._socketPathSuffix}`
			));
		} else {
			const tmpDir = tmpdir();
			return (this._socketPath =
				tmpDir + `/server-${this._socketPathSuffix}.sock`);
		}
	}
}
