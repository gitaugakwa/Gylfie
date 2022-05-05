import { existsSync, readFileSync, statSync, writeFileSync } from "fs";
import { isAbsolute, join } from "path";
import { Config } from "../config";
import { merge } from "lodash";

type PartialAll<TType> = {
	[K in keyof TType]?: K extends Object ? PartialAll<TType[K]> : TType[K];
};
export class Context {
	cwd: string;
	configPath: string;
	private _config?: Config;
	constructor(path?: string) {
		this.cwd = process.cwd();
		this.configPath = this.derivePath(path);
	}

	public get config(): Config {
		if (!this.configExists()) {
			throw new Error("Gylfie Config does not exist");
		}
		return (
			this._config ??
			(this._config = JSON.parse(readFileSync(this.configPath, "utf8")))
		);
	}

	protected derivePath(path?: string): string {
		const cwd = process.cwd();
		return join(
			`${path ? (isAbsolute(path) ? path : join(cwd, path)) : cwd}`,
			"gylfie.json"
		);
	}

	public addToConfig(object: PartialAll<Config>) {
		this.config;
		merge(this._config, object);
		this.flush();
	}

	public configExists(): boolean {
		try {
			return existsSync(this.configPath);
			// const stats = statSync(this.configPath);
			// return stats.isFile();
		} catch (err) {
			switch ((err as any).code) {
				case "ENOENT": {
					return false;
				}
				default: {
					return false;
				}
			}
		}
	}

	public flush() {
		writeFileSync(this.configPath, JSON.stringify(this.config, null, 4));
	}
}
