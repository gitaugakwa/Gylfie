import {
	ExpressServer,
	ExpressServerProps,
	LambdaServerModule,
	LambdaServerModuleProps,
	QueryProps,
} from "@gylfie/core";
import {
	APIGatewayProxyEventV2,
	APIGatewayProxyResultV2,
	APIGatewayProxyStructuredResultV2,
	Context,
} from "aws-lambda";
import { clone } from "lodash";
import { IncomingHttpHeaders, IncomingMessage, RequestOptions } from "http";
import { URL, format } from "url";

export interface APIGatewayV2ModuleProps extends LambdaServerModuleProps {
	server?: ExpressServerProps;
}

// For now, it'll be hard coded to an Express Server
export class APIGatewayV2Module extends LambdaServerModule<
	APIGatewayProxyEventV2,
	APIGatewayProxyResultV2,
	ExpressServer
> {
	public server: ExpressServer;
	constructor(props?: APIGatewayV2ModuleProps) {
		super(props);
		this.server = new ExpressServer(props?.server);
	}
	protected async forwardResponse(response: IncomingMessage): Promise<void> {
		const buf: Uint8Array[] = [];

		response
			.on("data", (chunk) => buf.push(chunk))
			.on("end", () => {
				const bodyBuffer = Buffer.concat(buf);
				const statusCode = response.statusCode;
				const responseHeaders: IncomingHttpHeaders = response.headers;

				// HACK: modifies header casing to get around API Gateway's limitation of not allowing multiple
				// headers with the same name, as discussed on the AWS Forum https://forums.aws.amazon.com/message.jspa?messageID=725953#725953
				const cookies: string[] | undefined =
					responseHeaders["set-cookie"];
				const headers: { [key: string]: string } = {};
				Object.keys(responseHeaders).forEach((h) => {
					const headerValue = responseHeaders[h];
					if (headerValue) {
						if (Array.isArray(headerValue)) {
							console.log("Header that is Array");
							console.log(h);
							console.log(headerValue);
							return;
						} else {
							headers[h] = headerValue;
						}
					}
				});

				const contentType = this.getContentType({
					contentTypeHeader: responseHeaders["content-type"],
				});
				const isBase64Encoded = this.isContentTypeBinaryMimeType({
					contentType,
					binaryMimeTypes: this.server._binaryTypes,
				});
				const body = bodyBuffer.toString(
					isBase64Encoded ? "base64" : "utf8"
				);

				const successResponse: APIGatewayProxyStructuredResultV2 = {
					body,
					isBase64Encoded,
					statusCode,
					cookies,
					headers,
				};
				console.log(successResponse);

				this.resolve(successResponse);
			});
		// throw new Error("Method not implemented.");
	}

	protected async forwardConnectionErrorResponse(
		error: Error
	): Promise<void> {
		console.log("ERROR: aws-serverless-express connection error");
		console.error(error);
		const errorResponse = {
			statusCode: 502, // "DNS resolution, TCP level errors, or actual HTTP parse errors" - https://nodejs.org/api/http.html#http_http_request_options_callback
			body: "",
			headers: {},
		};

		this.reject(error);
	}

	protected async forwardLibraryErrorResponse(error: any): Promise<void> {
		console.log("ERROR: aws-serverless-express error");
		console.error(error);
		const errorResponse = {
			statusCode: 500,
			body: "",
			headers: {},
		};

		this.reject(error);
	}

	protected getPathWithQueryStringParams(
		event: APIGatewayProxyEventV2,
		props: QueryProps | undefined
	): string {
		const path = format({
			pathname:
				props?.ignoreStage &&
				event.rawPath.includes(`/${event.requestContext.stage}`)
					? event.rawPath.replace(
							`/${event.requestContext.stage}`,
							""
					  )
					: event.rawPath,
			search: event.rawQueryString,
		}).toString();

		// return `${
		// 	props?.ignoreStage &&
		// 	event.rawPath.includes(`/${event.requestContext.stage}`)
		// 		? event.rawPath.replace(`/${event.requestContext.stage}`, "")
		// 		: event.rawPath
		// }? ${event.rawQueryString}`;
		return path;
	}

	protected getRequestMethod(event: APIGatewayProxyEventV2): string {
		return event.requestContext.http.method;
	}

	protected mapEventToHttpRequest(
		event: APIGatewayProxyEventV2,
		context: Context,
		props?: QueryProps
	): RequestOptions {
		if (!event) {
			throw new Error("Event must be defined");
		}

		const initialHeader = Array.isArray(event.cookies)
			? { cookie: event.cookies.join("; ") }
			: {};

		const headers = Object.assign(initialHeader, event.headers);

		// NOTE: API Gateway is not setting Content-Length header on requests even when they have a body
		if (event.body && !headers["Content-Length"]) {
			const body = this.getEventBody(event);
			headers["Content-Length"] = Buffer.byteLength(body).toString();
		}

		const clonedEventWithoutBody = clone(event);
		delete clonedEventWithoutBody.body;

		headers["x-apigateway-event"] = encodeURIComponent(
			JSON.stringify(clonedEventWithoutBody)
		);
		headers["x-apigateway-context"] = encodeURIComponent(
			JSON.stringify(context)
		);

		return {
			method: this.getRequestMethod(event),
			path: this.getPathWithQueryStringParams(event, props),
			headers,
			socketPath: this.server.socketPath,
			// protocol: `${headers['X-Forwarded-Proto']}:`,
			// host: headers.Host,
			// hostname: headers.Host, // Alias for host
			// port: headers['X-Forwarded-Port']
		};
	}
}
