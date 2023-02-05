import {ScheduleModule} from '@nestjs/schedule'
import {Module} from '@nestjs/common'
import {CronService} from './cron.service'
import {SlackModule} from 'src/slack/slack.module'

@Module({
    imports: [ScheduleModule.forRoot(), SlackModule],
    providers: [CronService],
    exports: [CronService],
})
export class CronModule {}
