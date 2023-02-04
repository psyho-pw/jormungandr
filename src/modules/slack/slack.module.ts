import {Module} from '@nestjs/common'
import {SlackService} from './slack.service'
import {SlackController} from './slack.controller'

@Module({
    providers: [SlackService],
    exports: [SlackService],
    controllers: [SlackController],
})
export class SlackModule {}
