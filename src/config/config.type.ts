import {CorsOptions} from '@nestjs/common/interfaces/external/cors-options.interface'
import {SessionOptions} from 'express-session'
import {Request as ExpressRequest} from 'express'
import {TypeOrmModuleOptions} from '@nestjs/typeorm'

export interface AppConfig {
    NAME: string
    VERSION: string
    DESCRIPTION: string
    AUTHORS: string
    HOST: string
    BASE_URL: string
    PORT: string | number
    ENV: string
}

export interface ServerConfig {
    SESSION: SessionOptions
    CORS: CorsOptions
}

export type DBConfig = TypeOrmModuleOptions

export interface SlackConfig {
    APP_TOKEN: string
    TOKEN: string
    CORE_TIME: {start: number; end: number}
    MAX_RESPOND_TIME: number
}

export interface DiscordConfig {
    WEBHOOK_URL: string
}

export interface AuthConfig {
    GOOGLE_CLIENT_ID?: string
}

export interface AwsConfig {
    ACCESS_KEY: string
    SECRET_KEY: string
    REGION: string
    SIGNATURE: 'v2' | 'v4'
}
export interface Front {
    FRONT_URL: string
}

export interface Configs {
    APP: AppConfig
    SERVER: ServerConfig
    DB: DBConfig
    SLACK: SlackConfig
    DISCORD: DiscordConfig
    AUTH: AuthConfig
    AWS: AwsConfig
    FRONT: Front
}
export interface EmailConfig {
    title: string
    address: Array<string>
    templateFilename: string
    templateData: RandomObject
}

export interface RandomObject {
    [key: string | number]: any
}

export interface User {
    email: string
    password: string
    familyName: string
    givenName: string
    activatedAt: Date | null
}

export interface VerifiedUser {
    session: string
    user?: Omit<User, 'password'>
}

declare module 'express-session' {
    interface SessionData {
        credentials: VerifiedUser
    }
}
export type Request = ExpressRequest
