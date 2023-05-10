import {DiscordConfig, SlackConfig} from './config.type'
import {Injectable} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {
    AppConfig,
    AuthConfig,
    AwsConfig,
    Configs,
    DBConfig,
    ServerConfig,
} from 'src/config/config.type'

@Injectable()
export class AppConfigService {
    constructor(private readonly configService: ConfigService<Configs>) {}

    get(propertyPath: keyof Configs) {
        return this.configService.get(propertyPath)
    }

    public getAppConfig(): AppConfig {
        return this.configService.getOrThrow('APP')
    }

    public getAuthConfig(): AuthConfig {
        return this.configService.getOrThrow('AUTH')
    }

    public getDBConfig(): DBConfig {
        return this.configService.getOrThrow('DB')
    }

    public getSlackConfig(): SlackConfig {
        return this.configService.getOrThrow('SLACK')
    }

    public getDiscordConfig(): DiscordConfig {
        return this.configService.getOrThrow('DISCORD')
    }

    public getServerConfig(): ServerConfig {
        return this.configService.getOrThrow('SERVER')
    }

    public getAwsConfig(): AwsConfig {
        return this.configService.getOrThrow('AWS')
    }
}
