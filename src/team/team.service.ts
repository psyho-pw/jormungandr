import {InjectRepository} from '@nestjs/typeorm'
import {Team} from './entities/team.entity'
import {Injectable} from '@nestjs/common'
import {Transactional} from 'typeorm-transactional'
import {CreateTeamDto} from './dto/create-team.dto'
import {UpdateTeamDto} from './dto/update-team.dto'
import {Repository} from 'typeorm'

@Injectable()
export class TeamService {
    constructor(@InjectRepository(Team) private readonly teamRepository: Repository<Team>) {}

    @Transactional()
    create(createTeamDto: CreateTeamDto) {
        const team = new Team()
        team.teamId = createTeamDto.teamId
        team.name = createTeamDto.name
        team.url = createTeamDto.url
        team.domain = createTeamDto.domain

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
        return `This action returns a #${id} team`
    }

    @Transactional()
    update(id: number, updateTeamDto: UpdateTeamDto) {
        return `This action updates a #${id} team`
    }

    @Transactional()
    remove(id: number) {
        return `This action removes a #${id} team`
    }
}
