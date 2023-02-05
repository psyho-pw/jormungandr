import {Channel} from 'src/channel/entities/channel.entity'
import {AbstractActorEntity} from 'src/common/abstract.entity'
import {Team} from 'src/team/entities/team.entity'
import {User} from 'src/user/entities/user.entity'
import {Column, Entity, Index, ManyToOne} from 'typeorm'

@Entity()
export class Message extends AbstractActorEntity {
    @Index()
    @Column()
    messageId: string

    @Column()
    type: string

    @Column({type: 'text'})
    textContent: string

    @Index()
    @ManyToOne(() => User)
    user: User

    @Column()
    timestamp: string

    @Index()
    @ManyToOne(() => Channel)
    channel: Channel

    @Column({nullable: true})
    channelName: string

    @Column()
    channelType: string

    @Index()
    @ManyToOne(() => Team)
    team: Team

    public setUser(userId: number) {
        const user = new User()
        user.id = userId
        this.user = user
    }

    public setChannel(channelId: number) {
        const channel = new Channel()
        channel.id = channelId
        this.channel = channel
    }

    public setTeam(teamId: number) {
        const team = new Team()
        team.id = teamId
        this.team = team
    }
}

// Example
//   client_msg_id: 'a4904a20-417b-4870-9c9b-300fdabc5120',
//   type: 'message',
//   text: 'test',
//   user: 'U89UJDZ44',
//   ts: '1675539594.356439',
//   blocks: [ { type: 'rich_text', block_id: 'O0h5', elements: [Array] } ],
//   team: 'T89UJDYTW',
//   channel: 'C04N52W7HCL',
//   event_ts: '1675539594.356439',
//   channel_type: 'channel'
