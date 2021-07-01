import 'reflect-metadata'

import { SuperAgentRequest, SuperAgentStatic } from 'superagent'
import { Logger } from 'winston'
import { ContentDecoderInterface } from '../../Domain/Item/ContentDecoderInterface'
import { AuthHttpService } from './AuthHttpService'

describe('AuthHttpService', () => {
  let httpClient: SuperAgentStatic
  let request: SuperAgentRequest
  let logger: Logger
  let contentDecoder: ContentDecoderInterface

  const authServerUrl = 'https://auth-server'

  const createService = () => new AuthHttpService(httpClient, authServerUrl, contentDecoder, logger)

  beforeEach(() => {
    request = {} as jest.Mocked<SuperAgentRequest>
    request.query = jest.fn().mockReturnThis()
    request.send = jest.fn().mockReturnThis()

    httpClient = {} as jest.Mocked<SuperAgentStatic>
    httpClient.get = jest.fn().mockReturnValue(request)
    httpClient.put = jest.fn().mockReturnValue(request)

    contentDecoder = {} as jest.Mocked<ContentDecoderInterface>
    contentDecoder.decode = jest.fn().mockReturnValue({ secret: 'decoded-secret' })
    contentDecoder.encode = jest.fn().mockReturnValue('encoded-secret')

    logger = {} as jest.Mocked<Logger>
    logger.debug = jest.fn()
  })

  it('should send a request to auth service in order to get user key params', async () => {
    await createService().getUserKeyParams({
      email: 'test@test.com',
      authenticated: false,
    })

    expect(httpClient.get).toHaveBeenCalledWith('https://auth-server/users/params')
    expect(request.query).toHaveBeenCalledWith({ email: 'test@test.com', authenticated: false })
    expect(request.send).toHaveBeenCalled()
  })

  it('should send a request to auth service in order to save mfa secret', async () => {
    request.send = jest.fn().mockReturnValue({
      body: {
        setting: {
          uuid: '3-4-5',
        },
      },
    })

    expect(await createService().saveUserMFA({
      uuid: '2-3-4',
      userUuid: '1-2-3',
      encodedMfaSecret: 'test',
    })).toEqual({ uuid: '3-4-5' })

    expect(httpClient.put).toHaveBeenCalledWith('https://auth-server/users/1-2-3/mfa')
    expect(request.send).toHaveBeenCalledWith({ value: 'decoded-secret', uuid: '2-3-4' })
  })

  it('should throw an error if sending a request to auth service in order to save mfa secret fails', async () => {
    let error = null

    try {
      await createService().saveUserMFA({
        uuid: '2-3-4',
        userUuid: '1-2-3',
        encodedMfaSecret: 'test',
      })
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should send a request to auth service in order to get user mfa secret', async () => {
    request.send = jest.fn().mockReturnValue({
      body: {
        setting: {
          value: 'top-secret',
        },
      },
    })

    expect(await createService().getUserMFA('1-2-3')).toEqual({ value: 'encoded-secret' })

    expect(httpClient.get).toHaveBeenCalledWith('https://auth-server/users/1-2-3/mfa')
    expect(request.send).toHaveBeenCalled()
  })

  it('should throw an error if sending a request to auth service in order to get user mfa secret fails', async () => {
    let error = null

    try {
      await createService().getUserMFA('1-2-3')
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })
})
