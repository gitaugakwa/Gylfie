import { AttributeValue, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BaseService, BaseServiceProps, State } from "../../base/services";
import { GylfieError } from "../../base/errors";
import Hash from "object-hash";
import { Key } from "../models";

export interface CacheObject<TValue> {
	value: TValue;
	duration: number;
	creationDateTime: number;
}

export interface CacheServiceProps extends BaseServiceProps {
	cache?: boolean | { duration?: number };
}

export interface CacheGetProps {
	duration?: number;
}

/**
 * Gylfie Dynamo Service
 * @decorator `@Injectable`
 * @param props - The properties required to create the service
 * @param configService - ConfigService provided through DI
 * @param logger - LoggerService provided through DI
 */
// @ServiceState(8000, "LOCAL_DYNAMO_PORT")
export class CacheService extends BaseService {
	private _cache: {
		[key: string]: CacheObject<
			{
				[key: string]: AttributeValue;
			}[]
		>;
	} = {};
	constructor(private props?: CacheServiceProps) {
		super();
	}

	public add(props: {
		key: Key;
		value: {
			[key: string]: AttributeValue;
		}[];
		duration?: number;
	}): {
		[key: string]: AttributeValue;
	}[] {
		const { key, value } = props;
		const hash = Hash(key);
		let { duration } = props;
		if (this.props?.cache) {
			if (typeof this.props.cache == "object") {
				duration = this.props.cache.duration;
			}
		}
		this._cache[hash] = {
			value,
			duration: duration ?? 300000, // 5 min
			creationDateTime: Date.now(),
		};
		return this._cache[hash].value;
	}

	public get(
		props: { key: Key },
		options?: { ignoreDuration?: boolean }
	):
		| {
				[key: string]: AttributeValue;
		  }[]
		| null {
		const { key } = props;
		const { ignoreDuration } = options ?? {};
		const hash = Hash(key);
		const obj = this._cache[hash] ?? {};
		if (
			ignoreDuration ||
			(obj && Date.now() < obj.creationDateTime + obj.duration)
		) {
			return obj?.value ?? null;
		}
		return null;
	}

	protected errorHandler(err?: any, inner?: GylfieError): GylfieError {
		throw new Error("Method not implemented.");
	}
}
