import {ChannelService} from '../channel/channel.service'
import {TeamService} from '../team/team.service'
import {MessageService} from '../message/message.service'
import {DiscordService} from '../discord/discord.service'
import {AppConfigService} from 'src/config/config.service'
import {Inject, Injectable} from '@nestjs/common'
import {
    App,
    CodedError,
    GenericMessageEvent,
    MessageDeletedEvent,
    StaticSelectAction,
    subtype,
} from '@slack/bolt'
import {WINSTON_MODULE_PROVIDER} from 'nest-winston'
import {Logger} from 'winston'
import {Transactional} from 'typeorm-transactional'
import {UserService} from 'src/user/user.service'
import {RespondService} from '../respond/respond.service'
import {PlainTextOption} from '@slack/bolt'
import {SlackException} from '../common/exceptions/slack.exception'
import {
    SlackActionArgs,
    SlackCommandArgs,
    SlackReactionAddEventArgs,
    SlackMessageArgs,
    SlackViewSubmitArgs,
    SlackReactionRemoveEventArgs,
} from './slack.type'
import {User} from '../user/entities/user.entity'
import {SlackErrorHandler} from '../common/decorators/slackErrorHandler.decorator'
import {Cron, CronExpression} from '@nestjs/schedule'
import {Channel} from '../channel/entities/channel.entity'

@Injectable()
export class SlackService {
    private slackBotInstance: App

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

        this.slackBotInstance = new App({
            appToken: config.APP_TOKEN,
            token: config.TOKEN,
            socketMode: true,
            // logLevel: LogLevel.DEBUG,
        })

        this.slackBotInstance.command('/coretime', args => this.onCoreTimeCommand(args))
        this.slackBotInstance.command('/respond-time', args => this.onRespondTimeCommand(args))
        this.slackBotInstance.command('/statistics', args => this.onStatisticsCommand(args))

        this.slackBotInstance.message(/.*/, args => this.onMessageEvent(args))
        this.slackBotInstance.message(subtype('message_deleted'), args => this.onMessageEvent(args))

        this.slackBotInstance.event('reaction_added', args => this.onEmojiRespond(args))
        this.slackBotInstance.event('reaction_removed', args => this.onEmojiRemove(args))

        this.slackBotInstance.action('coretime_start_change', args =>
            this.onCoretimeChange({...args, columnType: 'coreTimeStart'}),
        )
        this.slackBotInstance.action('coretime_end_change', args =>
            this.onCoretimeChange({...args, columnType: 'coreTimeEnd'}),
        )

        this.slackBotInstance.view('max_respond_time_view', args =>
            this.onRespondTimeViewSubmit(args),
        )
        this.slackBotInstance.view('statistics_view', args => this.onStatisticsViewSubmit(args))

        this.slackBotInstance
            .start()
            .then(() => this.logger.verbose('✅  SlackModule instance initialized'))
            .catch(error => {
                this.logger.error('initialization error', error)
                this.sendSlackApiError(error).then()
            })

        this.slackBotInstance.error(async (error: CodedError) => {
            this.logger.error(error)
            await this.sendSlackApiError(error)
        })
    }

    private async sendSlackApiError(error: CodedError) {
        const original = error.original as any
        let scope: string
        if (original?.status) {
            const response = original.getResponse()
            scope = `${response.callClass}.${response.callMethod}`
        } else scope = `${SlackService.name}.unhandledException`

        return this.discordService.sendMessage(error.message, scope, [
            {name: 'stack', value: error.stack?.substring(0, 1024) || ''},
        ])
    }

    @Cron(CronExpression.MONDAY_TO_FRIDAY_AT_12PM)
    @Transactional()
    private async fetchSlackInfo() {
        await this.fetchTeams()
        await this.fetchChannels()
        await this.fetchUsers()

        this.logger.verbose('Slack data fetched')
    }

    @SlackErrorHandler()
    @Transactional()
    private async onCoreTimeCommand({ack, context, say}: SlackCommandArgs): Promise<void> {
        if (!context.teamId) throw new SlackException('context does not have teamId')

        const team = await this.teamService.findOneBySlackId(context.teamId)
        if (!team) {
            const errMsg = "Team doesn't exist in our database yet"
            await say(errMsg)
            throw new SlackException(errMsg)
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
                                text: {type: 'plain_text', text: team.coreTimeStart.toString()},
                                value: team.coreTimeStart.toString(),
                            },
                            options: options,
                            action_id: 'coretime_start_change',
                        },
                        {
                            type: 'static_select',
                            initial_option: {
                                text: {type: 'plain_text', text: team.coreTimeEnd.toString()},
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
        return ack()
    }

    @SlackErrorHandler()
    @Transactional()
    private async onRespondTimeCommand({ack, say, context, client, body}: SlackCommandArgs) {
        if (!context.teamId) throw new SlackException('context does not have teamId')

        const team = await this.teamService.findOneBySlackId(context.teamId)
        if (!team) {
            const errMsg = "Team doesn't exist in our database yet"
            await say(errMsg)
            throw new SlackException(errMsg)
        }

        await client.views.open({
            token: this.configService.getSlackConfig().TOKEN,
            trigger_id: body.trigger_id,
            view: {
                type: 'modal',
                callback_id: 'max_respond_time_view',
                title: {type: 'plain_text', text: 'Set max respond time'},
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
                submit: {type: 'plain_text', text: 'Submit'},
            },
        })
        return ack()
    }

    @SlackErrorHandler()
    @Transactional()
    private async onStatisticsCommand({ack, client, body}: SlackCommandArgs) {
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1

        const channels = await this.channelService.findByTeamSlackId(body.team_id)

        const yearOptions: PlainTextOption[] = []
        for (let diff = 0; diff < 10; diff++) {
            const yearStr = (currentYear - diff).toString()
            yearOptions.push({text: {type: 'plain_text', text: yearStr}, value: yearStr})
        }

        const monthOptions: PlainTextOption[] = []
        for (let month = 1; month < 12; month++)
            monthOptions.push({
                text: {type: 'plain_text', text: month.toString()},
                value: month.toString(),
            })

        await client.views.open({
            token: this.configService.getSlackConfig().TOKEN,
            trigger_id: body.trigger_id,
            view: {
                type: 'modal',
                callback_id: 'statistics_view',
                title: {type: 'plain_text', text: 'Enter target year/month'},
                blocks: [
                    {
                        type: 'input',
                        block_id: 'year_select_block',
                        element: {
                            type: 'static_select',
                            initial_option: {
                                text: {type: 'plain_text', text: currentYear.toString()},
                                value: currentYear.toString(),
                            },
                            options: yearOptions,
                            action_id: 'year_select_action',
                        },
                        label: {type: 'plain_text', text: 'Year'},
                    },
                    {
                        type: 'input',
                        block_id: 'month_select_block',
                        element: {
                            type: 'static_select',
                            initial_option: {
                                text: {type: 'plain_text', text: currentMonth.toString()},
                                value: currentMonth.toString(),
                            },
                            options: monthOptions,
                            action_id: 'month_select_action',
                        },
                        label: {type: 'plain_text', text: 'Month'},
                    },
                    {
                        type: 'input',
                        block_id: 'channel_select_block',
                        element: {
                            type: 'static_select',
                            initial_option: {
                                text: {
                                    type: 'plain_text',
                                    text: channels.filter(e => e.channelId === body.channel_id)[0]
                                        .name,
                                },
                                value: body.channel_id,
                            },
                            options: channels.flatMap(
                                (channel, idx): Array<PlainTextOption> =>
                                    idx < 100
                                        ? [
                                              {
                                                  text: {type: 'plain_text', text: channel.name},
                                                  value: channel.channelId,
                                              },
                                          ]
                                        : [],
                            ),
                            action_id: 'channel_select_action',
                        },
                        label: {type: 'plain_text', text: 'Channel to post'},
                    },
                ],
                submit: {type: 'plain_text', text: 'Submit'},
            },
        })
        return ack()
    }

    @SlackErrorHandler()
    @Transactional()
    private async onCoretimeChange({ack, action, context, say, columnType}: SlackActionArgs) {
        if (!context.teamId) throw new SlackException('teamId is required')

        action = action as StaticSelectAction
        const value = +action.selected_option.value
        await this.teamService.updateTeamBySlackId(context.teamId, {[columnType]: value})

        await say(
            `core time ${columnType === 'coreTimeStart' ? 'start' : 'end'} hour changed to ${
                action.selected_option.value
            }`,
        )
        return ack()
    }

    @SlackErrorHandler()
    @Transactional()
    private async onMessageEvent({message, client, context}: SlackMessageArgs) {
        if (message.subtype) {
            this.logger.debug('message subtype', {subtype: message.subtype})
            if (message.subtype === 'message_deleted') await this.onMessageDelete(message)
            return
        }

        const teamId = context.teamId
        if (!teamId) {
            const errMsg = 'Team not found in message context'
            this.logger.error(errMsg)
            throw new SlackException(errMsg)
        }

        if (message.thread_ts) {
            await this.onThreadMessage(message)
            return
        }

        const channelMembersResponse = await client.conversations.members({
            channel: message.channel,
        })
        if (!channelMembersResponse.ok) throw new SlackException('Slack api error - channel member')

        const channelMembers = channelMembersResponse.members || []
        await this.onMessage(message, teamId, channelMembers)
    }

    @SlackErrorHandler()
    @Transactional()
    private async isCoreTime(teamId: string): Promise<boolean> {
        const team = await this.teamService.findOneBySlackId(teamId)
        if (!team) return false

        const currentHour = new Date().getHours()
        return !(currentHour < team.coreTimeStart || currentHour > team.coreTimeEnd)
    }

    @SlackErrorHandler()
    @Transactional()
    private async onThreadMessage(message: GenericMessageEvent) {
        if (!(await this.isCoreTime(message.team || ''))) {
            this.logger.warn('Current time is not core-time')
            return
        }

        this.logger.verbose('onThreadMessage triggered')

        const parentMessage = await this.messageService.findByChannelIdAndTimestamp(
            message.channel,
            message.thread_ts as string,
        )
        if (!parentMessage) throw new SlackException('parent message not found')

        if (parentMessage.user.slackId === message.user) {
            this.logger.verbose('thread message to self, skipping ...')
            return
        }

        const user = await this.userService.findBySlackId(message.user)
        if (!user) throw new SlackException('user not found by slackId')

        return this.respondService.update({
            messageId: parentMessage.id,
            userId: user.id,
            timestamp: message.ts,
            maxRespondTime: user.team.maxRespondTime,
        })
    }

    @SlackErrorHandler()
    @Transactional()
    private async onMessage(
        message: GenericMessageEvent,
        teamId: string,
        channelMembers: string[],
    ) {
        if (!(await this.isCoreTime(teamId))) {
            this.logger.warn('Current time is not core-time')
            return
        }

        const userMap = new Map<string, User>()
        const users = await this.userService.findBySlackIds(channelMembers)
        users.forEach(user => userMap.set(user.slackId, user))

        const slackUserId = message.user
        const user = userMap.get(slackUserId)
        if (!user) throw new SlackException('user not found')

        const channel = await this.channelService.findOneBySlackId(message.channel)
        if (!channel) throw new SlackException('channel not found')

        const msg = await this.messageService.create({
            messageId: message.client_msg_id || '',
            type: message.type,
            textContent: message.text || '',
            userId: user.id,
            timestamp: message.ts,
            channelId: channel.id,
            channelName: '',
            channelType: message.channel_type,
            teamId: user.team.id,
        })

        const promises = channelMembers.map(async member => {
            const user = userMap.get(member)
            if (!user) return []
            if (msg.user.id === user.id) return []
            return [
                this.respondService.makeRespond({
                    channelId: channel.id,
                    messageId: msg.id,
                    teamId: user.team.id,
                    userId: user.id,
                    team: user.team,
                }),
            ]
        })

        const responds = await Promise.all(promises).then(e => e.flat())
        return this.respondService.createMany(responds)
    }

    @SlackErrorHandler()
    @Transactional()
    private async onMessageDelete(message: MessageDeletedEvent) {
        if ('thread_ts' in message.previous_message) {
            this.logger.verbose('delete action in thread. skipping...')
            return
        }
        return this.messageService.removeByTimestamp(message.previous_message.ts)
    }

    @SlackErrorHandler()
    @Transactional()
    private async onEmojiRespond({event, context}: SlackReactionAddEventArgs) {
        this.logger.debug('onEmojiRespond triggered')

        if (!(await this.isCoreTime(context.teamId || ''))) {
            this.logger.warn('Current time is not core-time')
            return
        }
        if (event.item.type !== 'message') return

        const targetMessage = await this.messageService.findByChannelIdAndTimestamp(
            event.item.channel,
            event.item.ts,
        )
        if (!targetMessage) {
            this.logger.error('target message not found', event.item)
            return
        }

        if (targetMessage.user.slackId === event.user) {
            this.logger.verbose('emoji response to self, skipping ...')
            return
        }

        const user = await this.userService.findBySlackId(event.user)
        if (!user) throw new SlackException('user not found by slackId')

        // const timeTaken = +event.event_ts - +targetMessage.timestamp
        const queryRes = await this.respondService.update({
            messageId: targetMessage.id,
            userId: user.id,
            timestamp: event.event_ts,
            maxRespondTime: user.team.maxRespondTime,
        })
        this.logger.debug('query result', queryRes)
    }

    @SlackErrorHandler()
    @Transactional()
    private async onEmojiRemove({event}: SlackReactionRemoveEventArgs) {
        this.logger.debug('onEmojiRemove triggered')
        if (event.item.type !== 'message') {
            this.logger.verbose('removed event target is not a message. skipping...')
            return
        }

        const reactionsGetResponse = await this.slackBotInstance.client.reactions.get({
            channel: event.item.channel,
            timestamp: event.item.ts,
            full: true,
        })
        if (!reactionsGetResponse.message)
            throw new SlackException('message not found in ReactionGetResponse')

        if (event.user === reactionsGetResponse.message.user) {
            this.logger.verbose('reaction removal to self. skipping...')
            return
        }

        const reactions = reactionsGetResponse.message.reactions
        if (!reactions) {
            await this.respondService.resetTimeTaken(event.user, event.item.ts)
            return
        }

        for (const reaction of reactions) {
            const usersSet = new Set(reaction.users)
            if (usersSet.has(event.user)) return
        }
        await this.respondService.resetTimeTaken(event.user, event.item.ts)
    }

    @SlackErrorHandler()
    @Transactional()
    private async onRespondTimeViewSubmit({ack, context, view, client, body}: SlackViewSubmitArgs) {
        if (!context.teamId) {
            await client.chat.postMessage({
                text: "team doesn't exist in our database yet",
                channel: body.user.id,
            })
            return ack()
        }

        const inputValue = view.state.values['max_respond_time_block']['number_input-action'].value
        if (!inputValue) throw new SlackException('input value is empty')

        await this.teamService.updateTeamBySlackId(context.teamId, {maxRespondTime: +inputValue})

        await client.chat.postMessage({
            text: 'max respond time is now ' + inputValue,
            channel: body.user.id,
        })
        return ack()
    }

    @SlackErrorHandler()
    @Transactional()
    private async onStatisticsViewSubmit({ack, client, payload}: SlackViewSubmitArgs) {
        const year =
            payload.state.values['year_select_block']['year_select_action'].selected_option?.value
        const month =
            payload.state.values['month_select_block']['month_select_action'].selected_option?.value
        const channel =
            payload.state.values['channel_select_block']['channel_select_action'].selected_option
                ?.value
        if (!channel || !year || !month) throw new SlackException('invalid input value(s)')

        const statistics = await this.respondService.getStatistics(payload.team_id, +year, +month)

        const blocks = statistics.map((user: any, idx: number) => {
            return {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `${idx + 1}. *${user.name}(${user.realName})*\n:stopwatch: average ${
                        user.average
                    } seconds\n Ipsum Lorem ipsum`,
                },
                accessory: {
                    type: 'image',
                    image_url:
                        user.profileImage ||
                        'https://cdn.mos.cms.futurecdn.net/SDDw7CnuoUGax6x9mTo7dd-1920-80.jpg.webp',
                    alt_text: 'alt text for image',
                },
            }
        })

        await client.chat.postMessage({
            text: ':chart_with_upwards_trend:',
            icon_emoji: 'true',
            blocks: [
                {type: 'section', text: {type: 'mrkdwn', text: `*${year}년 ${month}월* 통계`}},
                {type: 'divider'},
                ...blocks,
            ],
            channel,
        })
        return ack()
    }

    @SlackErrorHandler()
    @Transactional()
    public async fetchTeams() {
        const response = await this.slackBotInstance.client.team.info()
        if (!response.ok || !response.team || !response.team.id)
            throw new SlackException('slack api error')

        const check = await this.teamService.findOneBySlackId(response.team.id)
        if (check) {
            //TODO update user when info mismatches
            return
        }
        return this.teamService.create({
            teamId: response.team.id,
            name: response.team.name || '',
            url: response.team.url || '',
            domain: response.team.domain || '',
        })
    }

    @SlackErrorHandler()
    @Transactional()
    public async fetchChannels() {
        const response = await this.slackBotInstance.client.conversations.list()
        if (!response.ok || !response.channels) throw new SlackException('slack api error')

        const toCreate: Channel[] = []
        for (const channel of response.channels) {
            if (
                !channel.id ||
                !channel.is_channel ||
                channel.is_archived ||
                !channel.context_team_id
            ) {
                this.logger.error(
                    'channel is not qualified (is not channel, is archived, id not found, channel context team id not found)',
                    channel,
                )
                continue
            }

            const check = await this.channelService.findOneBySlackId(channel.id)
            if (check) {
                //TODO update user when info mismatches
                continue
            }

            const team = await this.teamService.findOneBySlackId(channel.context_team_id)
            if (!team) throw new SlackException('team not found')

            toCreate.push(
                this.channelService.makeChannel({
                    channelId: channel.id,
                    name: channel.name || '',
                    teamId: team.id,
                }),
            )
        }

        await this.channelService.createMany(toCreate)

        return this.channelService.findAll()
    }

    @SlackErrorHandler()
    @Transactional()
    public async fetchUsers() {
        const response = await this.slackBotInstance.client.users.list()
        if (!response.ok || !response.members) throw new SlackException('slack api error')

        const toCreate: User[] = []
        for (const user of response.members) {
            if (
                user.is_bot ||
                user.is_restricted ||
                user.is_ultra_restricted ||
                !user.is_email_confirmed ||
                !user.id ||
                !user.team_id
            ) {
                this.logger.error('user is not qualified', {id: user.id, name: user.name})
                continue
            }

            const check = await this.userService.findBySlackId(user.id)
            if (check) {
                if (
                    check.name !== user.name ||
                    check.realName !== user.real_name ||
                    check.profileImage !== user.profile?.image_original
                ) {
                    await this.userService.update(check.id, {
                        name: check.name,
                        profileImage: user.profile?.image_original || null,
                    })
                }
                continue
            }

            const team = await this.teamService.findOneBySlackId(user.team_id)
            if (!team) throw new SlackException('team not found')

            toCreate.push(
                this.userService.makeUser({
                    slackId: user.id,
                    teamId: team.id,
                    name: user.name || '',
                    realName: user.real_name || '',
                    phone: user.profile?.phone || null,
                    timeZone: user.tz || '',
                    profileImage: user.profile?.image_original || null,
                }),
            )
        }

        await this.userService.createMany(toCreate)

        return this.userService.findAll()
    }
}
