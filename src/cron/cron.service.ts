import {Inject, Injectable} from '@nestjs/common'
import {Cron, SchedulerRegistry} from '@nestjs/schedule'
import {CronJob} from 'cron'
import {WINSTON_MODULE_PROVIDER} from 'nest-winston'
import {SlackService} from 'src/slack/slack.service'
import {Logger} from 'winston'

@Injectable()
export class CronService {
    constructor(
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly slackService: SlackService,

        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) {}

    static slackFetchSchedule = '10 * * * * *'

    @Cron(CronService.slackFetchSchedule)
    public async fetchSlackInfo() {
        await this.slackService.fetchTeams()
        await this.slackService.fetchChannels()
        await this.slackService.fetchUsers()

        this.logger.verbose('Slack data fetched')
    }

    public dynamicTaskExecution() {
        const job = new CronJob(`2 * * * * *`, () => {
            this.logger.warn('dynamic task execution', ':::::')
        })

        this.schedulerRegistry.addCronJob('dynamic', job)
        this.logger.warn(`job added!`)
    }
}
