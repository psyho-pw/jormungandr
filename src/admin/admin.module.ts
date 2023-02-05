import {Module} from '@nestjs/common'
import {AdminService} from './admin.service'
import {AdminController} from './admin.controller'
import {SlackModule} from '../slack/slack.module'

@Module({
    imports: [SlackModule],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule {}
