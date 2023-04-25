import {SlackActionMiddlewareArgs, SlackCommandMiddlewareArgs, SlackEventMiddlewareArgs, SlackViewMiddlewareArgs} from '@slack/bolt/dist/types'
import {AllMiddlewareArgs} from '@slack/bolt/dist/types/middleware'

export type CoretimeColumn = 'coreTimeStart' | 'coreTimeEnd'
export type SlackCommandArgs = SlackCommandMiddlewareArgs & AllMiddlewareArgs
export type SlackMessageArgs = SlackEventMiddlewareArgs<'message'> & AllMiddlewareArgs
export type SlackActionArgs = SlackActionMiddlewareArgs & AllMiddlewareArgs & {columnType: CoretimeColumn}

export type SlackReactionAddEventArgs = SlackEventMiddlewareArgs<'reaction_added'> & AllMiddlewareArgs
export type SlackReactionRemoveEventArgs = SlackEventMiddlewareArgs<'reaction_removed'> & AllMiddlewareArgs
export type SlackMessageDeleteEventArgs = SlackEventMiddlewareArgs<'message_deleted'> & AllMiddlewareArgs

export type SlackViewSubmitArgs = SlackViewMiddlewareArgs & AllMiddlewareArgs
