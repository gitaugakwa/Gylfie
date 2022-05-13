import { Controller, Post, Param, Get, Delete, Body } from "@nestjs/common";
// import { Public } from "@gylfie/common/lib/base";
import { CreateTableProps } from "@gylfie/common";
import { NestDynamoService } from "../../services/dynamo";

@Controller("dynamo")
export class DynamoController {
	constructor(private dynamoService: NestDynamoService) {}
	// @Public()
	@Post("/create/:name")
	createTableWithName(
		@Param("name") name: string,
		@Body() body: CreateTableProps
	) {
		this.dynamoService.createTable({ ...body, name });
	}
	// @Public()
	@Post("/create")
	createTable(@Body() body: CreateTableProps): void {
		// for now, all tables will have hard coded attributes
		// capacity units and stuff will be added later if needed
		// cause most of this will be handled by the CDK
		this.dynamoService.createTable(body);
	}

	// @Public()
	@Delete("/delete/:name")
	deleteTable(@Param("name") name: string): void {
		console.log(name);
		this.dynamoService.deleteTable(name);
	}

	// @Public()
	@Get()
	async listTables(): Promise<string[]> {
		return this.dynamoService.listTables();
	}

	// @Public()
	@Get(":name")
	async listItemsInTable(
		@Param("name") name: string
	): Promise<{ [key: string]: any }[]> {
		return this.dynamoService.listItems(name);
	}
}
