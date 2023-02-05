import {Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject, BadRequestException} from '@nestjs/common'
import {Observable, throwError} from 'rxjs'
import {catchError} from 'rxjs/operators'
import {WINSTON_MODULE_PROVIDER} from 'nest-winston'
import {Logger} from 'winston'
import {DiscordService} from '../modules/discord/discord.service'

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
    constructor(private discordService: DiscordService, @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            catchError(err => {
                if (err instanceof BadRequestException) return throwError(() => err)

                this.logger.error('Unhandled error occurred', err)
                if (process.env.NODE_ENV === 'production') {
                    this.discordService
                        .sendMessage(err.message, context.getArgs()[0].route.path, [{name: 'stack', value: err.stack.substr(0, 1024)}])
                        .catch(error => this.logger.error('failed to send discord message', {error}))
                }

                return throwError(() => err)
            }),
        )
    }
}
