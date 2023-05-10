import {Test, TestingModule} from '@nestjs/testing'
import {RespondController} from './respond.controller'
import {RespondService} from './respond.service'

describe('RespondController', () => {
    let controller: RespondController

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RespondController],
            providers: [RespondService],
        }).compile()

        controller = module.get<RespondController>(RespondController)
    })

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })
})
