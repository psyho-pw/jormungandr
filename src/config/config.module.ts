import {Global, Module} from '@nestjs/common'
import {ConfigModule} from '@nestjs/config'
import {AppConfigService} from './config.service'
import {configurations} from './configurations'

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: [`.env/.env.${process.env.NODE_ENV}`, 'dotenv/.env.development'],
            load: [configurations],
        }),
    ],
    providers: [AppConfigService],
    exports: [AppConfigService],
})
export class AppConfigModule {}
