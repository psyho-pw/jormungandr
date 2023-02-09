import {InjectRepository} from '@nestjs/typeorm'
import {Team} from './entities/team.entity'
import {Injectable} from '@nestjs/common'
import {Transactional} from 'typeorm-transactional'
import {CreateTeamDto} from './dto/create-team.dto'
import {UpdateTeamDto} from './dto/update-team.dto'
import {Repository} from 'typeorm'
import {AppConfigService} from '../config/config.service'
import {QueryDeepPartialEntity} from 'typeorm/query-builder/QueryPartialEntity'

@Injectable()
export class TeamService {
    constructor(@InjectRepository(Team) private readonly teamRepository: Repository<Team>, private readonly configService: AppConfigService) {}

    @Transactional()
    create(createTeamDto: CreateTeamDto) {
        const config = this.configService.getSlackConfig()
        const team = new Team()
        team.teamId = createTeamDto.teamId
        team.name = createTeamDto.name
        team.url = createTeamDto.url
        team.domain = createTeamDto.domain
        team.coreTimeStart = config.CORE_TIME.start
        team.coreTimeEnd = config.CORE_TIME.end
        team.maxRespondTime = config.MAX_RESPOND_TIME

        return this.teamRepository.save(team)
    }

    @Transactional()
    async findBySlackId(id: string) {
        const [team] = await this.teamRepository.findBy({teamId: id})
        return team
    }

    @Transactional()
    findAll() {
        return `This action returns all team`
    }

    @Transactional()
    findOne(id: number) {
        return this.teamRepository.findOneBy({id})
    }

    @Transactional()
    updateTeamBySlackId(id: string, updateTeamDto: UpdateTeamDto) {
        const updateQuery: QueryDeepPartialEntity<Team> = {}
        if (updateTeamDto.coreTimeStart) updateQuery.coreTimeStart = updateTeamDto.coreTimeStart
        if (updateTeamDto.coreTimeEnd) updateQuery.coreTimeEnd = updateTeamDto.coreTimeEnd
        if (updateTeamDto.maxRespondTime) updateQuery.maxRespondTime = updateTeamDto.maxRespondTime

        return this.teamRepository
            .createQueryBuilder()
            .update(Team)
            .set(updateQuery)
            .where('teamId = :teamId', {
                teamId: id,
            })
            .execute()
    }

    @Transactional()
    remove(id: number) {
        return `This action removes a #${id} team`
    }
}
