import {ObjectLiteral, Repository} from 'typeorm'
import {Channel} from '../../src/channel/entities/channel.entity'
import Mock = jest.Mock

export type MockType<T> = {
    [P in keyof T]?: Mock
}

export function repositoryMockFactory<T extends ObjectLiteral>(entity: T): MockType<Repository<T>> {
    return {
        findOneById: undefined,
        findByIds: undefined,
        get metadata(): Mock {
            return jest.fn()
        },
        clear: undefined,
        count: undefined,
        countBy: undefined,
        createQueryBuilder: undefined,
        decrement: undefined,
        delete: undefined,
        exist: undefined,
        extend: undefined,
        find: undefined,
        findAndCount: undefined,
        findAndCountBy: undefined,
        findBy: undefined,
        findOneBy: jest.fn(entity => entity),
        findOneByOrFail: undefined,
        findOneOrFail: undefined,
        getId: undefined,
        hasId: undefined,
        increment: undefined,
        manager: undefined,
        merge: undefined,
        preload: undefined,
        queryRunner: undefined,
        restore: undefined,
        softDelete: undefined,
        target: undefined,
        update: undefined,
        query: undefined,
        upsert: undefined,
        insert: undefined,
        create: jest.fn().mockResolvedValue(entity),
        recover: jest.fn().mockResolvedValue(entity),
        remove: jest.fn().mockResolvedValue(entity),
        save: jest.fn().mockResolvedValue(entity),
        softRemove: jest.fn().mockResolvedValue(entity),
        findOne: jest.fn(entity => entity),
    }
}
