import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppConfig,
  AuthConfig,
  AwsConfig,
  Configurations,
  DBConfig,
  ServerConfig,
} from 'src/types';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<Configurations>) {}

  get(propertyPath: keyof Configurations) {
    return this.configService.get(propertyPath);
  }

  getAppConfig(): AppConfig {
    return this.configService.getOrThrow('APP');
  }

  getAuthConfig(): AuthConfig {
    return this.configService.getOrThrow('AUTH');
  }

  getDBConfig(): DBConfig {
    return this.configService.getOrThrow('DB');
  }

  getServerConfig(): ServerConfig {
    return this.configService.getOrThrow('SERVER');
  }

  getAwsConfig(): AwsConfig {
    return this.configService.getOrThrow('AWS');
  }
}
