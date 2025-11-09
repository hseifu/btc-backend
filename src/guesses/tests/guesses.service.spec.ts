import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { GuessStatus } from 'generated/prisma/client'
import { BtcTrackerService } from '../../btc-tracker/btc-tracker.service'
import { PrismaService } from '../../prisma/prisma.service'
import { ScoresService } from '../../scores/scores.service'
import { CreateGuessDto, GuessDirection } from '../dto/create-guess.dto'
import { GuessesService } from '../guesses.service'

describe('GuessesService', () => {
  let service: GuessesService
  let prismaService: jest.Mocked<PrismaService>
  let btcTrackerService: jest.Mocked<BtcTrackerService>
  let scoresService: jest.Mocked<ScoresService>

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  }

  const mockGuess = {
    id: 'guess-123',
    userId: 'user-123',
    direction: 'UP',
    status: GuessStatus.PENDING,
    initialPrice: 50000,
    finalPrice: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    validatedAt: null,
    user: mockUser,
  }

  beforeEach(async () => {
    const mockPrismaService = {
      guess: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    }

    const mockBtcTrackerService = {
      getCurrentPrice: jest.fn(),
    }

    const mockScoresService = {
      incrementWin: jest.fn(),
      incrementLoss: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuessesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: BtcTrackerService,
          useValue: mockBtcTrackerService,
        },
        {
          provide: ScoresService,
          useValue: mockScoresService,
        },
      ],
    }).compile()

    service = module.get<GuessesService>(GuessesService)
    prismaService = module.get(PrismaService)
    btcTrackerService = module.get(BtcTrackerService)
    scoresService = module.get(ScoresService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const createGuessDto: CreateGuessDto = { direction: GuessDirection.UP }
    const userId = 'user-123'
    const currentPrice = 50000

    it('should successfully create a guess', async () => {
      jest.spyOn(prismaService.guess, 'findFirst').mockResolvedValue(null)
      jest
        .spyOn(btcTrackerService, 'getCurrentPrice')
        .mockResolvedValue(currentPrice)
      jest
        .spyOn(prismaService.guess, 'create')
        .mockResolvedValue(mockGuess as any)

      const result = await service.create(userId, createGuessDto)

      // Should check if there is any existing pending guesses (since this is not allowed)
      expect(prismaService.guess.findFirst).toHaveBeenCalledWith({
        where: {
          status: GuessStatus.PENDING,
          userId,
        },
      })
      expect(btcTrackerService.getCurrentPrice).toHaveBeenCalled()
      expect(prismaService.guess.create).toHaveBeenCalledWith({
        data: {
          userId,
          direction: createGuessDto.direction,
          initialPrice: currentPrice,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })
      expect(result).toEqual(mockGuess)
    })

    it('should throw BadRequestException when user already has a pending guess', async () => {
      jest
        .spyOn(prismaService.guess, 'findFirst')
        .mockResolvedValue(mockGuess as any)

      await expect(service.create(userId, createGuessDto)).rejects.toThrow(
        BadRequestException,
      )
      await expect(service.create(userId, createGuessDto)).rejects.toThrow(
        'You can only have one pending guess at a time',
      )
      expect(btcTrackerService.getCurrentPrice).not.toHaveBeenCalled()
      expect(prismaService.guess.create).not.toHaveBeenCalled()
    })

    it('should use current BTC price as initial price', async () => {
      const btcPrice = 52000
      jest.spyOn(prismaService.guess, 'findFirst').mockResolvedValue(null)
      jest
        .spyOn(btcTrackerService, 'getCurrentPrice')
        .mockResolvedValue(btcPrice)
      jest.spyOn(prismaService.guess, 'create').mockResolvedValue({
        ...mockGuess,
        initialPrice: btcPrice,
      } as any)

      await service.create(userId, createGuessDto)

      expect(prismaService.guess.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            initialPrice: btcPrice,
          }),
        }),
      )
    })

    it('should create guess with DOWN direction', async () => {
      const downGuessDto: CreateGuessDto = { direction: GuessDirection.DOWN }
      jest.spyOn(prismaService.guess, 'findFirst').mockResolvedValue(null)
      jest
        .spyOn(btcTrackerService, 'getCurrentPrice')
        .mockResolvedValue(currentPrice)
      jest.spyOn(prismaService.guess, 'create').mockResolvedValue({
        ...mockGuess,
        direction: GuessDirection.DOWN,
      } as any)

      await service.create(userId, downGuessDto)

      expect(prismaService.guess.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            direction: 'DOWN',
          }),
        }),
      )
    })
  })

  describe('validateGuess', () => {
    const guessId = 'guess-123'

    it('should validate a winning UP guess correctly', async () => {
      const initialPrice = 50000
      const finalPrice = 51000 // Price went UP
      const pendingGuess = {
        ...mockGuess,
        direction: 'UP',
        initialPrice,
        status: GuessStatus.PENDING,
      }
      const wonGuess = {
        ...pendingGuess,
        finalPrice,
        status: GuessStatus.WON,
        validatedAt: new Date(),
      }

      jest
        .spyOn(prismaService.guess, 'findUnique')
        .mockResolvedValue(pendingGuess as any)
      jest
        .spyOn(btcTrackerService, 'getCurrentPrice')
        .mockResolvedValue(finalPrice)
      jest
        .spyOn(prismaService.guess, 'update')
        .mockResolvedValue(wonGuess as any)
      jest
        .spyOn(scoresService, 'incrementWin')
        .mockResolvedValue(undefined as any)

      const result = await service.validateGuess(guessId)

      expect(btcTrackerService.getCurrentPrice).toHaveBeenCalled()
      expect(prismaService.guess.update).toHaveBeenCalledWith({
        where: { id: guessId },
        data: {
          finalPrice,
          status: GuessStatus.WON,
          validatedAt: expect.any(Date),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })
      expect(scoresService.incrementWin).toHaveBeenCalledWith(mockUser.id)
      expect(scoresService.incrementLoss).not.toHaveBeenCalled()
      expect(result.status).toBe(GuessStatus.WON)
    })

    it('should validate a losing UP guess correctly', async () => {
      const initialPrice = 50000
      const finalPrice = 49000 // Price went DOWN
      const pendingGuess = {
        ...mockGuess,
        direction: 'UP',
        initialPrice,
        status: GuessStatus.PENDING,
      }
      const lostGuess = {
        ...pendingGuess,
        finalPrice,
        status: GuessStatus.LOST,
        validatedAt: new Date(),
      }

      jest
        .spyOn(prismaService.guess, 'findUnique')
        .mockResolvedValue(pendingGuess as any)
      jest
        .spyOn(btcTrackerService, 'getCurrentPrice')
        .mockResolvedValue(finalPrice)
      jest
        .spyOn(prismaService.guess, 'update')
        .mockResolvedValue(lostGuess as any)
      jest
        .spyOn(scoresService, 'incrementLoss')
        .mockResolvedValue(undefined as any)

      const result = await service.validateGuess(guessId)

      expect(prismaService.guess.update).toHaveBeenCalledWith({
        where: { id: guessId },
        data: {
          finalPrice,
          status: GuessStatus.LOST,
          validatedAt: expect.any(Date),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })
      expect(scoresService.incrementLoss).toHaveBeenCalledWith(mockUser.id)
      expect(scoresService.incrementWin).not.toHaveBeenCalled()
      expect(result.status).toBe(GuessStatus.LOST)
    })

    it('should validate a winning DOWN guess correctly', async () => {
      const initialPrice = 50000
      const finalPrice = 49000 // Price went DOWN
      const pendingGuess = {
        ...mockGuess,
        direction: 'DOWN',
        initialPrice,
        status: GuessStatus.PENDING,
      }
      const wonGuess = {
        ...pendingGuess,
        finalPrice,
        status: GuessStatus.WON,
        validatedAt: new Date(),
      }

      jest
        .spyOn(prismaService.guess, 'findUnique')
        .mockResolvedValue(pendingGuess as any)
      jest
        .spyOn(btcTrackerService, 'getCurrentPrice')
        .mockResolvedValue(finalPrice)
      jest
        .spyOn(prismaService.guess, 'update')
        .mockResolvedValue(wonGuess as any)
      jest
        .spyOn(scoresService, 'incrementWin')
        .mockResolvedValue(undefined as any)

      const result = await service.validateGuess(guessId)

      expect(prismaService.guess.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: GuessStatus.WON,
          }),
        }),
      )
      expect(scoresService.incrementWin).toHaveBeenCalledWith(mockUser.id)
      expect(scoresService.incrementLoss).not.toHaveBeenCalled()
      expect(result.status).toBe(GuessStatus.WON)
    })

    it('should validate a losing DOWN guess correctly', async () => {
      const initialPrice = 50000
      const finalPrice = 51000 // Price went UP
      const pendingGuess = {
        ...mockGuess,
        direction: 'DOWN',
        initialPrice,
        status: GuessStatus.PENDING,
      }
      const lostGuess = {
        ...pendingGuess,
        finalPrice,
        status: GuessStatus.LOST,
        validatedAt: new Date(),
      }

      jest
        .spyOn(prismaService.guess, 'findUnique')
        .mockResolvedValue(pendingGuess as any)
      jest
        .spyOn(btcTrackerService, 'getCurrentPrice')
        .mockResolvedValue(finalPrice)
      jest
        .spyOn(prismaService.guess, 'update')
        .mockResolvedValue(lostGuess as any)
      jest
        .spyOn(scoresService, 'incrementLoss')
        .mockResolvedValue(undefined as any)

      const result = await service.validateGuess(guessId)

      expect(prismaService.guess.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: GuessStatus.LOST,
          }),
        }),
      )
      expect(scoresService.incrementLoss).toHaveBeenCalledWith(mockUser.id)
      expect(scoresService.incrementWin).not.toHaveBeenCalled()
      expect(result.status).toBe(GuessStatus.LOST)
    })

    it('should return guess without updating if already validated', async () => {
      const validatedGuess = {
        ...mockGuess,
        status: GuessStatus.WON,
        finalPrice: 51000,
        validatedAt: new Date(),
      }
      jest
        .spyOn(prismaService.guess, 'findUnique')
        .mockResolvedValue(validatedGuess as any)

      const result = await service.validateGuess(guessId)

      expect(result).toEqual(validatedGuess)
      expect(btcTrackerService.getCurrentPrice).not.toHaveBeenCalled()
      expect(prismaService.guess.update).not.toHaveBeenCalled()
      expect(scoresService.incrementWin).not.toHaveBeenCalled()
      expect(scoresService.incrementLoss).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when guess does not exist', async () => {
      jest.spyOn(prismaService.guess, 'findUnique').mockResolvedValue(null)

      await expect(service.validateGuess(guessId)).rejects.toThrow(
        NotFoundException,
      )
      await expect(service.validateGuess(guessId)).rejects.toThrow(
        `Guess with id ${guessId} not found`,
      )
    })
  })

  describe('findById', () => {
    const guessId = 'guess-123'

    it('should return a guess when found', async () => {
      jest
        .spyOn(prismaService.guess, 'findUnique')
        .mockResolvedValue(mockGuess as any)

      const result = await service.findById(guessId)

      expect(prismaService.guess.findUnique).toHaveBeenCalledWith({
        where: { id: guessId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })
      expect(result).toEqual(mockGuess)
    })

    it('should throw NotFoundException when guess not found', async () => {
      jest.spyOn(prismaService.guess, 'findUnique').mockResolvedValue(null)

      await expect(service.findById(guessId)).rejects.toThrow(NotFoundException)
      await expect(service.findById(guessId)).rejects.toThrow(
        `Guess with id ${guessId} not found`,
      )
    })
  })

  describe('findByUserId', () => {
    const userId = 'user-123'

    it('should return all guesses for a user ordered by createdAt desc', async () => {
      const mockGuesses = [
        { ...mockGuess, id: 'guess-1' },
        { ...mockGuess, id: 'guess-2' },
      ]
      jest
        .spyOn(prismaService.guess, 'findMany')
        .mockResolvedValue(mockGuesses as any)

      const result = await service.findByUserId(userId)

      expect(prismaService.guess.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: {
          createdAt: 'desc',
        },
      })
      expect(result).toEqual(mockGuesses)
    })

    it('should return empty array when user has no guesses', async () => {
      jest.spyOn(prismaService.guess, 'findMany').mockResolvedValue([])

      const result = await service.findByUserId(userId)

      expect(result).toEqual([])
    })
  })

  describe('findAll', () => {
    it('should return all guesses with user data', async () => {
      const mockGuesses = [
        { ...mockGuess, id: 'guess-1' },
        { ...mockGuess, id: 'guess-2' },
      ]
      jest
        .spyOn(prismaService.guess, 'findMany')
        .mockResolvedValue(mockGuesses as any)

      const result = await service.findAll()

      expect(prismaService.guess.findMany).toHaveBeenCalledWith({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      expect(result).toEqual(mockGuesses)
    })
  })

  describe('getPendingGuesses', () => {
    it('should return only pending guesses', async () => {
      const mockPendingGuesses = [
        { ...mockGuess, id: 'guess-1', status: GuessStatus.PENDING },
        { ...mockGuess, id: 'guess-2', status: GuessStatus.PENDING },
      ]
      jest
        .spyOn(prismaService.guess, 'findMany')
        .mockResolvedValue(mockPendingGuesses as any)

      const result = await service.getPendingGuesses()

      expect(prismaService.guess.findMany).toHaveBeenCalledWith({
        where: {
          status: GuessStatus.PENDING,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })
      expect(result).toEqual(mockPendingGuesses)
    })
  })

  describe('delete', () => {
    const guessId = 'guess-123'

    it('should delete a guess successfully', async () => {
      jest
        .spyOn(prismaService.guess, 'findUnique')
        .mockResolvedValue(mockGuess as any)
      jest
        .spyOn(prismaService.guess, 'delete')
        .mockResolvedValue(mockGuess as any)

      const result = await service.delete(guessId)

      expect(prismaService.guess.findUnique).toHaveBeenCalled()
      expect(prismaService.guess.delete).toHaveBeenCalledWith({
        where: { id: mockGuess.id },
      })
      expect(result).toEqual(mockGuess)
    })

    it('should throw NotFoundException when guess does not exist', async () => {
      jest.spyOn(prismaService.guess, 'findUnique').mockResolvedValue(null)

      await expect(service.delete(guessId)).rejects.toThrow(NotFoundException)
    })
  })
})
