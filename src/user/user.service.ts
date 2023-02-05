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
    async create(createUserDto: CreateUserDto) {
        const user = new User(createUserDto.slackId, createUserDto.teamId, createUserDto.name, createUserDto.realName, createUserDto.phone, createUserDto.timeZone)
        const res = await this.userRepository.save(user)

        await this.messageService.create({
            messageId: 'a4904a20-417b-4870-9c9b-300fdabc5120',
            type: 'message',
            textContent: 'test',
            userId: res.id,
            timestamp: '1675539594.356439',
            channelId: 'C04N52W7HCL',
            channelName: '',
            channelType: 'channel',
        })

        return res
    }

    findAll() {
        return this.userRepository.find({order: {id: 'DESC'}})
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
