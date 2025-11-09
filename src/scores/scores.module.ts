import { Module } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ScoresController } from './scores.controller'
import { ScoresService } from './scores.service'

@Module({
  providers: [ScoresService, PrismaService],
  controllers: [ScoresController],
  exports: [ScoresService],
})
export class ScoresModule {}
