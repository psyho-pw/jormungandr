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

@Module({
    imports: [AppConfigModule, WinstonModule.forRootAsync({useClass: WinstonConfigService}), AdminModule, SlackModule, DiscordModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(LoggerMiddleware).forRoutes('/')
    }
}
