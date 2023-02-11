import {ChannelService} from '../channel/channel.service'
import {TeamService} from '../team/team.service'
import {MessageService} from '../message/message.service'
import {DiscordService} from '../discord/discord.service'
import {AppConfigService} from 'src/config/config.service'
import {Inject, Injectable} from '@nestjs/common'
import {App, GenericMessageEvent, LogLevel, ReactionAddedEvent, RespondFn, SayFn, StaticSelectAction} from '@slack/bolt'
import {WINSTON_MODULE_PROVIDER} from 'nest-winston'
import {Logger} from 'winston'
import {Transactional} from 'typeorm-transactional'
import {UserService} from 'src/user/user.service'
import {RespondService} from '../respond/respond.service'
import {PlainTextOption} from '@slack/types'

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
        this.registerViewSubmissionListener()

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

        this.#slackBotInstance.command('/coretime', async ({ack, context, say}) => {
            const team = await this.teamService.findOneBySlackId(context.teamId!)
            if (!team) {
                await say("team doesn't exist in our database yet")
                return
            }

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
            const team = await this.teamService.findOneBySlackId(context.teamId!)
            if (!team) {
                await say("team doesn't exist in our database yet")
                return
            }

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
                    },
                },
            })

            await ack()
        })

        this.#slackBotInstance.command('/statistics', async ({ack, say, context, client, body}) => {
            const now = new Date()
            const currentYear = now.getFullYear()
            const currentMonth = now.getMonth()

            const channels = await this.channelService.findByTeamSlackId(body.team_id)

            console.log(currentYear, currentMonth)

            const yearOptions: PlainTextOption[] = []
            for (let diff = 0; diff < 10; diff++) {
                const yearStr = (currentYear - diff).toString()
                yearOptions.push({
                    text: {
                        type: 'plain_text',
                        text: yearStr,
                    },
                    value: yearStr,
                })
            }

            const monthOptions: PlainTextOption[] = []
            for (let month = 1; month < 12; month++) {
                monthOptions.push({
                    text: {
                        type: 'plain_text',
                        text: month.toString(),
                    },
                    value: month.toString(),
                })
            }

            try {
                await client.views.open({
                    token: this.configService.getSlackConfig().TOKEN,
                    trigger_id: body.trigger_id,
                    view: {
                        type: 'modal',
                        callback_id: 'statistics_view',
                        title: {
                            type: 'plain_text',
                            text: 'Enter target year/month',
                        },
                        blocks: [
                            {
                                type: 'input',
                                block_id: 'year_select_block',
                                element: {
                                    type: 'static_select',
                                    initial_option: {
                                        text: {
                                            type: 'plain_text',
                                            text: currentYear.toString(),
                                        },
                                        value: currentYear.toString(),
                                    },
                                    options: yearOptions,
                                    action_id: 'year_select_action',
                                },
                                label: {
                                    type: 'plain_text',
                                    text: 'Year',
                                },
                            },
                            {
                                type: 'input',
                                block_id: 'month_select_block',
                                element: {
                                    type: 'static_select',
                                    initial_option: {
                                        text: {
                                            type: 'plain_text',
                                            text: currentMonth.toString(),
                                        },
                                        value: currentMonth.toString(),
                                    },
                                    options: monthOptions,
                                    action_id: 'month_select_action',
                                },
                                label: {
                                    type: 'plain_text',
                                    text: 'Month',
                                },
                            },
                            {
                                type: 'input',
                                block_id: 'channel_select_block',
                                element: {
                                    type: 'static_select',
                                    initial_option: {
                                        text: {
                                            type: 'plain_text',
                                            text: channels.filter(e => e.channelId === body.channel_id)[0].name,
                                        },
                                        value: body.channel_id,
                                    },
                                    options: channels.map((channel): PlainTextOption => ({text: {type: 'plain_text', text: channel.name}, value: channel.channelId})),
                                    action_id: 'channel_select_action',
                                },
                                label: {
                                    type: 'plain_text',
                                    text: 'Channel to post',
                                },
                            },
                        ],
                        submit: {
                            type: 'plain_text',
                            text: 'Submit',
                        },
                    },
                })
            } catch (err) {
                console.log(err)
                console.log(err.data)
            } finally {
                await ack()
            }
        })
    }

    private registerActionHandler() {
        this.#slackBotInstance.action('coretime_start_change', async ({ack, respond, action, context, say}) => {
            action = action as StaticSelectAction
            await this.handleAction('coreTimeStart', action, context.teamId, respond, say)
            await ack()
        })

        this.#slackBotInstance.action('coretime_end_change', async ({ack, respond, action, context, say}) => {
            action = action as StaticSelectAction
            await this.handleAction('coreTimeEnd', action, context.teamId, respond, say)
            await ack()
        })
    }

    @Transactional()
    private async handleAction(columnType: 'coreTimeStart' | 'coreTimeEnd', action: StaticSelectAction, teamId: string | undefined, respond: RespondFn, say: SayFn) {
        if (!teamId) {
            await respond('error')
            return
        }
        const value = +action.selected_option.value
        await this.teamService.updateTeamBySlackId(teamId, {[columnType]: value})
        await say(`core time ${columnType === 'coreTimeStart' ? 'start' : 'end'} hour changed to ${action.selected_option.value}`)
    }

    private registerMessageEventListener() {
        this.#slackBotInstance.message(/.*/, async ({message, client, context, event, payload, say}) => {
            message = message as GenericMessageEvent
            if (message.subtype) return

            const teamId = context.teamId
            if (!teamId) {
                this.logger.error('team not found')
                return
            }

            if (message.thread_ts) {
                await this.onThreadMessage(message)
                return
            }

            const channelMembersResponse = await client.conversations.members({channel: message.channel})
            if (!channelMembersResponse.ok) {
                await this.sendSlackApiError(new Error('channel member api error'))
                return
            }
            const channelMembers = channelMembersResponse.members || []
            await this.onMessage(message, teamId, channelMembers)
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

    private registerViewSubmissionListener() {
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

        this.#slackBotInstance.view('statistics_view', async ({ack, context, view, client, body, payload}) => {
            console.log(payload)
            console.log(payload.state.values['year_select_block'])
            const year = payload.state.values['year_select_block']['year_select_action'].selected_option!.value
            const month = payload.state.values['month_select_block']['month_select_action'].selected_option!.value
            const channel = payload.state.values['channel_select_block']['channel_select_action'].selected_option!.value
            console.log(year, month, channel)
            try {
                await client.chat.postMessage({
                    text: 'statistics_view',
                    channel,
                })
            } catch (err) {
                console.log(err.data)
            } finally {
                await ack()
            }
        })
    }

    private async sendSlackApiError(error: any) {
        return this.discordService.sendMessage(SlackService.name, error.message, [{name: 'stack', value: error.stack.substr(0, 1024)}])
    }

    private async isCoreTime(teamId: string): Promise<boolean> {
        const team = await this.teamService.findOneBySlackId(teamId)
        if (!team) return false

        const currentHour = new Date().getHours()
        return !(currentHour < team.coreTimeStart || currentHour > team.coreTimeEnd)
    }

    @Transactional()
    private async onMessage(message: GenericMessageEvent, teamId: string, channelMembers: string[]) {
        if (!(await this.isCoreTime(teamId))) {
            this.logger.warn('Current time is not core-time')
            return
        }

        const slackUserId = message.user
        const user = await this.userService.findBySlackId(slackUserId)
        if (!user) {
            await this.sendSlackApiError(new Error(`user not found`))
            return
        }

        const team = await this.teamService.findOneBySlackId(teamId)
        if (!team) {
            await this.sendSlackApiError(new Error(`team not found`))
            return
        }

        const channel = await this.channelService.findOneBySlackId(message.channel)
        if (!channel) {
            await this.sendSlackApiError(new Error(`channel not found`))
            return
        }

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
                if (msg.user.id === user.id) return
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

        const channel = await this.channelService.findOneBySlackId(message.channel)
        if (!channel) {
            await this.sendSlackApiError(new Error(`thread reply message user not found`))
            return
        }

        const parentMessage = await this.messageService.findByChannelIdAndTimestamp(channel.id, message.thread_ts as string)
        if (!parentMessage) {
            await this.sendSlackApiError(new Error(`parent message not found`))
            return
        }

        if (parentMessage.user.slackId === message.user) {
            this.logger.verbose('thread message to self, skipping ...')
            return
        }

        const timeTaken = +message.ts - +parentMessage.timestamp
        return this.respondService.update({messageId: parentMessage.id, userId: parentMessage.user.id, timestamp: message.ts, timeTaken})
    }

    @Transactional()
    private async onEmojiRespond(event: ReactionAddedEvent) {
        if (event.item.type !== 'message') return

        const channel = await this.channelService.findOneBySlackId(event.item.channel)
        if (!channel) {
            await this.sendSlackApiError(new Error(`${this.registerReactionEventListener.name} - channel not found: ${event.item.channel}`))
            return
        }
        const targetMessage = await this.messageService.findByChannelIdAndTimestamp(channel.id, event.item.ts)
        if (!targetMessage) {
            await this.sendSlackApiError(new Error(`${this.registerReactionEventListener.name} - target message not found`))
            return
        }

        if (targetMessage.user.slackId === event.user) {
            this.logger.verbose('emoji response to self, skipping ...')
            return
        }

        const timeTaken = +event.event_ts - +targetMessage.timestamp
        return this.respondService.update({messageId: targetMessage.id, userId: targetMessage.user.id, timestamp: event.event_ts, timeTaken})
    }

    @Transactional()
    public async fetchTeams() {
        const response = await this.#slackBotInstance.client.team.info()
        if (!response.ok || !response.team || !response.team.id) {
            await this.sendSlackApiError(new Error(`slack api error - ${this.fetchTeams.name}`))
            return
        }
        const check = await this.teamService.findOneBySlackId(response.team.id)
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

            const check = await this.channelService.findOneBySlackId(channel.id)

            if (check) {
                //TODO update user when info mismatches
                continue
            }

            const team = await this.teamService.findOneBySlackId(channel.context_team_id!)
            if (!team) {
                await this.sendSlackApiError(new Error(`${this.fetchChannels.name} - team not found`))
                return
            }

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

            const team = await this.teamService.findOneBySlackId(user.team_id!)
            if (!team) {
                await this.sendSlackApiError(new Error(`${this.fetchChannels.name} - team not found`))
                return
            }

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
