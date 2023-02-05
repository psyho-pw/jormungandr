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

    @Cron('10 * * * * *')
    public async fetchSlackTeamUsers() {
        await this.slackService.fetchUsers()
        this.logger.verbose('Slack users fetched')
    }

    @Cron('10 * * * * *')
    public async fetchSlackTeamChannels() {
        console.log(this.fetchSlackTeamChannels.name)
    }

    public dynamicTaskExecution() {
        const job = new CronJob(`2 * * * * *`, () => {
            this.logger.warn('dynamic task execution', ':::::')
        })

        this.schedulerRegistry.addCronJob('dynamic', job)
        this.logger.warn(`job added!`)
    }
}
