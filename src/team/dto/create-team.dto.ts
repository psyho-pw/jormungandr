import {IsString} from 'class-validator'

export class CreateTeamDto {
    @IsString()
    teamId: string

    @IsString()
    name: string

    @IsString()
    url: string

    @IsString()
    domain: string
}
