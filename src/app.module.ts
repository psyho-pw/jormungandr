import {ErrorInterceptor} from './common/interceptors/error.interceptor'
import {MessageModule} from './message/message.module'
import {UserModule} from './user/user.module'
import {TypeormConfigService} from './common/configServices/typeorm.config.service'
import {DiscordModule} from './discord/discord.module'
import {AdminModule} from './admin/admin.module'
import {AppConfigModule} from './config/config.module'
import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common'
import {WinstonModule} from 'nest-winston'
import {AppController} from './app.controller'
import {AppService} from './app.service'
import {WinstonConfigService} from './common/configServices/winston.config.service'
import {LoggerMiddleware} from './common/middlewares/logger.middleware'
import {SlackModule} from './slack/slack.module'
import {TypeOrmModule} from '@nestjs/typeorm'
import {DataSource} from 'typeorm'
import {APP_INTERCEPTOR} from '@nestjs/core'

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
    providers: [AppService, {provide: APP_INTERCEPTOR, useClass: ErrorInterceptor}],
})
export class AppModule implements NestModule {
    constructor(private dataSource: DataSource) {}

    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(LoggerMiddleware).forRoutes('/')
    }
}
