import {MessageService} from '../message/message.service'
import {Injectable} from '@nestjs/common'
import {InjectRepository} from '@nestjs/typeorm'
import {Repository} from 'typeorm'
import {CreateUserDto} from './dto/create-user.dto'
import {UpdateUserDto} from './dto/update-user.dto'
import {User} from './entities/user.entity'
import {Transactional} from 'typeorm-transactional'

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        private readonly messageService: MessageService,
    ) {}

    public makeUser(createUserDto: CreateUserDto) {
        const user = new User()
        user.slackId = createUserDto.slackId
        user.setTeam(createUserDto.teamId)
        user.name = createUserDto.name
        user.realName = createUserDto.realName
        user.phone = createUserDto.phone
        user.timeZone = createUserDto.timeZone
        user.profileImage = createUserDto.profileImage

        return user
    }

    @Transactional()
    public async create(createUserDto: CreateUserDto) {
        return this.userRepository.save(this.makeUser(createUserDto))
    }

    @Transactional()
    public async createMany(users: User[]) {
        return this.userRepository.insert(users)
    }

    @Transactional()
    public async findAll(): Promise<User[]> {
        return this.userRepository.find({order: {id: 'DESC'}})
    }

    @Transactional()
    public async findBySlackId(id: string): Promise<User | null> {
        return this.userRepository.findOne({where: {slackId: id}, relations: {team: true}})
    }

    @Transactional()
    public async findBySlackIds(ids: string[]): Promise<User[]> {
        return this.userRepository
            .createQueryBuilder('user')
            .where('slackId IN (:id)', {id: ids})
            .leftJoinAndSelect('user.team', 'team')
            .getMany()
    }

    @Transactional()
    public async findOne(id: number): Promise<User | null> {
        return this.userRepository.findOneBy({id})
    }

    @Transactional()
    public async update(id: number, updateUserDto: UpdateUserDto) {
        return this.userRepository.update(id, updateUserDto)
    }

    @Transactional()
    public async remove(id: number) {
        return `This action removes a #${id} user`
    }
}
