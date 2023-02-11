import {IsNumber, IsOptional, IsString} from 'class-validator'

export class CreateUserDto {
    @IsString()
    slackId: string

    @IsNumber()
    teamId: number

    @IsString()
    name: string

    @IsString()
    realName: string

    @IsOptional()
    @IsString()
    phone: string | null

    @IsString()
    timeZone: string

    @IsOptional()
    @IsString()
    profileImage: string | null
}
