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

    public makeChannel(createChannelDto: CreateChannelDto) {
        const channel = new Channel()
        channel.channelId = createChannelDto.channelId
        channel.name = createChannelDto.name
        channel.setTeam(createChannelDto.teamId)

        return channel
    }

    @Transactional()
    public async create(createChannelDto: CreateChannelDto) {
        return this.channelRepository.save(this.makeChannel(createChannelDto))
    }

    @Transactional()
    public async createMany(channels: Channel[]) {
        return this.channelRepository.insert(channels)
    }

    @Transactional()
    public async findOneBySlackId(id: string) {
        return this.channelRepository.findOne({where: {channelId: id}, relations: {team: true}})
    }

    @Transactional()
    public async findByTeamSlackId(teamId: string) {
        return this.channelRepository.find({where: {team: {teamId}}, order: {id: 'ASC'}})
    }

    @Transactional()
    public async findAll() {
        return `This action returns all channel`
    }

    @Transactional()
    public async findOne(id: number) {
        return `This action returns a #${id} channel`
    }

    @Transactional()
    public async update(id: number, updateChannelDto: UpdateChannelDto) {
        return `This action updates a #${id} channel`
    }

    @Transactional()
    public async remove(id: number) {
        return `This action removes a #${id} channel`
    }
}
