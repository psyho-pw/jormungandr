import {IsNumber, IsString} from 'class-validator'

export class UpdateRespondDto {
    @IsNumber()
    userId: number

    @IsString()
    timestamp: string
}
