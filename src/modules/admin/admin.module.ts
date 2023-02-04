import {Module} from '@nestjs/common'
import {AdminService} from './admin.service'
import {AdminController} from './admin.controller'
import {SlackModule} from '../slack/slack.module'
import {SlackService} from '../slack/slack.service'

@Module({
    imports: [SlackModule],
    controllers: [AdminController],
    providers: [AdminService, SlackService],
})
export class AdminModule {}
