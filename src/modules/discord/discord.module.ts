import {Module} from '@nestjs/common'
import {DiscordService} from './discord.service'
import {HttpModule} from '@nestjs/axios'

@Module({
    imports: [HttpModule],
    providers: [DiscordService],
    exports: [DiscordService],
})
export class DiscordModule {}
