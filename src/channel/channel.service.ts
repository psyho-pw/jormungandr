import {Channel} from './entities/channel.entity'
import {Injectable} from '@nestjs/common'
import {CreateChannelDto} from './dto/create-channel.dto'
import {UpdateChannelDto} from './dto/update-channel.dto'
import {InjectRepository} from '@nestjs/typeorm'
import {Repository} from 'typeorm'
import {Transactional} from 'typeorm-transactional'

@Injectable()
export class ChannelService {
    constructor(@InjectRepository(Channel) private readonly channelRepository: Repository<Channel>) {}

    @Transactional()
    create(createChannelDto: CreateChannelDto) {
        const channel = new Channel()
        channel.channelId = createChannelDto.channelId
        channel.name = createChannelDto.name
        channel.setTeam(createChannelDto.teamId)

        return this.channelRepository.save(channel)
    }

    @Transactional()
    findOneBySlackId(id: string) {
        return this.channelRepository.findOne({where: {channelId: id}, relations: {team: true}})
    }

    @Transactional()
    findByTeamSlackId(teamId: string) {
        return this.channelRepository.find({where: {team: {teamId}}, order: {id: 'ASC'}})
    }

    @Transactional()
    findAll() {
        return `This action returns all channel`
    }

    @Transactional()
    findOne(id: number) {
        return `This action returns a #${id} channel`
    }

    @Transactional()
    update(id: number, updateChannelDto: UpdateChannelDto) {
        return `This action updates a #${id} channel`
    }

    @Transactional()
    remove(id: number) {
        return `This action removes a #${id} channel`
    }
}
