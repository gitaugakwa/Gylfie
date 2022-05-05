import { Controller, Post, Param, Get, Delete, Body } from "@nestjs/common";
// import { Public } from "@gylfie/common/lib/base";
import { NestCacheService } from "../../services/cache";

@Controller("cache")
export class CacheController {
	constructor(private cacheService: NestCacheService) {}
}
