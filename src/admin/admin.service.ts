import {Injectable} from '@nestjs/common'
import {SlackService} from '../slack/slack.service'
import {CreateAdminDto} from './dto/create-admin.dto'
import {UpdateAdminDto} from './dto/update-admin.dto'

@Injectable()
export class AdminService {
    constructor(private readonly slackService: SlackService) {}

    create(createAdminDto: CreateAdminDto) {
        return 'This action adds a new admin'
    }

    findAll() {
        this.slackService.findChannels()
        return `This action returns all admin`
    }

    findOne(id: number) {
        return `This action returns a #${id} admin`
    }

    update(id: number, updateAdminDto: UpdateAdminDto) {
        return `This action updates a #${id} admin`
    }

    remove(id: number) {
        return `This action removes a #${id} admin`
    }
}
