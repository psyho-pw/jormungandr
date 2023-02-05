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
        const user = new User(createUserDto.slackId, createUserDto.teamId, createUserDto.name, createUserDto.realName, createUserDto.phone, createUserDto.timeZone)
        return this.userRepository.save(user)
    }

    @Transactional()
    findAll() {
        return this.userRepository.find({order: {id: 'DESC'}})
    }

    @Transactional()
    async findBySlackUserId(id: string): Promise<User> {
        const [user] = await this.userRepository.findBy({slackId: id})
        return user
    }

    findOne(id: number) {
        return `This action returns a #${id} user`
    }

    update(id: number, updateUserDto: UpdateUserDto) {
        console.log(updateUserDto)
        return `This action updates a #${id} user`
    }

    remove(id: number) {
        return `This action removes a #${id} user`
    }
}
