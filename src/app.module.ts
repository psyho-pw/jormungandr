import {MessageModule} from './modules/message/message.module'
import {UserModule} from './modules/user/user.module'
import {TypeormConfigService} from './configServices/typeorm.config.service'
import {DiscordModule} from './modules/discord/discord.module'
import {AdminModule} from './modules/admin/admin.module'
import {AppConfigModule} from './config/config.module'
import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common'
import {WinstonModule} from 'nest-winston'
import {AppController} from './app.controller'
import {AppService} from './app.service'
import {WinstonConfigService} from './configServices/winston.config.service'
import {LoggerMiddleware} from './middlewares/logger.middleware'
import {SlackModule} from './modules/slack/slack.module'
import {TypeOrmModule} from '@nestjs/typeorm'
import {DataSource} from 'typeorm'

@Module({
    imports: [
        AppConfigModule,
        TypeOrmModule.forRootAsync({useClass: TypeormConfigService}),
        WinstonModule.forRootAsync({useClass: WinstonConfigService}),
        AdminModule,
        SlackModule,
        DiscordModule,
        UserModule,
        MessageModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements NestModule {
    constructor(private dataSource: DataSource) {}

    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(LoggerMiddleware).forRoutes('/')
    }
}
