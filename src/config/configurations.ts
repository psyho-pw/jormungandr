import pkg from '../../package.json'
import {Configurations} from '../types'
import micromatch from 'micromatch'

export const configurations = (): Configurations => {
    const currentEnv = process.env.NODE_ENV || 'local'

    const originWhiteList: string[] = JSON.parse(process.env.ORIGIN_WHITELIST || '[]')

    const DB_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.${process.env.DB_PROJECT}.mongodb.net`
    return {
        APP: {
            NAME: pkg.name,
            VERSION: pkg.version,
            DESCRIPTION: pkg.description,
            AUTHORS: pkg.author,
            HOST: process.env.APP_HOST || 'localhost',
            BASE_URL: process.env.API_BASE_URL || 'http://localhost',
            PORT: process.env.PORT || 8081,
            ENV: currentEnv,
        },
        SERVER: {
            SESSION: {
                secret: process.env.SESSION_SECRET || 'orange-secret',
                saveUninitialized: false,
                resave: false,
                rolling: true,
                name: process.env.SESSION_NAME,
                proxy: true,
                cookie: {
                    httpOnly: true,
                    maxAge: parseInt(process.env.SESSION_EXPIRE || '86400000', 10),
                    secure: 'auto',
                    sameSite: 'none',
                },
                // store: MongoStore.create({
                //   dbName: 'dev-orange-db',
                //   collectionName: 'sessionStorage',
                //   mongoUrl: DB_URI,
                // }),
            },
            CORS: {
                origin: (origin, callback) => {
                    const isKnownOrigin = micromatch.isMatch(origin || '', originWhiteList)

                    if (isKnownOrigin || !origin) {
                        return callback(null, true)
                    }

                    callback(new Error(`${origin} is not allowed by CORS`))
                },
                exposedHeaders: ['session-expires'],
                methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
                credentials: true,
            },
        },
        DB: {
            URI: DB_URI,
            DATABASE: process.env.DB_DATABASE || 'NONE',
        },
        SLACK: {
            APP_TOKEN: process.env.SLACK_APP_TOKEN || '',
            TOKEN: process.env.SLACK_TOKEN || '',
        },
        AUTH: {
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        },
        AWS: {
            ACCESS_KEY: process.env.AWS_ACCESS_KEY || '',
            SECRET_KEY: process.env.AWS_SECRET_KEY || '',
            REGION: process.env.AWS_REGION || '',
            SIGNATURE: 'v4',
        },
        FRONT: {
            FRONT_URL: process.env.FRONT_URL || '',
        },
    }
}
