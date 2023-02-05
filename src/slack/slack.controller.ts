import {Controller, Get} from '@nestjs/common'
import {SlackService} from './slack.service'

@Controller('slack')
export class SlackController {
    constructor(private readonly slackService: SlackService) {}

    @Get('/teams')
    findTeams() {
        return this.slackService.fetchTeams()
    }

    @Get('/channels')
    findChannels() {
        return this.slackService.fetchChannels()
    }

    @Get('/users')
    findUsers() {
        return this.slackService.fetchUsers()
    }
}
