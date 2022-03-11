// import { ConfigService } from "@nestjs/config";
// import { Test, TestingModule } from "@nestjs/testing";
// import { User } from "../../../models";
// import { DynamoService } from "../dynamo";
// import { CognitoService } from "./cognito.service";

// describe("CognitoService", () => {
// 	let cognitoService: CognitoService;
// 	let dynamoService: DynamoService;
// 	beforeEach(async () => {
// 		const module: TestingModule = await Test.createTestingModule({
// 			providers: [
// 				CognitoService,
// 				ConfigService,
// 				{ provide: DynamoService, useValue: { get: jest.fn() } },
// 			],
// 		}).compile();
// 		cognitoService = module.get<CognitoService>(CognitoService);
// 		dynamoService = module.get<DynamoService>(DynamoService);
// 	});
// 	it("should be defined", () => {
// 		expect(cognitoService).toBeDefined();
// 	});
// 	describe("when checking a user", () => {
// 		describe("and the ID is a uuid", () => {
// 			it("should return a boolean", async () => {
// 				const isUser = await cognitoService.checkUser(
// 					"123e4567-e89b-12d3-a456-426614174000"
// 				);
// 				expect(isUser).toEqual(true);
// 			});
// 		});
// 		describe("and the ID is a friendlyID", () => {
// 			it("should return a boolean", async () => {
// 				const isUser = await cognitoService.checkUser("1234567890");
// 				expect(isUser).toEqual(true);
// 			});
// 		});
// 		describe("and the ID is an email", () => {
// 			it("should return a boolean", async () => {
// 				const isUser = await cognitoService.checkUser("test@test.com");
// 				expect(isUser).toEqual(true);
// 			});
// 		});
// 	});
// 	describe("when creating a user", () => {
// 		describe("with required attributes", () => {
// 			// let user: User;
// 			// beforeEach(() => {
// 			// 	user = new User({email: "test@test.com"});
// 			// });

// 			it("should return the user", async () => {
// 				// let user: {email:}
// 				const cognitoUser = await cognitoService.createUser({
// 					email: "test@test.com",
// 					password: "testPass",
// 					givenName: "John",
// 					familyName: "Doe",
// 				});
// 				expect(cognitoUser).toEqual({ email: "test@test.com" });
// 			});
// 		});
// 		describe("with additional attributes", async () => {
// 			const cognitoUser = await cognitoService.createUser({
// 				email: "test@test.com",
// 				password: "testPass",
// 				givenName: "John",
// 				familyName: "Doe",
// 				gender: "male",
// 			});
// 			expect(cognitoUser).toEqual({
// 				email: "test@test.com",
// 				givenName: "John",
// 				familyName: "Doe",
// 			});
// 		});
// 	});
// 	// describe("", () => {
// 	// 	// cognitoService.
// 	// });
// });
