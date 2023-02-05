import {MessageService} from './../message/message.service'
import {Injectable} from '@nestjs/common'
import {InjectRepository} from '@nestjs/typeorm'
import {Repository} from 'typeorm'
import {CreateUserDto} from './dto/create-user.dto'
import {UpdateUserDto} from './dto/update-user.dto'
import {User} from './entities/user.entity'
import {Transactional} from 'typeorm-transactional'

@Injectable()
export class UserService {
    constructor(@InjectRepository(User) private userRepository: Repository<User>, private readonly messageService: MessageService) {}

    @Transactional()
    create(createUserDto: CreateUserDto) {
        const user = new User()
        user.slackId = createUserDto.slackId
        user.setTeam(createUserDto.teamId)
        user.name = createUserDto.name
        user.realName = createUserDto.realName
        user.phone = createUserDto.phone
        user.timeZone = createUserDto.timeZone
        return this.userRepository.save(user)
    }

    @Transactional()
    findAll(): Promise<User[]> {
        return this.userRepository.find({order: {id: 'DESC'}})
    }

    @Transactional()
    async findBySlackId(id: string): Promise<User | null> {
        return await this.userRepository.findOneBy({slackId: id})
    }

    @Transactional()
    findOne(id: number): Promise<User | null> {
        return this.userRepository.findOneBy({id})
    }

    @Transactional()
    update(id: number, updateUserDto: UpdateUserDto) {
        console.log(updateUserDto)
        return `This action updates a #${id} user`
    }

    @Transactional()
    remove(id: number) {
        return `This action removes a #${id} user`
    }
}
