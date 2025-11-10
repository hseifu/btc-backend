import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Semaphore } from 'async-mutex'
import { GuessStatus } from 'generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { GuessesGateway } from './guesses.gateway'
import { GuessesService } from './guesses.service'

@Injectable()
export class GuessValidationCron {
  private readonly logger = new Logger(GuessValidationCron.name)
  private readonly semaphore = new Semaphore(1)

  constructor(
    private readonly prisma: PrismaService,
    private readonly guessesService: GuessesService,
    private readonly guessesGateway: GuessesGateway,
  ) {}

  // Run every second
  @Cron(CronExpression.EVERY_SECOND)
  async validatePendingGuesses() {
    await this.semaphore.acquire()
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)

    // Find all pending guesses that are older than 1 minute just to be safe :P
    const pendingGuesses = await this.prisma.guess.findMany({
      where: {
        status: GuessStatus.PENDING,
        createdAt: {
          lte: oneMinuteAgo,
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    if (pendingGuesses.length > 0) {
      this.logger.log(
        `Found ${pendingGuesses.length} pending guess(es) to validate`,
      )

      for (const guess of pendingGuesses) {
        try {
          const validatedGuess = await this.guessesService.validateGuess(
            guess.id,
          )
          this.logger.log(`Successfully validated guess ${guess.id}`)

          // Emit WebSocket event to subscribers
          this.guessesGateway.emitGuessValidated(guess.id, validatedGuess)
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
          const stack = error instanceof Error ? error.stack : undefined
          this.logger.error(
            `Failed to validate guess ${guess.id}: ${errorMessage}`,
            stack,
          )
        }
      }
    }
    this.semaphore.release()
  }
}
