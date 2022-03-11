import { Handler } from "aws-lambda";
import { GylfieEvent } from "../events";

export type Entry<TEvent extends GylfieEvent = any, TResult = any> = Handler<
	TEvent,
	TResult
>;
