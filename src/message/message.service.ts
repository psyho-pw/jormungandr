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
    async create(createMessageDto: CreateMessageDto): Promise<Message> {
        const message = new Message()

        message.messageId = createMessageDto.messageId
        message.type = createMessageDto.type
        message.textContent = createMessageDto.textContent
        message.timestamp = createMessageDto.timestamp
        message.channelType = createMessageDto.channelType
        message.setTeam(createMessageDto.teamId)
        message.setChannel(createMessageDto.channelId)
        message.setUser(createMessageDto.userId)
        return this.messageRepository.save(message)
    }

    @Transactional()
    findAll(): Promise<Message[]> {
        return this.messageRepository.find({order: {id: 'DESC'}})
    }

    @Transactional()
    findOne(id: number) {
        return this.messageRepository.findOne({where: {id}, relations: {user: true, team: true}})
    }

    @Transactional()
    findByChannelIdAndTimestamp(channelId: number, timestamp: string): Promise<Message | null> {
        return this.messageRepository.findOne({where: {timestamp, channel: {id: channelId}}, relations: {user: true, team: true}})
    }

    @Transactional()
    update(id: number, updateMessageDto: UpdateMessageDto) {
        console.log(updateMessageDto)
        return `This action updates a #${id} message`
    }

    @Transactional()
    remove(id: number) {
        return `This action removes a #${id} message`
    }
}
