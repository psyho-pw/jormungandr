import {DiscordService} from './../discord/discord.service'
import {AppConfigService} from 'src/config/config.service'
import {HttpException, HttpStatus, Inject, Injectable} from '@nestjs/common'
import {App} from '@slack/bolt'
import {WINSTON_MODULE_PROVIDER} from 'nest-winston'
import {Logger} from 'winston'

@Injectable()
export class SlackService {
    #slackBotInstance: App

    private registerCommands() {
        this.#slackBotInstance.command('/admins', async ({ack, client}) => {
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
    }

    private registerEventListener() {
        // this.#slackBotInstance.message('/.*/', async ({message, say}) => {
        //     this.logger.info('message handler:::')
        //     await say(`Hello, <@${message.channel}>`)
        // })

        this.#slackBotInstance.event('message', async ({message, say, client, event}) => {
            const {members: totalMembers} = await client.users.list()
            if (!totalMembers) {
                this.sendSlackApiError(new Error('total members fetch error'))
                return
            }

            const channel = event.channel
            const channel_type = event.channel_type
            console.log(channel, channel_type)

            const channelMembersResponse = await client.conversations.members({channel: channel})
            if (!channelMembersResponse.ok) {
                this.sendSlackApiError(new Error('channel member api error'))
                return
            }
            const channelMembers = channelMembersResponse.members || []
            console.log(channelMembers)
            console.log(totalMembers.filter(e => channelMembers.includes(e.id || '')))
        })
    }

    private sendSlackApiError(error: Error) {
        this.discordService.sendMessage(SlackService.name, error.message, error as any)
    }

    constructor(
        private readonly configService: AppConfigService,
        private readonly discordService: DiscordService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) {
        const config = configService.getSlackConfig()

        this.#slackBotInstance = new App({
            appToken: config.APP_TOKEN,
            token: config.TOKEN,
            socketMode: true,
        })

        this.registerCommands()
        this.registerEventListener()

        this.#slackBotInstance
            .start()
            .then(() => this.logger.verbose('✅ SlackModule instance initialized'))
            .catch(error => {
                this.logger.error('error caught', error)
                discordService.sendMessage(SlackService.name, 'initialization error', error)
            })
    }

    async findChannels() {
        const response = await this.#slackBotInstance.client.apiCall('conversations.list')
        if (!response.ok) throw new HttpException({message: 'slack api error'}, HttpStatus.BAD_GATEWAY)

        return response.channels
    }

    async findUsers() {
        const response = await this.#slackBotInstance.client.apiCall('users.list')
        if (!response.ok) throw new HttpException({message: 'slack api error'}, HttpStatus.BAD_GATEWAY)

        return response.members
    }
}
