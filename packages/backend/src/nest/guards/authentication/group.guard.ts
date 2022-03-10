import {
	Injectable,
	CanActivate,
	ExecutionContext,
	InternalServerErrorException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { PUBLIC_KEY } from "./public.guard";

/*
	Groups:
	[4] User
		- Regular user that has created an account on the website
	[3] Customer
		- A user that has ordered an item from the website
	[2] CreditCustomer
		- A customer that has been allowed to make orders on credit
	[1] Admin
		- An administrator to the website that has more privileges
	[0] Developer
		- Has highest level of access to the website
 */

@Injectable()
export class NestGroupGuard implements CanActivate {
	constructor(private reflector: Reflector) {}
	canActivate(
		context: ExecutionContext
	): boolean | Promise<boolean> | Observable<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (isPublic) {
			return true;
		}

		const groups = this.reflector.get<string[]>(
			"groups",
			context.getHandler()
		);
		if (!groups) {
			// throw since each user must be in a group
			throw new InternalServerErrorException({
				name: "RouteMapping",
				message:
					"The route is neither public nor does it have groups mapped.",
			});
		}

		// get the request object
		// get the header and decode
		// if the groups data is not included in the user
		const request = context.switchToHttp().getRequest();
		// console.log(request);
		const user = request.user;
		// console.log(user);
		if (user["groups"]) {
			const userGroups: string[] = user["groups"];
			let isIncluded = false;
			for (const group of groups) {
				isIncluded = userGroups.includes(group);
				if (isIncluded) {
					return isIncluded;
				}
			}
		}
		return true;
	}
}
