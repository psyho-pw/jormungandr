import {Injectable} from '@nestjs/common'
import {CreateRespondDto} from './dto/create-respond.dto'
import {UpdateRespondDto} from './dto/update-respond.dto'
import {InjectRepository} from '@nestjs/typeorm'
import {Respond} from './entities/respond.entity'
import {Repository} from 'typeorm'
import {Transactional} from 'typeorm-transactional'
import {User} from '../user/entities/user.entity'

@Injectable()
export class RespondService {
    constructor(@InjectRepository(Respond) private respondRepository: Repository<Respond>) {}

    @Transactional()
    create(createRespondDto: CreateRespondDto): Promise<Respond> {
        const respond = new Respond()
        respond.setUser(createRespondDto.userId)
        respond.setTeam(createRespondDto.teamId)
        respond.setChannel(createRespondDto.channelId)
        respond.setMessage(createRespondDto.messageId)

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
    update(updateRespondDto: UpdateRespondDto) {
        //TODO calculate timestamp

        return this.respondRepository
            .createQueryBuilder()
            .update(Respond)
            .set({timestamp: updateRespondDto.timestamp})
            .where('user.id = :userId AND message.id = :messageId', {userId: updateRespondDto.userId, messageId: updateRespondDto.messageId})
            .execute()
    }

    remove(id: number) {
        return `This action removes a #${id} respond`
    }
}
