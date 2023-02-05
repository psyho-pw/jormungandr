import {IsString} from 'class-validator'

export class CreateUserDto {
    @IsString()
    slackId: string

    @IsString()
    teamId: string

    @IsString()
    name: string

    @IsString()
    realName: string

    @IsString()
    phone: string

    @IsString()
    timeZone: string
}
