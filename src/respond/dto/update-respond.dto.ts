import {IsNumber, IsString} from 'class-validator'

export class UpdateRespondDto {
    @IsNumber()
    messageId: number

    @IsNumber()
    userId: number

    @IsString()
    timestamp: string

    @IsNumber()
    timeTaken: number
}
