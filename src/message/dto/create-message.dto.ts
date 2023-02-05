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

    @IsString()
    channelId: string

    @IsString()
    channelName: string

    @IsString()
    channelType: string

    @IsString()
    teamId: string
}
