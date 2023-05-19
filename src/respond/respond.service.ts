import {Inject, Injectable} from '@nestjs/common'
import {CreateRespondDto} from './dto/create-respond.dto'
import {UpdateRespondDto} from './dto/update-respond.dto'
import {InjectRepository} from '@nestjs/typeorm'
import {Respond} from './entities/respond.entity'
import {Repository} from 'typeorm'
import {Transactional} from 'typeorm-transactional'
import {AppConfigService} from '../config/config.service'
import {WINSTON_MODULE_PROVIDER} from 'nest-winston'
import {Logger} from 'winston'

@Injectable()
export class RespondService {
    constructor(
        private readonly configService: AppConfigService,
        @InjectRepository(Respond) private readonly respondRepository: Repository<Respond>,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) {}

    public makeRespond(createRespondDto: CreateRespondDto) {
        const respond = new Respond()
        respond.setUser(createRespondDto.userId)
        respond.setTeam(createRespondDto.teamId)
        respond.setChannel(createRespondDto.channelId)
        respond.setMessage(createRespondDto.messageId)
        respond.timeTaken = createRespondDto.team.maxRespondTime

        return respond
    }

    @Transactional()
    public async create(createRespondDto: CreateRespondDto): Promise<Respond> {
        return this.respondRepository.save(this.makeRespond(createRespondDto))
    }

    @Transactional()
    public async createMany(responds: Respond[]) {
        return this.respondRepository.insert(responds)
    }

    public async findAll() {
        return `This action returns all respond`
    }

    public async findOne(id: number) {
        return `This action returns a #${id} respond`
    }

    @Transactional()
    public async findByMessageIdAndUserId(messageId: number, userId: number) {
        return this.respondRepository.findOneBy({message: {id: messageId}, user: {id: userId}})
    }

    @Transactional()
    public async renewMaxRespond(
        teamId: number,
        previousMaxRespondTime: number,
        maxRespondTime: number,
    ) {
        return this.respondRepository
            .createQueryBuilder()
            .update(Respond)
            .set({timeTaken: maxRespondTime})
            .where({timeTaken: previousMaxRespondTime})
            .execute()
    }

    @Transactional()
    public async update(updateRespondDto: UpdateRespondDto) {
        return this.respondRepository.query(
            `
            UPDATE respond
            SET timestamp = ?, timeTaken = ? - (SELECT timestamp FROM message WHERE id = respond.messageId LIMIT 1)
            WHERE userId = ? AND messageId <= ? AND createdAt >= DATE_SUB(NOW(), INTERVAL ? SECOND)
        `,
            [
                updateRespondDto.timestamp,
                updateRespondDto.timestamp,
                updateRespondDto.userId,
                updateRespondDto.messageId,
                updateRespondDto.maxRespondTime,
            ],
        )
        // return this.respondRepository
        //     .createQueryBuilder('respond')
        //     .update(Respond)
        //     .set({
        //         timestamp: updateRespondDto.timestamp,
        //         // timeTaken: updateRespondDto.timeTaken,
        //         timeTaken: () =>
        //             `${+updateRespondDto.timestamp} - (SELECT timestamp FROM message WHERE id = message.id LIMIT 1)`,
        //     })
        //     .where(
        //         `
        //             user.id = :userId
        //             AND message.id <= :messageId
        //             AND createdAt >= DATE_SUB(NOW(), INTERVAL :maxRespondTime SECOND)
        //         `,
        //         {
        //             userId: updateRespondDto.userId,
        //             messageId: updateRespondDto.messageId,
        //             maxRespondTime: team.maxRespondTime,
        //         },
        //     )
        //     .execute()
    }

    @Transactional()
    public async getStatistics(teamId: string, year: number, month: number, limit?: number) {
        return this.respondRepository.query(
            `
            SELECT *
            FROM (
                SELECT r.*, AVG(r.timeTaken) as average
                FROM respond r JOIN team t on r.teamId = t.id
                WHERE r.deletedAt IS NULL AND t.teamId = ? AND DATE_FORMAT(STR_TO_DATE(?, '%Y-%m'), '%Y-%m') = DATE_FORMAT(r.createdAt, '%Y-%m')
                GROUP BY r.userId
            ) as avgTable 
            JOIN user on avgTable.userId = user.id
            ORDER BY average, userId
            LIMIT ?;
        `,
            [teamId, `${year}-${month}`, limit || 3],
        )
    }

    public async remove(id: number) {
        return `This action removes a #${id} respond`
    }

    @Transactional()
    public async resetTimeTaken(slackUserId: string, timestamp: string) {
        const targetRespond = await this.respondRepository.findOne({
            where: {user: {slackId: slackUserId}, message: {timestamp}},
            relations: {team: true},
        })
        if (!targetRespond) {
            this.logger.error(
                `${this.resetTimeTaken.name} - targetRespond not found. this may have been caused by an emoji being removed from a thread message.`,
            )
            return
        }

        return this.respondRepository.update(targetRespond.id, {
            timeTaken: targetRespond.team.maxRespondTime,
        })
    }
}
