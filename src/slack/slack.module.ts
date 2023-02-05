import {MessageModule} from 'src/message/message.module'
import {DiscordModule} from '../discord/discord.module'
import {AppConfigModule} from '../config/config.module'
import {Module} from '@nestjs/common'
import {SlackService} from './slack.service'
import {SlackController} from './slack.controller'
import {UserModule} from 'src/user/user.module'

@Module({
    imports: [AppConfigModule, DiscordModule, UserModule, MessageModule],
    providers: [SlackService],
    exports: [SlackService],
    controllers: [SlackController],
})
export class SlackModule {}
