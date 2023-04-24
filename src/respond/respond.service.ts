import {Injectable, NotFoundException} from '@nestjs/common'
import {CreateRespondDto} from './dto/create-respond.dto'
import {UpdateRespondDto} from './dto/update-respond.dto'
import {InjectRepository} from '@nestjs/typeorm'
import {Respond} from './entities/respond.entity'
import {Repository} from 'typeorm'
import {Transactional} from 'typeorm-transactional'
import {AppConfigService} from '../config/config.service'
import {TeamService} from '../team/team.service'

@Injectable()
export class RespondService {
    constructor(
        private readonly configService: AppConfigService,
        private readonly teamService: TeamService,
        @InjectRepository(Respond) private readonly respondRepository: Repository<Respond>,
    ) {}

    makeRespond(createRespondDto: CreateRespondDto) {
        const respond = new Respond()
        respond.setUser(createRespondDto.userId)
        respond.setTeam(createRespondDto.teamId)
        respond.setChannel(createRespondDto.channelId)
        respond.setMessage(createRespondDto.messageId)
        respond.timeTaken = createRespondDto.team.maxRespondTime

        return respond
    }

    @Transactional()
    async create(createRespondDto: CreateRespondDto): Promise<Respond> {
        const team = await this.teamService.findOne(createRespondDto.teamId)
        if (!team) throw new NotFoundException('team not found')

        return this.respondRepository.save(this.makeRespond(createRespondDto))
    }

    @Transactional()
    async createMany(responds: Respond[]) {
        return this.respondRepository.insert(responds)
    }

    findAll() {
        return `This action returns all respond`
    }

    findOne(id: number) {
        return `This action returns a #${id} respond`
    }

    @Transactional()
    findByMessageIdAndUserId(messageId: number, userId: number) {
        return this.respondRepository.findOneBy({message: {id: messageId}, user: {id: userId}})
    }

    @Transactional()
    async update(updateRespondDto: UpdateRespondDto) {
        return this.respondRepository
            .createQueryBuilder()
            .update(Respond)
            .set({timestamp: updateRespondDto.timestamp, timeTaken: updateRespondDto.timeTaken})
            .where('user.id = :userId AND message.id <= :messageId AND timeTaken > :timeTaken', {
                userId: updateRespondDto.userId,
                messageId: updateRespondDto.messageId,
                timeTaken: updateRespondDto.timeTaken,
            })
            .execute()
    }

    @Transactional()
    getStatistics(teamId: string, year: number, month: number) {
        return this.respondRepository.query(
            `
            SELECT *
            FROM (
                SELECT r.*, AVG(r.timeTaken) as average
                FROM respond r JOIN team t on r.teamId = t.id
                WHERE t.teamId = ? AND DATE_FORMAT(STR_TO_DATE(?, '%Y-%m'), '%Y-%m') = DATE_FORMAT(r.createdAt, '%Y-%m')
                GROUP BY r.userId
            ) as avgTable 
            JOIN user on avgTable.userId = user.id
            ORDER BY average, userId
            LIMIT 5;
        `,
            [teamId, `${year}-${month}`],
        )
    }

    remove(id: number) {
        return `This action removes a #${id} respond`
    }
}
