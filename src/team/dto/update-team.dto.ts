import {PartialType} from '@nestjs/mapped-types'
import {Team} from '../entities/team.entity'

export class UpdateTeamDto extends PartialType(Team) {}
