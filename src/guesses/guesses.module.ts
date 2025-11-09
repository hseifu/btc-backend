import { Module } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { BtcTrackerModule } from '../btc-tracker/btc-tracker.module'
import { ScoresModule } from '../scores/scores.module'
import { GuessesController } from './guesses.controller'
import { GuessesService } from './guesses.service'

@Module({
  imports: [BtcTrackerModule, ScoresModule],
  providers: [GuessesService, PrismaService],
  controllers: [GuessesController],
  exports: [GuessesService],
})
export class GuessesModule {}
