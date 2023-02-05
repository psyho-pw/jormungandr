import {AbstractActorEntity} from 'src/common/abstract.entity'
import {User} from 'src/user/entities/user.entity'
import {Column, Entity, Index, ManyToOne} from 'typeorm'

@Entity()
export class Message extends AbstractActorEntity {
    @Column()
    messageId: string

    @Column()
    type: string

    @Column({type: 'text'})
    textContent: string

    @ManyToOne(() => User)
    user: number

    @Column()
    timestamp: string

    @Index()
    @Column()
    channelId: string

    @Column({nullable: true})
    channelName: string

    @Column()
    channelType: string

    @Column()
    teamId: string

    constructor(messageId: string, type: string, textContent: string, userId: number, timestamp: string, channelId: string, channelType: string, teamId: string) {
        super()
        this.messageId = messageId
        this.type = type
        this.textContent = textContent
        this.user = userId
        this.timestamp = timestamp
        this.channelId = channelId
        this.channelType = channelType
        this.teamId = teamId
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
