import {Injectable} from '@nestjs/common'
import {InjectRepository} from '@nestjs/typeorm'
import {Repository} from 'typeorm'
import {Transactional} from 'typeorm-transactional'
import {CreateMessageDto} from './dto/create-message.dto'
import {UpdateMessageDto} from './dto/update-message.dto'
import {Message} from './entities/message.entity'

@Injectable()
export class MessageService {
    constructor(@InjectRepository(Message) private messageRepository: Repository<Message>) {}

    @Transactional()
    async create(createMessageDto: CreateMessageDto) {
        const message = new Message(
            createMessageDto.messageId,
            createMessageDto.type,
            createMessageDto.textContent,
            createMessageDto.userId,
            createMessageDto.timestamp,
            createMessageDto.channelId,
            createMessageDto.channelType,
            createMessageDto.teamId,
        )

        const res = await this.messageRepository.save(message)
        return res
    }

    findAll() {
        return `This action returns all message`
    }

    findOne(id: number) {
        return `This action returns a #${id} message`
    }

    update(id: number, updateMessageDto: UpdateMessageDto) {
        console.log(updateMessageDto)
        return `This action updates a #${id} message`
    }

    remove(id: number) {
        return `This action removes a #${id} message`
    }
}
