import {MessageService} from './../message/message.service'
import {DiscordService} from '../discord/discord.service'
import {AppConfigService} from 'src/config/config.service'
import {Inject, Injectable} from '@nestjs/common'
import {App, GenericMessageEvent} from '@slack/bolt'
import {WINSTON_MODULE_PROVIDER} from 'nest-winston'
import {Logger} from 'winston'
import {Transactional} from 'typeorm-transactional'
import {UserService} from 'src/user/user.service'

@Injectable()
export class SlackService {
    #slackBotInstance: App

    constructor(
        private readonly configService: AppConfigService,
        private readonly userService: UserService,
        private readonly messageService: MessageService,
        private readonly discordService: DiscordService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) {
        const config = this.configService.getSlackConfig()

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
        this.#slackBotInstance.message(/.*/, async ({message, client, context, event, payload, say}) => {
            if (message.subtype) return

            const genericMessage = message as GenericMessageEvent
            console.log(genericMessage)

            const teamId = context.teamId
            if (!teamId) {
                this.logger.info('team not found')
                return
            }
            // console.log({channelId: message.channel, channelType: message.channel_type, teamId})

            await this.onMessage(genericMessage, teamId)

            const channelMembersResponse = await client.conversations.members({channel: message.channel})
            if (!channelMembersResponse.ok) {
                this.sendSlackApiError(new Error('channel member api error'))
                return
            }
            const channelMembers = channelMembersResponse.members || []
            console.log(channelMembers)
        })
    }

    private sendSlackApiError(error: any) {
        this.discordService.sendMessage(SlackService.name, error.message, [{name: 'stack', value: error.stack.substr(0, 1024)}])
    }

    @Transactional()
    private async onMessage(message: GenericMessageEvent, teamId: string) {
        //TODO channel name retrieve 방법 - cron
        const slackUserId = message.user
        const user = await this.userService.findBySlackUserId(slackUserId)
        if (!user) this.sendSlackApiError(new Error(`user not found`))

        await this.messageService.create({
            messageId: message.client_msg_id || '',
            type: message.type,
            textContent: message.text || '',
            userId: user.id,
            timestamp: message.ts,
            channelId: message.channel,
            channelName: '',
            channelType: message.channel_type,
            teamId,
        })

        //TODO 채널 멤버들의 reaction 일괄 생성
    }

    @Transactional()
    public async fetchUsers() {
        const response = await this.#slackBotInstance.client.users.list()
        if (!response.ok || !response.members) {
            this.sendSlackApiError(new Error(`slack api error - ${this.fetchUsers.name}`))
            return
        }

        for (const user of response.members) {
            if (user.is_bot || user.is_restricted || user.is_ultra_restricted || !user.is_email_confirmed || !user.id) {
                this.logger.error('user is not qualified', user)
                continue
            }

            const check = await this.userService.findBySlackUserId(user.id)
            if (check) {
                //TODO update user when info mismatches
                continue
            }

            await this.userService.create({
                slackId: user.id,
                teamId: user.team_id || '',
                name: user.name || '',
                realName: user.real_name || '',
                phone: user.profile?.phone || null,
                timeZone: user.tz || '',
            })
        }
    }

    @Transactional()
    public fetchTeams() {
        //TODO fetch teams
        console.log('TODO')
    }

    @Transactional()
    public async fetchChannels() {
        //TODO fetch channels
        const response = await this.#slackBotInstance.client.conversations.list()
        if (!response.ok || !response.channels) {
            this.sendSlackApiError(new Error(`slack api error - ${this.fetchChannels.name}`))
            return
        }

        for (const channel of response.channels) {
        }

        return response.channels
    }
}
