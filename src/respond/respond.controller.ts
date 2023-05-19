import {Controller, Get, Post, Body, Patch, Param, Delete, Query} from '@nestjs/common'
import {RespondService} from './respond.service'
import {CreateRespondDto} from './dto/create-respond.dto'
import {UpdateRespondDto} from './dto/update-respond.dto'

@Controller('responds')
export class RespondController {
    constructor(private readonly respondService: RespondService) {}

    @Post()
    create(@Body() createRespondDto: CreateRespondDto) {
        return this.respondService.create(createRespondDto)
    }

    @Get()
    findAll() {
        return this.respondService.findAll()
    }

    @Get('/statistics')
    getStatistics(
        @Query('teamId') teamId: string,
        @Query('year') year: number,
        @Query('month') month: number,
        @Query('limit') limit: number,
    ) {
        return this.respondService.getStatistics(teamId, year, month, limit)
    }

    @Get('/:id')
    findOne(@Param('id') id: string) {
        return this.respondService.findOne(+id)
    }

    @Patch('/:id')
    update(@Param('id') id: string, @Body() updateRespondDto: UpdateRespondDto) {
        return this.respondService.update(updateRespondDto)
    }

    @Delete('/:id')
    remove(@Param('id') id: string) {
        return this.respondService.remove(+id)
    }
}
