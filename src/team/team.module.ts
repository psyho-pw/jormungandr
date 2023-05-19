import {TypeOrmModule} from '@nestjs/typeorm'
import {Module} from '@nestjs/common'
import {TeamService} from './team.service'
import {TeamController} from './team.controller'
import {Team} from './entities/team.entity'
import {AppConfigModule} from '../config/config.module'
import {RespondModule} from '../respond/respond.module'

@Module({
    imports: [TypeOrmModule.forFeature([Team]), AppConfigModule, RespondModule],
    controllers: [TeamController],
    providers: [TeamService],
    exports: [TeamService],
})
export class TeamModule {}
