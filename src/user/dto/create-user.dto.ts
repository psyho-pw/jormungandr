import {IsOptional, IsString} from 'class-validator'

export class CreateUserDto {
    @IsString()
    slackId: string

    @IsString()
    teamId: string

    @IsString()
    name: string

    @IsString()
    realName: string

    @IsOptional()
    @IsString()
    phone: string | null

    @IsString()
    timeZone: string
}
