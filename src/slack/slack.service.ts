import {ChannelService} from '../channel/channel.service'
import {TeamService} from '../team/team.service'
import {MessageService} from '../message/message.service'
import {DiscordService} from '../discord/discord.service'
import {AppConfigService} from 'src/config/config.service'
import {Inject, Injectable} from '@nestjs/common'
import {App, ButtonAction, GenericMessageEvent, LogLevel, ReactionAddedEvent, RespondFn, StaticSelectAction} from '@slack/bolt'
import {WINSTON_MODULE_PROVIDER} from 'nest-winston'
import {Logger} from 'winston'
import {Transactional} from 'typeorm-transactional'
import {UserService} from 'src/user/user.service'
import {RespondService} from '../respond/respond.service'
import {PlainTextElement, PlainTextOption} from '@slack/types'

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
            // logLevel: LogLevel.DEBUG,
        })

        this.registerCommands()
        this.registerMessageEventListener()
        this.registerReactionEventListener()
        this.registerActionHandler()
        this.registerViewEventListener()

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

        this.#slackBotInstance.command('/coretime', async ({ack, client, context, respond, say}) => {
            if (!context.teamId) {
                await say("team doesn't exist in our database yet")
                return
            }
            const team = await this.teamService.findBySlackId(context.teamId)

            const options: PlainTextOption[] = Array(25)
                .fill(0)
                .map((_, idx) => ({
                    text: {type: 'plain_text', text: idx.toString()},
                    value: idx.toString(),
                }))

            await say({
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `:stopwatch: current core time is between ${team.coreTimeStart} ~ ${team.coreTimeEnd}`,
                        },
                    },
                    {
                        type: 'actions',
                        elements: [
                            {
                                type: 'static_select',
                                initial_option: {
                                    text: {
                                        type: 'plain_text',
                                        text: team.coreTimeStart.toString(),
                                    },
                                    value: team.coreTimeStart.toString(),
                                },
                                options: options,
                                action_id: 'coretime_start_change',
                            },
                            {
                                type: 'static_select',
                                initial_option: {
                                    text: {
                                        type: 'plain_text',
                                        text: team.coreTimeEnd.toString(),
                                    },
                                    value: team.coreTimeEnd.toString(),
                                },
                                options: options,
                                action_id: 'coretime_end_change',
                            },
                        ],
                    },
                ],
                text: 'error',
            })
            await ack()
        })

        this.#slackBotInstance.command('/respond-time', async ({ack, say, context, respond, client, body}) => {
            if (!context.teamId) {
                await say("team doesn't exist in our database yet")
                return
            }
            const team = await this.teamService.findBySlackId(context.teamId)

            await client.views.open({
                token: this.configService.getSlackConfig().TOKEN,
                trigger_id: body.trigger_id,
                view: {
                    type: 'modal',
                    callback_id: 'max_respond_time_view',
                    title: {
                        type: 'plain_text',
                        text: 'Set max respond time',
                    },
                    blocks: [
                        {
                            type: 'input',
                            block_id: 'max_respond_time_block',
                            element: {
                                type: 'number_input',
                                is_decimal_allowed: false,
                                action_id: 'number_input-action',
                                min_value: '180',
                                max_value: '1800',
                                placeholder: {
                                    type: 'plain_text',
                                    text: '최대로 설정할 반응 시간을 초단위로 입력',
                                },
                            },
                            label: {
                                type: 'plain_text',
                                text: `:stopwatch: current max respond time is ${team.maxRespondTime} (seconds)`,
                                emoji: true,
                            },
                        },
                    ],
                    submit: {
                        type: 'plain_text',
                        text: 'Submit',
                        // action_id: 'max_respond_time_change',
                    },
                },
            })

            await ack()
        })
    }

    private registerActionHandler() {
        this.#slackBotInstance.action('coretime_start_change', async ({ack, respond, action, context, say}) => {
            action = action as StaticSelectAction
            const teamId = context.teamId
            if (!teamId) {
                await respond('error')
                return
            }
            await this.handleAction('coreTimeStart', action, teamId)
            await say('core time start hour changed')
            await ack()
        })

        this.#slackBotInstance.action('coretime_end_change', async ({ack, respond, action, context, say}) => {
            action = action as StaticSelectAction
            const teamId = context.teamId
            if (!teamId) {
                await respond('error')
                return
            }
            await this.handleAction('coreTimeEnd', action, teamId)
            await say('core time end hour changed')
            await ack()
        })
    }

    private async handleAction(columnType: 'coreTimeStart' | 'coreTimeEnd', action: StaticSelectAction, teamId: string) {
        const value = +action.selected_option.value
        await this.teamService.updateTeamBySlackId(teamId, {[columnType]: value})
    }

    private registerMessageEventListener() {
        this.#slackBotInstance.message(/.*/, async ({message, client, context, event, payload, say}) => {
            if (message.subtype) return

            const teamId = context.teamId
            if (!teamId) {
                this.logger.error('team not found')
                return
            }
            if (!(await this.isCoreTime(teamId))) {
                this.logger.warn('Current time is not core-time')
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
        this.#slackBotInstance.event('reaction_added', async ({event}) => {
            await this.onEmojiRespond(event)
        })

        this.#slackBotInstance.event('reaction_removed', async ({event, client}) => {
            //TODO when removed?
            console.log('removed')
        })
    }

    private registerViewEventListener() {
        this.#slackBotInstance.view('max_respond_time_view', async ({ack, context, view, client, body}) => {
            await ack()
            if (!context.teamId) {
                await client.chat.postMessage({
                    text: "team doesn't exist in our database yet",
                    channel: body.user.id,
                })
                return
            }

            const inputValue = view.state.values['max_respond_time_block']['number_input-action'].value
            if (!inputValue) {
                await this.sendSlackApiError(new Error('input value is empty'))
                return
            }

            await this.teamService.updateTeamBySlackId(context.teamId, {maxRespondTime: +inputValue})

            await client.chat.postMessage({
                text: 'max respond time is now ' + inputValue,
                channel: body.user.id,
            })
        })
    }

    private async sendSlackApiError(error: any) {
        return this.discordService.sendMessage(SlackService.name, error.message, [{name: 'stack', value: error.stack.substr(0, 1024)}])
    }

    private async isCoreTime(teamId: string): Promise<boolean> {
        const team = await this.teamService.findBySlackId(teamId)
        if (!team) return false

        const currentHour = new Date().getHours()
        return !(currentHour < team.coreTimeStart || currentHour > team.coreTimeEnd)
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
        if (!(await this.isCoreTime(message.team || ''))) {
            this.logger.warn('Current time is not core-time')
            return
        }

        const channel = await this.channelService.findBySlackId(message.channel)
        const parentMessage = await this.messageService.findByChannelIdAndTimestamp(channel.id, message.thread_ts as string)
        if (!parentMessage) {
            await this.sendSlackApiError(new Error(`parent message not found`))
            return
        }
        const user = await this.userService.findBySlackId(message.user)
        if (!user) {
            await this.sendSlackApiError(new Error(`thread reply message user not found`))
            return
        }

        const timeTaken = +message.ts - +parentMessage.timestamp
        return this.respondService.update({messageId: parentMessage.id, userId: user.id, timestamp: message.ts, timeTaken})
    }

    @Transactional()
    private async onEmojiRespond(event: ReactionAddedEvent) {
        if (event.item.type !== 'message') return

        const channel = await this.channelService.findBySlackId(event.item.channel)
        const targetMessage = await this.messageService.findByChannelIdAndTimestamp(channel.id, event.item.ts)
        if (!targetMessage) {
            await this.sendSlackApiError(new Error(`${this.registerReactionEventListener.name} - target message not found`))
            return
        }

        const user = await this.userService.findBySlackId(event.user)
        if (!user) {
            await this.sendSlackApiError(new Error(`${this.registerReactionEventListener.name} - user not found`))
            return
        }

        const timeTaken = +event.event_ts - +targetMessage.timestamp
        return this.respondService.update({messageId: targetMessage.id, userId: user.id, timestamp: event.event_ts, timeTaken})
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
