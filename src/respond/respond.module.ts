import {Module} from '@nestjs/common'
import {RespondService} from './respond.service'
import {RespondController} from './respond.controller'
import {TypeOrmModule} from '@nestjs/typeorm'
import {Respond} from './entities/respond.entity'

@Module({
    imports: [TypeOrmModule.forFeature([Respond])],
    controllers: [RespondController],
    providers: [RespondService],
    exports: [RespondService],
})
export class RespondModule {}
