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
    public async create(createMessageDto: CreateMessageDto): Promise<Message> {
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
    public async findAll(): Promise<Message[]> {
        return this.messageRepository.find({order: {id: 'DESC'}})
    }

    @Transactional()
    public async findOne(id: number) {
        return this.messageRepository.findOne({where: {id}, relations: {user: true, team: true}})
    }

    @Transactional()
    public async findOneByTimestampOrFail(timestamp: string) {
        // const result = this.messageRepository.findOne({where: {timestamp}})
        return this.messageRepository.findOneOrFail({
            where: {timestamp},
            relations: {responds: true},
        })
    }

    @Transactional()
    public async findByChannelIdAndTimestamp(
        channelId: string,
        timestamp: string,
    ): Promise<Message | null> {
        return this.messageRepository.findOne({
            where: {timestamp, channel: {channelId: channelId}},
            relations: {user: true, team: true, channel: true},
        })
    }

    @Transactional()
    public async update(id: number, updateMessageDto: UpdateMessageDto) {
        return `This action updates a #${id} message`
    }

    @Transactional()
    public async remove(id: number) {
        return this.messageRepository.softDelete(id)
    }

    @Transactional()
    public async removeByTimestamp(timestamp: string) {
        return this.findOneByTimestampOrFail(timestamp).then(message =>
            this.messageRepository.softRemove(message),
        )
    }
}
