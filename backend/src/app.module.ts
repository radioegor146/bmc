import {Module} from '@nestjs/common';
import {AppConfigModule} from "./common/config/app-config.module";
import {ServersModule} from "./servers/servers.module";

@Module({
    imports: [
        AppConfigModule,

        ServersModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule {
}
