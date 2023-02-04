import { AppConfigModule } from './config/config.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WinstonConfigService } from './configServices/winston.config.service';
import { LoggerMiddleware } from './middlewares/logger.middleware';

@Module({
  imports: [
    AppConfigModule,
    WinstonModule.forRootAsync({ useClass: WinstonConfigService }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('/');
  }
}
