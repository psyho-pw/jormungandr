import {Injectable} from '@nestjs/common'
import {InjectRepository} from '@nestjs/typeorm'
import {Repository} from 'typeorm'
import {CreateUserDto} from './dto/create-user.dto'
import {UpdateUserDto} from './dto/update-user.dto'
import {User} from './entities/user.entity'

@Injectable()
export class UserService {
    constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

    async create(createUserDto: CreateUserDto) {
        const user = new User(createUserDto.slackId, createUserDto.teamId, createUserDto.name, createUserDto.realName, createUserDto.phone, createUserDto.timeZone)
        const res = await this.userRepository.save(user)
        console.log(res)
        return res
    }

    findAll() {
        return this.userRepository.find({order: {id: 'DESC'}})
    }

    findOne(id: number) {
        return `This action returns a #${id} user`
    }

    update(id: number, updateUserDto: UpdateUserDto) {
        return `This action updates a #${id} user`
    }

    remove(id: number) {
        return `This action removes a #${id} user`
    }
}
