import {ChannelService} from '../channel/channel.service'
import {TeamService} from '../team/team.service'
import {MessageService} from '../message/message.service'
import {DiscordService} from '../discord/discord.service'
import {AppConfigService} from 'src/config/config.service'
import {Inject, Injectable} from '@nestjs/common'
import {App, GenericMessageEvent} from '@slack/bolt'
import {WINSTON_MODULE_PROVIDER} from 'nest-winston'
import {Logger} from 'winston'
import {Transactional} from 'typeorm-transactional'
import {UserService} from 'src/user/user.service'
import {RespondService} from '../respond/respond.service'

@Injectable()
export class SlackService {
    #slackBotInstance: App

    constructor(
        private readonly configService: AppConfigService,
        private readonly userService: UserService,
        private readonly teamService: TeamService,
        private readonly channelService: ChannelService,
        private readonly messageService: MessageService,
        private readonly respondService: RespondService,
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
        this.registerMessageEventListener()
        this.registerReactionEventListener()

        this.#slackBotInstance
            .start()
            .then(() => this.logger.verbose('✅  SlackModule instance initialized'))
            .catch(error => {
                this.logger.error('error caught', error)
                discordService.sendMessage(SlackService.name, 'initialization error', error).then()
            })
    }

    private registerCommands() {
        //TODO serve statistics by slash command
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

    private registerMessageEventListener() {
        this.#slackBotInstance.message(/.*/, async ({message, client, context, event, payload, say}) => {
            if (message.subtype) return

            const teamId = context.teamId
            if (!teamId) {
                this.logger.error('team not found')
                return
            }

            if (message.thread_ts) {
                await this.onThreadMessage(message as GenericMessageEvent)
                return
            }

            const genericMessage = message as GenericMessageEvent

            const channelMembersResponse = await client.conversations.members({channel: message.channel})
            if (!channelMembersResponse.ok) {
                await this.sendSlackApiError(new Error('channel member api error'))
                return
            }
            const channelMembers = channelMembersResponse.members || []
            await this.onMessage(genericMessage, teamId, channelMembers)
        })
    }

    private registerReactionEventListener() {
        //TODO emoji respond
        this.#slackBotInstance.event('reaction_added', async ({event, context, body}) => {
            console.log('::::::::::::::::::::::')
            console.log(body)
        })
    }

    private async sendSlackApiError(error: any) {
        return this.discordService.sendMessage(SlackService.name, error.message, [{name: 'stack', value: error.stack.substr(0, 1024)}])
    }

    @Transactional()
    private async onMessage(message: GenericMessageEvent, teamId: string, channelMembers: string[]) {
        const slackUserId = message.user
        const user = await this.userService.findBySlackId(slackUserId)
        if (!user) {
            await this.sendSlackApiError(new Error(`user not found`))
            return
        }

        const channel = await this.channelService.findBySlackId(message.channel)
        const team = await this.teamService.findBySlackId(teamId)

        const msg = await this.messageService.create({
            messageId: message.client_msg_id || '',
            type: message.type,
            textContent: message.text || '',
            userId: user.id,
            timestamp: message.ts,
            channelId: channel.id,
            channelName: '',
            channelType: message.channel_type,
            teamId: team.id,
        })

        await Promise.all(
            channelMembers.map(async member => {
                const user = await this.userService.findBySlackId(member)
                if (!user) return
                return this.respondService.create({channelId: channel.id, messageId: msg.id, teamId: team.id, userId: user.id})
            }),
        )
    }

    @Transactional()
    private async onThreadMessage(message: GenericMessageEvent) {
        const parentMessage = await this.messageService.findByTimestamp(message.thread_ts as string)
        if (!parentMessage) {
            await this.sendSlackApiError(new Error(`parent message not found`))
            return
        }
        const user = await this.userService.findBySlackId(message.user)
        if (!user) {
            await this.sendSlackApiError(new Error(`thread reply message user not found`))
            return
        }

        return this.respondService.update(parentMessage.id, {userId: user.id, timestamp: message.ts})
    }

    @Transactional()
    public async fetchTeams() {
        const response = await this.#slackBotInstance.client.team.info()
        if (!response.ok || !response.team || !response.team.id) {
            await this.sendSlackApiError(new Error(`slack api error - ${this.fetchTeams.name}`))
            return
        }
        const check = await this.teamService.findBySlackId(response.team.id)
        if (check) {
            //TODO update user when info mismatches
            return
        }
        await this.teamService.create({
            teamId: response.team.id,
            name: response.team.name || '',
            url: response.team.url || '',
            domain: response.team.domain || '',
        })
    }

    @Transactional()
    public async fetchChannels() {
        const response = await this.#slackBotInstance.client.conversations.list()
        if (!response.ok || !response.channels) {
            await this.sendSlackApiError(new Error(`slack api error - ${this.fetchChannels.name}`))
            return
        }

        for (const channel of response.channels) {
            if (!channel.id || !channel.is_channel) {
                this.logger.error('channel is not qualified', channel)
                continue
            }

            const check = await this.channelService.findBySlackId(channel.id)

            if (check) {
                //TODO update user when info mismatches
                continue
            }

            const team = await this.teamService.findBySlackId(channel.context_team_id || '')

            await this.channelService.create({
                channelId: channel.id,
                name: channel.name || '',
                teamId: team.id,
            })
        }

        return response.channels
    }

    @Transactional()
    public async fetchUsers() {
        const response = await this.#slackBotInstance.client.users.list()
        if (!response.ok || !response.members) {
            await this.sendSlackApiError(new Error(`slack api error - ${this.fetchUsers.name}`))
            return
        }

        for (const user of response.members) {
            if (user.is_bot || user.is_restricted || user.is_ultra_restricted || !user.is_email_confirmed || !user.id) {
                this.logger.error('user is not qualified', user)
                continue
            }

            const check = await this.userService.findBySlackId(user.id)
            if (check) {
                //TODO update user when info mismatches
                continue
            }

            const team = await this.teamService.findBySlackId(user.team_id || '')
            await this.userService.create({
                slackId: user.id,
                teamId: team.id,
                name: user.name || '',
                realName: user.real_name || '',
                phone: user.profile?.phone || null,
                timeZone: user.tz || '',
            })
        }
    }
}
