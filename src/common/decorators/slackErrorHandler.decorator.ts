import {Inject} from '@nestjs/common'
import {DiscordService} from '../../discord/discord.service'
import {GeneralException} from '../exceptions/general.exception'
import {SlackException} from '../exceptions/slack.exception'
import {WINSTON_MODULE_PROVIDER} from 'nest-winston'
import {Logger} from 'winston'

export function SlackErrorHandler(bubble = false) {
    const injectDiscordService = Inject(DiscordService)
    const injectLogger = Inject(WINSTON_MODULE_PROVIDER)

    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        injectDiscordService(target, 'discordService')
        injectLogger(target, 'logger')
        const originMethod = descriptor.value

        descriptor.value = async function (...args: any[]) {
            try {
                return await originMethod.apply(this, args)
            } catch (error) {
                const discordService: DiscordService = this.discordService
                const logger: Logger = this.logger

                let slackException: SlackException

                if (error instanceof GeneralException) slackException = error
                else {
                    slackException = new SlackException(error.message)
                    slackException.stack = error.stack
                }
                slackException.CallMethod = propertyKey
                logger.error(slackException.getCalledFrom(), {stack: error.stack})
                await discordService.sendErrorReport(slackException)

                if (bubble) throw error
            }
        }
    }
}
