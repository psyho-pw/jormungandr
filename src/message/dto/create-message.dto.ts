import {IsNumber, IsString} from 'class-validator'

export class CreateMessageDto {
    @IsString()
    messageId: string

    @IsString()
    type: string

    @IsString()
    textContent: string

    @IsNumber()
    userId: number

    @IsString()
    timestamp: string

    @IsNumber()
    channelId: number

    @IsString()
    channelName: string

    @IsString()
    channelType: string

    @IsNumber()
    teamId: number
}
