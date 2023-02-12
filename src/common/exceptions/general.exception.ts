import {HttpException, HttpStatus} from '@nestjs/common'

export class GeneralException extends HttpException {
    static readonly id = Symbol('GeneralException')
    private readonly callClass: string
    private readonly callMethod: string

    constructor(callClass: string, callMethod: string, message: string, status?: number) {
        super({callClass, callMethod, message}, status || HttpStatus.INTERNAL_SERVER_ERROR)
    }

    public getCallClass(): string {
        return this.callClass
    }

    public getCallMethod(): string {
        return this.callMethod
    }

    public getCalledFrom(): string {
        return `${this.callClass}.${this.callMethod}`
    }
}
