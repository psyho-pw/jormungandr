import {IsNumber} from 'class-validator'
import {Team} from '../../team/entities/team.entity'
import {Type} from 'class-transformer'

export class CreateRespondDto {
    @IsNumber()
    teamId: number

    @IsNumber()
    channelId: number

    @IsNumber()
    userId: number

    @IsNumber()
    messageId: number

    @Type(() => Team)
    team: Team
}
