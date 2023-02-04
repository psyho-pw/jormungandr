import {Controller, Get} from '@nestjs/common'
import {SlackService} from './slack.service'

@Controller('slack')
export class SlackController {
    constructor(private readonly slackService: SlackService) {}

    @Get('/channels')
    findChannels() {
        return this.slackService.findChannels()
    }
}
