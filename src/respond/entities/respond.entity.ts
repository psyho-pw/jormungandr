import {AbstractEntity} from '../../common/abstract.entity'
import {Column, Entity, Index, ManyToOne} from 'typeorm'
import {User} from '../../user/entities/user.entity'
import {Message} from '../../message/entities/message.entity'
import {Team} from '../../team/entities/team.entity'
import {Channel} from '../../channel/entities/channel.entity'

@Entity()
@Index(['user', 'message', 'timeTaken'], {unique: true})
export class Respond extends AbstractEntity {
    @Index()
    @ManyToOne(() => Team)
    team: Team

    @Index()
    @ManyToOne(() => Channel)
    channel: Channel

    @Index()
    @ManyToOne(() => User)
    user: User

    @Index()
    @ManyToOne(() => Message)
    message: Message

    @Index()
    @Column({nullable: true})
    timestamp: string

    @Column({default: 60 * 5})
    timeTaken: number

    public setUser(userId: number) {
        const user = new User()
        user.id = userId
        this.user = user
    }

    public setTeam(teamId: number) {
        const team = new Team()
        team.id = teamId
        this.team = team
    }

    public setChannel(channelId: number) {
        const channel = new Channel()
        channel.id = channelId
        this.channel = channel
    }

    public setMessage(messageId: number) {
        const message = new Message()
        message.id = messageId
        this.message = message
    }
}
