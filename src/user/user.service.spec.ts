import {Test, TestingModule} from '@nestjs/testing'
import {UserService} from './user.service'
import {getRepositoryToken, TypeOrmModule} from '@nestjs/typeorm'
import {TypeormConfigService} from '../common/configServices/typeorm.config.service'
import {User} from './entities/user.entity'
import {AppConfigModule} from '../config/config.module'
import {WinstonModule} from 'nest-winston'
import {WinstonConfigService} from '../common/configServices/winston.config.service'
import {DataSource} from 'typeorm'
import {ModuleMocker} from 'jest-mock'
import {addTransactionalDataSource, initializeTransactionalContext} from 'typeorm-transactional'
import {MessageModule} from '../message/message.module'

const moduleMocker = new ModuleMocker(global)
describe('UserService', () => {
    let module: TestingModule
    let service: UserService
    jest.mock('typeorm-transactional', () => ({
        Transactional: () => () => ({}),
    }))
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

    const mockRepository = () => ({
        findOne: jest.fn().mockResolvedValue(mockUser),
        findOneBy: jest.fn().mockResolvedValue(mockUser),
        save: jest.fn().mockResolvedValue(mockUser),
        create: jest.fn().mockResolvedValue(mockUser),
    })

    beforeAll(async () => {
        initializeTransactionalContext()
        module = await Test.createTestingModule({
            imports: [
                AppConfigModule,
                TypeOrmModule.forRootAsync({useClass: TypeormConfigService}),
                WinstonModule.forRootAsync({useClass: WinstonConfigService}),
                MessageModule,
            ],
            providers: [UserService, {provide: getRepositoryToken(User), useValue: mockRepository()}],
        })
            // .useMocker(token => {
            //     if (token === getRepositoryToken(User)) {
            //         return {
            //             findOne: jest.fn().mockResolvedValue(mockUser),
            //         }
            //     }
            //     if (typeof token === 'function') {
            //         const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>
            //         const Mock = moduleMocker.generateFromMetadata(mockMetadata)
            //         return new Mock()
            //     }
            // })
            .compile()
        addTransactionalDataSource(module.get(DataSource))
        service = module.get<UserService>(UserService)
    })

    afterAll(() => {
        const datasource = module.get(DataSource)
        datasource.destroy()
    })

    it('should be defined', () => {
        expect(service).toBeDefined() //
    })

    it('should return user', async () => {
        const user = await service.findOne(1)
        console.log(user)
        expect(user).toEqual(mockUser)
    })
})
