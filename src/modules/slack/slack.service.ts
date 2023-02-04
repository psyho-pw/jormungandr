import {HttpException, HttpStatus, Inject, Injectable} from '@nestjs/common'
import {App} from '@slack/bolt'
import {WINSTON_MODULE_PROVIDER} from 'nest-winston'
import {Logger} from 'winston'

@Injectable()
export class SlackService {
    #slackBotApp: App

    constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {
        this.#slackBotApp = new App({
            appToken: 'xapp-1-A04N4U81XU4-4763240243633-242f79806283c9f8d81da333cdfe5dbc78ef2326d351eb7e880912936fea7d59',
            token: 'xoxb-281970474948-4752960874004-1t3xu5X9gPcwqiVGCFzAi5vO',
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
