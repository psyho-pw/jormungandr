import {AbstractEntity} from 'src/common/abstract.entity'
import {Team} from 'src/team/entities/team.entity'
import {Column, Entity, Index, ManyToOne, JoinColumn} from 'typeorm'

@Entity()
export class User extends AbstractEntity {
    @Index({unique: true})
    @Column({type: String})
    slackId: string

    @Column({nullable: true})
    teamId: number

    @Index()
    @ManyToOne(() => Team)
    @JoinColumn()
    team: Team

    @Column({type: String})
    name: string

    @Column({type: String})
    realName: string

    @Column({type: String, nullable: true})
    phone!: string | null

    @Column({type: String})
    timeZone: string

    @Column({type: String, nullable: true})
    profileImage: string | null

    public setTeam(id: number) {
        const team = new Team()
        team.id = id
        this.team = team
    }
}

// Example
// {
//   "id": "U89UJDZ44",
//   "team_id": "T89UJDYTW",
//   "name": "ellivga",
//   "deleted": false,
//   "color": "9f69e7",
//   "real_name": "전세호",
//   "tz": "Asia/Seoul",
//   "tz_label": "Korea Standard Time",
//   "tz_offset": 32400,
//   "profile": {
//       "title": "",
//       "phone": "010-2948-4648",
//       "skype": "",
//       "real_name": "전세호",
//       "real_name_normalized": "전세호",
//       "display_name": "",
//       "display_name_normalized": "",
//       "fields": null,
//       "status_text": "",
//       "status_emoji": "",
//       "status_emoji_display_info": [],
//       "status_expiration": 0,
//       "avatar_hash": "25562ba773c4",
//       "image_original": "https://avatars.slack-edge.com/2017-12-07/282336964144_25562ba773c43703a806_original.jpg",
//       "is_custom_image": true,
//       "first_name": "전세호",
//       "last_name": "",
//       "image_24": "https://avatars.slack-edge.com/2017-12-07/282336964144_25562ba773c43703a806_24.jpg",
//       "image_32": "https://avatars.slack-edge.com/2017-12-07/282336964144_25562ba773c43703a806_32.jpg",
//       "image_48": "https://avatars.slack-edge.com/2017-12-07/282336964144_25562ba773c43703a806_48.jpg",
//       "image_72": "https://avatars.slack-edge.com/2017-12-07/282336964144_25562ba773c43703a806_72.jpg",
//       "image_192": "https://avatars.slack-edge.com/2017-12-07/282336964144_25562ba773c43703a806_192.jpg",
//       "image_512": "https://avatars.slack-edge.com/2017-12-07/282336964144_25562ba773c43703a806_512.jpg",
//       "image_1024": "https://avatars.slack-edge.com/2017-12-07/282336964144_25562ba773c43703a806_1024.jpg",
//       "status_text_canonical": "",
//       "team": "T89UJDYTW"
//   },
//   "is_admin": true,
//   "is_owner": true,
//   "is_primary_owner": true,
//   "is_restricted": false,
//   "is_ultra_restricted": false,
//   "is_bot": false,
//   "is_app_user": false,
//   "updated": 1603811217,
//   "is_email_confirmed": true,
//   "who_can_share_contact_card": "EVERYONE"
// }
