import { Controller, Post, Param, Get, Delete, Body } from "@nestjs/common";
import { CreateBucketOptions, NestS3Service } from "../../services/s3";
// import { Public } from "../../../decorators";

@Controller("s3")
export class S3Controller {
	constructor(private s3Service: NestS3Service) {}
	// @Public()
	@Post("/create/:name")
	createTableWithName(
		@Param("name") name: string,
		@Body() body: CreateBucketOptions
	) {
		this.s3Service.createBucket(body);
	}

	// @Public()
	// @Post("/create")
	// createTable(@Body() body: CreateTableProps): void {
	// 	// for now, all tables will have hard coded attributes
	// 	// capacity units and stuff will be added later if needed
	// 	// cause most of this will be handled by the CDK
	// 	this.dynamoService.createTable(body);
	// }

	// @Public()
	@Delete("/delete/:name")
	deleteTable(@Param("name") name: string): void {
		console.log(name);
		this.s3Service.deleteBucket(name);
	}

	// @Public()
	@Get()
	async listTables() {
		return this.s3Service.listBuckets();
	}

	// @Public()
	@Get(":name")
	async listItemsInTable(@Param("name") name: string) {
		return this.s3Service.listObjects(name);
	}
}
