import 'reflect-metadata'

import { SelectQueryBuilder } from 'typeorm'
import { Item } from '../../Domain/Item/Item'

import { MySQLItemRepository } from './MySQLItemRepository'

describe('MySQLItemRepository', () => {
  let repository: MySQLItemRepository
  let queryBuilder: SelectQueryBuilder<Item>
  let item: Item

  beforeEach(() => {
    queryBuilder = {} as jest.Mocked<SelectQueryBuilder<Item>>

    item = {} as jest.Mocked<Item>

    repository = new MySQLItemRepository()
    jest.spyOn(repository, 'createQueryBuilder')
    repository.createQueryBuilder = jest.fn().mockImplementation(() => queryBuilder)
  })

  it('should find one MFA Extension item by user id', async () => {
    queryBuilder.where = jest.fn().mockReturnThis()
    queryBuilder.getOne = jest.fn().mockReturnValue(item)

    const result = await repository.findMFAExtensionByUserUuid('123')

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'item.user_uuid = :user_uuid AND item.content_type = :content_type AND deleted = :deleted',
      {
        user_uuid: '123',
        content_type: 'SF|MFA',
        deleted: false
      }
    )
    expect(result).toEqual(item)
  })

  it('should find items by all query criteria filled in', async () => {
    queryBuilder.getMany = jest.fn().mockReturnValue([ item ])
    queryBuilder.where = jest.fn()
    queryBuilder.orderBy = jest.fn()

    const result = await repository.findAll({
      userUuid: '1-2-3',
      sortBy: 'updated_at_timestamp',
      sortOrder: 'DESC',
      deleted: false,
      contentType: Item.CONTENT_TYPE_NOTE,
      lastSyncTime: 123,
      syncTimeComparison: '>='
    })

    expect(queryBuilder.where).toHaveBeenCalledTimes(4)
    expect(queryBuilder.where).toHaveBeenNthCalledWith(1, 'item.user_uuid = :userUuid', { userUuid: '1-2-3' })
    expect(queryBuilder.where).toHaveBeenNthCalledWith(2, 'item.deleted = :deleted', { deleted: false })
    expect(queryBuilder.where).toHaveBeenNthCalledWith(3, 'item.content_type = :contentType', { contentType: 'Note' })
    expect(queryBuilder.where).toHaveBeenNthCalledWith(4, 'item.updated_at_timestamp >= :lastSyncTime', { lastSyncTime: 123 })

    expect(queryBuilder.orderBy).toHaveBeenCalledWith('item.updated_at_timestamp', 'DESC')

    expect(result).toEqual([ item ])
  })

  it('should find items by only mandatory query criteria', async () => {
    queryBuilder.getMany = jest.fn().mockReturnValue([ item ])
    queryBuilder.where = jest.fn()
    queryBuilder.orderBy = jest.fn()

    const result = await repository.findAll({
      userUuid: '1-2-3',
      sortBy: 'updated_at_timestamp',
      sortOrder: 'DESC'
    })

    expect(queryBuilder.where).toHaveBeenCalledTimes(1)
    expect(queryBuilder.where).toHaveBeenNthCalledWith(1, 'item.user_uuid = :userUuid', { userUuid: '1-2-3' })

    expect(queryBuilder.orderBy).toHaveBeenCalledWith('item.updated_at_timestamp', 'DESC')

    expect(result).toEqual([ item ])
  })
})
