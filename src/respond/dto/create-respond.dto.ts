import {IsNumber} from 'class-validator'

export class CreateRespondDto {
    @IsNumber()
    teamId: number

    @IsNumber()
    channelId: number

    @IsNumber()
    userId: number

    @IsNumber()
    messageId: number
}
