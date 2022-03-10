import {
	BucketCannedACL,
	CreateBucketCommand,
	DeleteBucketCommand,
	GetObjectCommand,
	ListBucketsCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-providers";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
	BaseService,
	BaseServiceProps,
	GylfieError,
	InternalServerError,
	LimitExceededError,
	RequestLimitExceededError,
	ResourceInUseError,
	ResourceNotFoundError,
	State,
} from "@gylfie/common/lib/base";
import {
	Access,
	AccessDeniedError,
	Bucket,
	BucketProps,
	S3ServiceProps,
} from "@gylfie/common/lib/s3";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Duration } from "luxon";
import { Readable } from "stream";
import { BaseNestService } from "../../base";
import { S3_PROPS } from "../../modules/s3/s3.constants";
import { NestLoggerService } from "../logger";

export interface NestS3ServiceProps extends S3ServiceProps {
	buckets: BucketProps[];
	port?: number;
}

type ACLs =
	| "public-read"
	| "private"
	| "public-read-write"
	| "aws-exec-read"
	| "authenticated-read"
	| "bucket-owner-read"
	| "bucket-owner-full-control"
	| "log-delivery-write";

@Injectable()
// @ServiceState(4566, "LOCAL_S3_PORT")
export class NestS3Service extends BaseNestService {
	public state: State;
	private S3: S3Client;
	protected buckets: { [key: string]: Bucket } = {};
	private port: number;
	constructor(
		@Inject(S3_PROPS)
		private readonly props: NestS3ServiceProps,
		@Optional()
		protected configService?: ConfigService,
		@Optional()
		private logger?: NestLoggerService
	) {
		super();
		this.port =
			props.port ??
			this.configService?.get<number>("LOCAL_S3_PORT") ??
			4566; // Localstack default
		props.buckets.forEach((val) => {
			this.buckets[val.name] = new Bucket(val);
		});
		// the default local setup is Hybrid
		// Since it's async to determine if the port is in use
		this.S3 = new S3Client({
			region: "eu-west-1",
			credentials: props.credentials ?? fromEnv(),
		});
		this.state = State.Hybrid;
		if (this.isLocal()) {
			logger?.info("Is Currently in Local Environment");
			this.isLocalActive(this.port).then((active) => {
				if (active) {
					console.log("Local Instance of S3 is ACTIVE");
					this.S3 = new S3Client({
						endpoint: `http://localhost:${this.port}`,
						region: "eu-west-1",
						credentials: props.credentials ?? fromEnv(),
					});
					this.state = State.Local;
					return;
				}
				logger?.warn("Local Instance of S3 is INACTIVE");
				logger?.warn("Defauting to online instance");
				logger?.warn("Only Read Only Actions will be Passed");
				return;
			});
			return;
		}
		logger?.info("Online Instance of S3 is ACTIVE");
		this.S3 = new S3Client({
			region: "eu-west-1",
			credentials: props.credentials ?? fromEnv(),
		});
		this.state = State.Online;
	}

	// @States(State.Local, State.Online)
	public async put(
		Bucket: string,
		Key: string,
		Body: string | Buffer | Uint8Array | Readable,
		ACL?: ACLs
	) {
		try {
			// We could use abort here but since it is serverless,
			// That might not be functional
			await this.S3.send(
				new PutObjectCommand({ Bucket, Key, Body, ACL })
			);
		} catch (err) {
			// throw new GylfieError(err);
			throw new Error(err as any); // Fix
		}
	}

	// We will require content length in order to provide a presigned url
	// This is a safety measure since the upload size can be massive
	// There is a http POST method for S3 buckets
	// That is more complicated but might be viable in some situations
	// It'll need a path for generating the signature and stuff
	// @States(State.Local, State.Online)
	public async putPresignedURL(
		Bucket: string,
		Key: string,
		ACL?: ACLs,
		options?: PresignedURLOptions
	): Promise<string> {
		// Add parameter for type
		// Since there are like 2 presigned urls that can be made
		let Expires = undefined;
		if (options?.expires) {
			Expires =
				typeof options?.expires == "number"
					? options.expires
					: options.expires.as("seconds");
		}
		try {
			// const { url } = await createPresignedPost(this.S3, {
			// 	Bucket,
			// 	Key,
			// 	Expires,
			// });
			// return url;
			const url = await getSignedUrl(
				this.S3,
				new PutObjectCommand({
					Bucket,
					Key,
					ACL,
				}),
				{
					// Conditions: [["content-length-range", 0, 10485760]], // Max 10 MB
					// Fields: { acl: "public-read" },
					expiresIn: Expires,
				}
			);
			return url;
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	// @States(State.Local, State.Online)
	// public async putTempPresignedURL(
	// 	Bucket: string,
	// 	options?: PresignedURLOptions
	// ) {
	// 	try {
	// 		const tempID = v1();
	// 		return this.putPresignedURL(Bucket, `temp/${tempID}`, options);
	// 	} catch (err) {
	// 		throw this.errorHandler(err);
	// 	}
	// }

	// @States(State.Local, State.Hybrid, State.Online)
	public async get(Bucket: string, Key: string): Promise<Readable> {
		try {
			const { Body } = await this.S3.send(
				new GetObjectCommand({ Bucket, Key })
			);
			if (Body && Body instanceof Readable) {
				return Body;
			}
			if (Body) {
				throw new Error("Body not instance of Readable"); // Fix
			}
			throw new Error("Object does not exist"); // Fix
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	// @States(State.Local, State.Hybrid, State.Online)
	public async getPresignedURL(
		Bucket: string,
		Key: string,
		options?: PresignedURLOptions
	) {
		let expiresIn = undefined;
		if (options?.expires) {
			expiresIn =
				typeof options?.expires == "number"
					? options.expires
					: options.expires.as("seconds");
		}
		try {
			return getSignedUrl(
				this.S3,
				new GetObjectCommand({ Bucket, Key }),
				{ expiresIn }
			);
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	// Developer Methods
	// @States(State.Local, State.Hybrid, State.Online)
	public async listObjects(Bucket: string, options?: ListObjectOptions) {
		try {
			const { CommonPrefixes } = await this.S3.send(
				new ListObjectsV2Command({ Bucket })
			);
			if (CommonPrefixes) {
				return CommonPrefixes.filter((val) => val.Prefix).map(
					(val) => val.Prefix ?? ""
				);
			}
			return [];
		} catch (err) {
			throw this.errorHandler(err);
		}
	}
	// @States(State.Local, State.Online)
	public async createBucket(props: CreateBucketOptions) {
		try {
			const { name, access } = props;
			const ACL: BucketCannedACL =
				typeof access == "string" ? access : Access[access];
			const { Location } = await this.S3.send(
				new CreateBucketCommand({ Bucket: name, ACL })
			);
			return Location ?? "";
		} catch (err) {
			throw this.errorHandler(err);
		}
	}
	// @States(State.Local, State.Online)
	public async deleteBucket(Bucket: string) {
		try {
			await this.S3.send(new DeleteBucketCommand({ Bucket }));
		} catch (err) {
			throw this.errorHandler(err);
		}
	}
	// @States(State.Local, State.Hybrid, State.Online)
	public async listBuckets() {
		try {
			const { Buckets } = await this.S3.send(new ListBucketsCommand({}));
			return Buckets ?? [];
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	protected errorHandler(err: any, inner?: GylfieError): GylfieError {
		switch ((err.name as string).replace("Exception", "")) {
			case "InternalServer": {
				return new InternalServerError(inner, err, "S3");
			}
			case "LimitExceeded": {
				return new LimitExceededError(inner, err, "S3");
			}
			case "ResourceInUse": {
				return new ResourceInUseError(inner, err, "S3");
			}
			case "ResourceNotFound": {
				return new ResourceNotFoundError(inner, err, "S3");
			}
			case "RequestLimitExceeded": {
				return new RequestLimitExceededError(inner, err, "S3");
			}
			case "AccessDenied": {
				return new AccessDeniedError(inner, err);
			}
		}
		return err;
	}
}

export interface CreateBucketOptions extends BucketProps {}
interface ListObjectOptions {}
interface PresignedURLOptions {
	expires?: number | Duration;
}
