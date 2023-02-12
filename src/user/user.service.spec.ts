import {Test, TestingModule} from '@nestjs/testing'
import {UserService} from './user.service'
import {UserModule} from './user.module'
import {TypeOrmModule} from '@nestjs/typeorm'
import {TypeormConfigService} from '../common/configServices/typeorm.config.service'
import {User} from './entities/user.entity'
import {AppConfigModule} from '../config/config.module'
import {WinstonModule} from 'nest-winston'
import {WinstonConfigService} from '../common/configServices/winston.config.service'
import {DataSource, Repository} from 'typeorm'
import {ModuleMocker, MockFunctionMetadata} from 'jest-mock'
import {addTransactionalDataSource, initializeTransactionalContext} from 'typeorm-transactional'

const moduleMocker = new ModuleMocker(global)
describe('UserService', () => {
    let service: UserService

    const mockUser = new User()
    mockUser.id = 1
    mockUser.createdAt = new Date('2023-02-06 03:19:11.090543')
    mockUser.updatedAt = new Date('2023-02-06 03:19:11.090543')
    mockUser.deletedAt = null
    mockUser.slackId = 'U89UJDZ44'
    mockUser.name = 'ellivga'
    mockUser.realName = '전세호'
    mockUser.phone = null
    mockUser.timeZone = 'Asia/Seoul'
    mockUser.profileImage = null
    // mockUser.setTeam(1)

    beforeAll(async () => {
        initializeTransactionalContext()
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                AppConfigModule,
                TypeOrmModule.forRootAsync({useClass: TypeormConfigService}),
                WinstonModule.forRootAsync({useClass: WinstonConfigService}),
                UserModule,
            ],
        })
            .useMocker(token => {
                if (token === Repository<User>) {
                    console.log('::::::::::::::::::::::::::')
                    return {
                        findOne: jest.fn().mockResolvedValue(mockUser),
                    }
                }
                if (typeof token === 'function') {
                    const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>
                    const Mock = moduleMocker.generateFromMetadata(mockMetadata)
                    return new Mock()
                }
            })
            .compile()
        addTransactionalDataSource(module.get(DataSource))
        service = module.get<UserService>(UserService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined() //
    })

    it('should return user', async () => {
        jest.mock('typeorm-transactional', () => ({
            Transactional: () => () => ({}),
        }))

        const user = await service.findOne(1)
        console.log(user)
        expect(user).toEqual(mockUser)
    })
})
