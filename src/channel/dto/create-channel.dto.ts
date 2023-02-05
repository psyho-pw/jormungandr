import {IsNumber, IsString} from 'class-validator'
export class CreateChannelDto {
    @IsString()
    channelId: string

    @IsString()
    name: string

    @IsNumber()
    teamId: number
}
