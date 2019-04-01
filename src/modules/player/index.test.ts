import { createPlayer, IPlayer, What, PlayOptions, Next } from './types'
import { PlayerService, IPlayerService, getPlayerServiceLogger } from '.'
import { ChildProcess } from 'child_process'
import {
  IJestLogger,
  getJestLogger,
  snapshotExistingLogger
} from '../winston-jest/index.test'
import { mockApplicationState } from '../../__mocks__/applicationState'
import { getMockSoundService } from '../sounds/__mocks__/soundService'

// tsd creation fail
const createPlayer: createPlayer = require('play-sound')

describe('modules -> player', () => {
  test('has known exports', () => {
    expect(Object.keys(require('.'))).toMatchSnapshot()
  })

  test('getPlayerServiceLogger', () => {
    snapshotExistingLogger(getPlayerServiceLogger())
  })

  describe('playerService', () => {
    const filename = 'this-file-totes-exists.mp3'
    const mockNextInput: jest.Mock = jest.fn()
    const fakePlay = (
      _0: What,
      options?: PlayOptions | Next,
      _2?: Next
    ): ChildProcess => {
      if (typeof options === 'function') {
        options(mockNextInput())
      }

      return jest.fn() as any
    }
    const player: IPlayer = {
      play: fakePlay
    }
    const mockSoundService = getMockSoundService()
    const jestLogger: IJestLogger = getJestLogger()
    const playerService: IPlayerService = new PlayerService(
      player,
      mockSoundService,
      jestLogger.logger
    )

    beforeEach(() => {
      mockSoundService.setIsPathValid(true)
      mockNextInput.mockReturnValue(null)
    })

    test('rejects on invalid file', async () => {
      expect.assertions(3)
      mockSoundService.setIsPathValid(false)

      await expect(
        playerService.playFile(filename, mockApplicationState)
      ).rejects.toMatchSnapshot()

      jestLogger.callsMatchSnapshot()
    })

    test('rejects on playback error', async () => {
      expect.assertions(3)
      mockNextInput.mockReturnValue({ error: 'KHAAAAAAN!' })

      await expect(
        playerService.playFile(filename, mockApplicationState)
      ).rejects.toMatchSnapshot()

      jestLogger.callsMatchSnapshot()
    })

    test('playback happy path', async () => {
      expect.assertions(3)

      await expect(
        playerService.playFile(filename, mockApplicationState)
      ).resolves.toMatchSnapshot()

      jestLogger.callsMatchSnapshot()
    })

    test('singleton works', () => {
      const expected = PlayerService.getInstance()
      const actual = PlayerService.getInstance()

      expect(actual).toBe(expected)
    })
  })
})
