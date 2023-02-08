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

    @Transactional()
    async create(createRespondDto: CreateRespondDto): Promise<Respond> {
        const team = await this.teamService.findOne(createRespondDto.teamId)
        if (!team) throw new NotFoundException('team not found')

        const respond = new Respond()
        respond.setUser(createRespondDto.userId)
        respond.setTeam(createRespondDto.teamId)
        respond.setChannel(createRespondDto.channelId)
        respond.setMessage(createRespondDto.messageId)
        respond.timeTaken = team.maxRespondTime

        return this.respondRepository.save(respond)
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
            .where('user.id = :userId AND message.id = :messageId AND timeTaken > :timeTaken', {
                userId: updateRespondDto.userId,
                messageId: updateRespondDto.messageId,
                timeTaken: updateRespondDto.timeTaken,
            })
            .execute()
    }

    remove(id: number) {
        return `This action removes a #${id} respond`
    }
}
