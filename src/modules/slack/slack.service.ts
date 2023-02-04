import {AppConfigService} from 'src/config/config.service'
import {HttpException, HttpStatus, Inject, Injectable} from '@nestjs/common'
import {App} from '@slack/bolt'
import {WINSTON_MODULE_PROVIDER} from 'nest-winston'
import {Logger} from 'winston'

@Injectable()
export class SlackService {
    #slackBotApp: App

    constructor(private readonly configService: AppConfigService, @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {
        const config = configService.getSlackConfig()

        this.#slackBotApp = new App({
            appToken: config.APP_TOKEN,
            token: config.TOKEN,
            socketMode: true,
        })

        this.#slackBotApp.command('/admins', async ({ack, client}) => {
            const {members} = await client.users.list()
            const admins = members?.filter(member => member.is_admin)

            await ack({
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `${admins?.map(admin => `@${admin.name}`).join(', ')}`,
                        },
                    },
                ],
                response_type: 'ephemeral', // change to "in_channel" to make it visible to others
            })
        })

        this.#slackBotApp
            .start()
            .then(() => this.logger.info('slackBot instance initialized'))
            .catch(error => this.logger.error('error caught', error))
    }

    async findChannels() {
        const response = await this.#slackBotApp.client.apiCall('conversations.list')
        if (!response.ok) throw new HttpException({message: 'slack api error'}, HttpStatus.BAD_GATEWAY)

        return response.channels
    }
}
