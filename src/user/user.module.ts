import {TypeOrmModule} from '@nestjs/typeorm'
import {Module} from '@nestjs/common'
import {UserService} from './user.service'
import {UserController} from './user.controller'
import {User} from './entities/user.entity'
import {MessageModule} from 'src/message/message.module'

@Module({
    imports: [TypeOrmModule.forFeature([User]), MessageModule],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
