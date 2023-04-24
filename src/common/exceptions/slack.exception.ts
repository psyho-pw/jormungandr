import {GeneralException} from './general.exception'
import {SlackService} from '../../slack/slack.service'

export class SlackException extends GeneralException {
    constructor(message: string, callMethod?: string) {
        super(SlackService.name, callMethod ?? '', message)
    }
}
