import {Team} from './../../team/entities/team.entity'
import {AbstractActorEntity} from 'src/common/abstract.entity'
import {Column, Entity, Index, ManyToOne} from 'typeorm'

@Entity()
export class Channel extends AbstractActorEntity {
    @Index()
    @Column()
    channelId: string

    @Column()
    name: string

    @Index()
    @ManyToOne(() => Team)
    team: Team

    public setTeam(id: number) {
        const team = new Team()
        team.id = id
        this.team = team
    }
}

// Example
// {
//   "id": "C897XN6E4",
//   "name": "general",
//   "is_channel": true,
//   "is_group": false,
//   "is_im": false,
//   "is_mpim": false,
//   "is_private": false,
//   "created": 1512484767,
//   "is_archived": false,
//   "is_general": true,
//   "unlinked": 0,
//   "name_normalized": "general",
//   "is_shared": false,
//   "is_org_shared": false,
//   "is_pending_ext_shared": false,
//   "pending_shared": [],
//   "context_team_id": "T89UJDYTW",
//   "updated": 1558158262792,
//   "parent_conversation": null,
//   "creator": "U89UJDZ44",
//   "is_ext_shared": false,
//   "shared_team_ids": [
//       "T89UJDYTW"
//   ],
//   "pending_connected_team_ids": [],
//   "is_member": true,
//   "topic": {
//       "value": "Company-wide announcements and work-based matters",
//       "creator": "U89UJDZ44",
//       "last_set": 1512484767
//   },
//   "purpose": {
//       "value": "This channel is for workspace-wide communication and announcements. All members are in this channel.",
//       "creator": "U89UJDZ44",
//       "last_set": 1512484767
//   },
//   "previous_names": [],
//   "num_members": 3
// }
