import {Injectable} from '@nestjs/common'
import {TypeOrmModuleOptions, TypeOrmOptionsFactory} from '@nestjs/typeorm'
import {AppConfigService} from 'src/config/config.service'

@Injectable()
export class TypeormConfigService implements TypeOrmOptionsFactory {
    constructor(private readonly configService: AppConfigService) {}

    public createTypeOrmOptions(): TypeOrmModuleOptions | Promise<TypeOrmModuleOptions> {
        return {
            ...this.configService.getDBConfig(),
            entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
            keepConnectionAlive: true,
            // dropSchema: true,
        }
    }
}
