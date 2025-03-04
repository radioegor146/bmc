import {Module} from "@nestjs/common";
import {ServersController} from "./servers.controller";
import {ServersService} from "./servers.service";
import {ConfigModule} from "@nestjs/config";

@Module({
    imports: [ConfigModule],
    controllers: [ServersController],
    providers: [ServersService],
})
export class ServersModule {
}