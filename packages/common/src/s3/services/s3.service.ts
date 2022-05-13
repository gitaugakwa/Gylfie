import { BaseService, BaseServiceProps, State } from "../../base/services";
import {
	S3Client,
	PutObjectCommand,
	ListBucketsCommand,
	CreateBucketCommand,
	DeleteBucketCommand,
	ListObjectsV2Command,
	GetObjectCommand,
	BucketCannedACL,
	PutObjectCommandInput,
	CopyObjectCommand,
	ObjectCannedACL,
	DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import {
	createPresignedPost,
	PresignedPostOptions,
} from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Bucket, BucketProps, Access } from "../models";
import { Duration } from "luxon";
import { v1 } from "uuid";
import { AccessDeniedError } from "../errors";
import {
	InternalServerError,
	LimitExceededError,
	GylfieError,
	RequestLimitExceededError,
	ResourceInUseError,
	ResourceNotFoundError,
} from "../../base/errors";
import { Readable } from "stream";
import { fromEnv } from "@aws-sdk/credential-providers";
import { RequestPresigningArguments } from "@aws-sdk/types";
import { Conditions } from "@aws-sdk/s3-presigned-post/dist-types/types";
import { LOCAL_S3_PORT, S3_REGION } from "../constants";
import { compact, concat, join, map } from "lodash";

export interface S3ServiceProps extends BaseServiceProps {
	buckets: BucketProps[];
	port?: number;
	region?: string;
}

// type ACLs =
// 	| "public-read"
// 	| "private"
// 	| "public-read-write"
// 	| "aws-exec-read"
// 	| "authenticated-read"
// 	| "bucket-owner-read"
// 	| "bucket-owner-full-control"
// 	| "log-delivery-write";

// @ServiceState(4566, "LOCAL_S3_PORT")
export class S3Service extends BaseService {
	private S3!: S3Client;
	protected buckets: { [key: string]: Bucket } = {};
	private port: number;
	constructor(props?: S3ServiceProps) {
		super();
		this.port =
			props?.port ??
			(parseInt(process.env.LOCAL_S3_PORT ?? "") || LOCAL_S3_PORT); // Localstack default
		props?.buckets.forEach((val) => {
			this.buckets[val.name] = new Bucket(val);
		});
		// the default local setup is Hybrid
		// Since it's async to determine if the port is in use

		if (this.isLocal()) {
			this.isLocalActive(this.port).then((active) => {
				if (active) {
					props?.logger?.info(
						`S3Service (${this.state}): Local Is ACTIVE`
					);
				} else {
					props?.logger?.warn(
						`S3Service (${this.state}): Local Is INACTIVE`
					);
				}
				this.S3 = new S3Client({
					endpoint: `http://localhost:${this.port}`,
					region: props?.region ?? process.env.S3_REGION ?? S3_REGION,
					credentials: props?.credentials ?? fromEnv(),
				});
				props?.logger?.info(
					`S3Service (${this.state}): DynamoDBClient Initialized`
				);
			});
			return;
		}
		this.state = State.ONLINE;
		this.S3 = new S3Client({
			region: props?.region ?? process.env.S3_REGION ?? "eu-west-1",
			credentials: props?.credentials ?? fromEnv(),
		});
		props?.logger?.info(`S3Service (${this.state}): S3Client Initialized`);
	}

	// @States(State.Local, State.Online)
	public async put(props: {
		bucket: string;
		key: string;
		body: string | Buffer | Uint8Array | Readable;
		ACL?: ObjectCannedACL;
	}) {
		const { body: Body, bucket: Bucket, key: Key, ACL } = props;
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

	public async postPresignedURL(props: {
		bucket: string;
		key: string;
		conditions?: Conditions[];
		fields?: Record<string, string>;
		expires?: number;
	}) {
		const { bucket: Bucket, key: Key } = props;
		const presignedPost = await createPresignedPost(this.S3, {
			Bucket,
			Key,
		});
		return presignedPost;
	}

	// We will require content length in order to provide a presigned url
	// This is a safety measure since the upload size can be massive
	// There is a http POST method for S3 buckets
	// That is more complicated but might be viable in some situations
	// It'll need a path for generating the signature and stuff
	// @States(State.Local, State.Online)
	public async putPresignedURL(
		props: {
			bucket: string;
			key: string;
			ACL?: ObjectCannedACL;
			contentType?: string;
			contentLength?: number;
		}, // PutObjectCommandInput
		options?: Omit<RequestPresigningArguments, "expiresIn"> & {
			expiresIn?: Duration | number;
		}
	): Promise<string> {
		// Add parameter for type
		// Since there are like 2 presigned urls that can be made
		const {
			bucket: Bucket,
			key: Key,
			ACL,
			contentLength: ContentLength,
			contentType: ContentType,
		} = props;
		let { expiresIn } = options ?? {};
		if (expiresIn) {
			expiresIn =
				typeof expiresIn == "number"
					? expiresIn
					: expiresIn.as("seconds");
		}
		try {
			const url = await getSignedUrl(
				this.S3,
				new PutObjectCommand({
					Bucket,
					Key,
					ACL,
					ContentLength,
					ContentType,
				}),
				{
					// Conditions: [["content-length-range", 0, 10485760]], // Max 10 MB
					// Fields: { acl: "public-read" },
					...options,
					expiresIn,
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
	public async get(props: {
		bucket: string;
		key: string;
	}): Promise<Readable> {
		const { bucket: Bucket, key: Key } = props;
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
		props: {
			bucket: string;
			key: string;
		},
		options?: PresignedURLOptions
	) {
		const { bucket: Bucket, key: Key } = props;
		let { expiresIn } = options ?? {};

		if (expiresIn) {
			expiresIn =
				typeof expiresIn == "number"
					? expiresIn
					: expiresIn.as("seconds");
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

	public async copy(props: {
		from: { bucket: string; key: string };
		to: { bucket?: string; key: string };
	}) {
		const source = join(
			concat(
				compact(props.from.bucket.split("/")),
				compact(props.from.key.split("/"))
			),
			"/"
		);
		const { key: Key, bucket: Bucket = props.from.bucket } = props.to;
		try {
			const result = await this.S3.send(
				new CopyObjectCommand({ CopySource: source, Bucket, Key })
			);
		} catch (err) {
			// throw new GylfieError(err);
			throw new Error(err as any); // Fix
		}
	}

	public async delete(props: { bucket: string; key: string }) {
		const { key: Key, bucket: Bucket } = props;
		try {
			const result = await this.S3.send(
				new DeleteObjectCommand({ Bucket, Key })
			);
		} catch (err) {
			// throw new GylfieError(err);
			throw new Error(err as any); // Fix
		}
	}

	// Developer Methods
	// @States(State.Local, State.Hybrid, State.Online)
	public async listObjects(
		props: { bucket: string },
		options?: ListObjectOptions
	) {
		const { bucket: Bucket } = props;
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
	public async deleteBucket(props: { bucket: string }) {
		const { bucket: Bucket } = props;
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
			return map(Buckets ?? [], (bucket) => ({ ...bucket }));
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
	expiresIn?: number | Duration;
}
