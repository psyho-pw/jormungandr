import {AppConfigService} from 'src/config/config.service'
import {NestFactory, Reflector} from '@nestjs/core'
import {WINSTON_MODULE_NEST_PROVIDER} from 'nest-winston'
import {AppModule} from './app.module'
import {ClassSerializerInterceptor, Logger, ValidationPipe} from '@nestjs/common'
import session from 'express-session'
import {NestExpressApplication} from '@nestjs/platform-express'
import helmet from 'helmet'

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule)

    const configService = app.get(AppConfigService)
    const appConfig = configService.getAppConfig()
    const serverConfig = configService.getServerConfig()

    app.set('trust proxy', true)
    app.use(helmet())
    app.use(session(serverConfig.SESSION))
    app.setGlobalPrefix('api')
    app.enableCors(serverConfig.CORS)
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    )
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))
    // app.useGlobalInterceptors(new TransformInterceptor());
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))
    await app.listen(appConfig.PORT)
}

bootstrap().then(() => Logger.verbose(`[${process.env.NODE_ENV}] Listening on port ${process.env.PORT}`))
