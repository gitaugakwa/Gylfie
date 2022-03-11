import {
	S3Event,
	APIGatewayProxyEvent,
	APIGatewayProxyResult,
	APIGatewayProxyEventV2,
	APIGatewayProxyResultV2,
	S3BatchEvent,
	CloudWatchLogsEvent,
} from "aws-lambda";
import { Entry } from "./entry";

export type S3Entry = Entry<S3Event, void>;

export type S3BatchEntry = Entry<S3BatchEvent, void>;

export type APIGatewayEntry = Entry<
	APIGatewayProxyEvent,
	APIGatewayProxyResult
>;

export type APIGatewayEntryV2<T = never> = Entry<
	APIGatewayProxyEventV2,
	APIGatewayProxyResultV2<T>
>;

export type CloudWatchLogsEntry = Entry<CloudWatchLogsEvent, void>;
