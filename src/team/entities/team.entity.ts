import {AbstractActorEntity} from 'src/common/abstract.entity'
import {Column, Entity, Index} from 'typeorm'

@Entity()
export class Team extends AbstractActorEntity {
    @Index()
    @Column()
    teamId: string

    @Column()
    name: string

    @Column()
    url: string

    @Column()
    domain: string
}

// Example
// {
//   "id": "T89UJDYTW",
//   "name": "PickleCode",
//   "url": "https://picklecode.slack.com/",
//   "domain": "picklecode",
//   "email_domain": "",
//   "icon": {
//       "image_default": true,
//       "image_34": "https://a.slack-edge.com/80588/img/avatars-teams/ava_0018-34.png",
//       "image_44": "https://a.slack-edge.com/80588/img/avatars-teams/ava_0018-44.png",
//       "image_68": "https://a.slack-edge.com/80588/img/avatars-teams/ava_0018-68.png",
//       "image_88": "https://a.slack-edge.com/80588/img/avatars-teams/ava_0018-88.png",
//       "image_102": "https://a.slack-edge.com/80588/img/avatars-teams/ava_0018-102.png",
//       "image_230": "https://a.slack-edge.com/80588/img/avatars-teams/ava_0018-230.png",
//       "image_132": "https://a.slack-edge.com/80588/img/avatars-teams/ava_0018-132.png"
//   },
//   "avatar_base_url": "https://ca.slack-edge.com/",
//   "is_verified": false
// }
