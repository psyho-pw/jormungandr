import {AbstractActorEntity} from 'src/common/abstract.entity'
import {User} from 'src/modules/user/entities/user.entity'
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
    userId: User

    @Column()
    timestamp: string

    @Index({unique: true})
    @Column()
    channelId: string

    @Column()
    channelName: string

    @Column()
    channelType: string
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
