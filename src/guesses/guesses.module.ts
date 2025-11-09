import { Module } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { BtcTrackerModule } from '../btc-tracker/btc-tracker.module'
import { ScoresModule } from '../scores/scores.module'
import { GuessValidationCron } from './guess-validation.cron'
import { GuessesController } from './guesses.controller'
import { GuessesGateway } from './guesses.gateway'
import { GuessesService } from './guesses.service'

@Module({
  imports: [BtcTrackerModule, ScoresModule],
  providers: [
    GuessesService,
    PrismaService,
    GuessValidationCron,
    GuessesGateway,
  ],
  controllers: [GuessesController],
  exports: [GuessesService],
})
export class GuessesModule {}
