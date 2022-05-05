import { AttributeValue, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Injectable, Inject, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BaseService, BaseServiceProps, State } from "@gylfie/common";
import { CACHE_PROPS } from "../../modules/cache/cache.constants";
import { NestLoggerService } from "../logger";
import Hash from "object-hash";
import { Key } from "@gylfie/common";
import { BaseNestService } from "../../base";

export interface CacheObject<TValue> {
	value: TValue;
	duration: number;
	creationDateTime: number;
}

export interface NestCacheServiceProps extends BaseServiceProps {
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
@Injectable()
// @ServiceState(8000, "LOCAL_DYNAMO_PORT")
export class NestCacheService extends BaseNestService {
	public state: State;
	private _cache: {
		[key: string]: CacheObject<
			{
				[key: string]: AttributeValue;
			}[]
		>;
	} = {};
	constructor(
		@Inject(CACHE_PROPS)
		private readonly props: NestCacheServiceProps,
		@Optional()
		protected configService?: ConfigService,
		@Optional()
		private logger?: NestLoggerService
	) {
		super();
		if (this.isLocal()) {
			this.state = State.Hybrid;
			this.state = State.Local;
			return;
		}

		this.state = State.Online;
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
}
