import { Injectable, NotFoundException } from '@nestjs/common'
import { Guess, GuessStatus } from 'generated/prisma/client'
import { BtcTrackerService } from '../btc-tracker/btc-tracker.service'
import { PrismaService } from '../prisma/prisma.service'
import { ScoresService } from '../scores/scores.service'
import { CreateGuessDto } from './dto/create-guess.dto'

@Injectable()
export class GuessesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly btcTrackerService: BtcTrackerService,
    private readonly scoresService: ScoresService,
  ) {}

  async create(userId: string, createGuessDto: CreateGuessDto) {
    console.log('createGuessDto', userId, createGuessDto)
    // Get current BTC price
    const currentPrice = await this.btcTrackerService.getCurrentPrice()

    // Create the guess
    const guess = await this.prisma.guess.create({
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

    // Validation will be handled by the GuessValidationCron service

    return guess
  }

  async findAll() {
    return this.prisma.guess.findMany({
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
  }

  async findByUserId(userId: string) {
    return this.prisma.guess.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findById(id: string) {
    const guess = await this.prisma.guess.findUnique({
      where: { id },
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

    if (!guess) {
      throw new NotFoundException(`Guess with id ${id} not found`)
    }

    return guess
  }

  async validateGuess(guessId: string): Promise<Guess> {
    const guess = await this.findById(guessId)

    if (guess.status !== GuessStatus.PENDING) {
      return guess
    }

    const finalPrice = await this.btcTrackerService.getCurrentPrice()

    const priceWentUp = finalPrice > guess.initialPrice
    const guessedUp = guess.direction === 'UP'
    const won = priceWentUp === guessedUp
    // TODO: What to do when the final price is the same as the initial price?

    const updatedGuess = await this.prisma.guess.update({
      where: { id: guessId },
      data: {
        finalPrice,
        status: won ? GuessStatus.WON : GuessStatus.LOST,
        validatedAt: new Date(),
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

    if (won) {
      await this.scoresService.incrementWin(guess.userId)
    } else {
      await this.scoresService.incrementLoss(guess.userId)
    }

    return updatedGuess
  }

  async getPendingGuesses() {
    return this.prisma.guess.findMany({
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
  }

  async delete(id: string) {
    const guess = await this.findById(id)
    return this.prisma.guess.delete({
      where: { id: guess.id },
    })
  }
}
