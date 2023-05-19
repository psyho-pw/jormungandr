import {IsNumber, IsString} from 'class-validator'

export class UpdateRespondDto {
    @IsNumber()
    messageId: number

    @IsNumber()
    userId: number

    @IsString()
    timestamp: string

    // @IsString()
    // slackTeamId: string

    @IsNumber()
    maxRespondTime: number
}
