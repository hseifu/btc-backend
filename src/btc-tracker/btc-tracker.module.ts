import { Module } from '@nestjs/common'
import { BtcTrackerController } from './btc-tracker.controller'
import { BtcTrackerService } from './btc-tracker.service'
import { BtcClient } from './clients/btc.client'

@Module({
  providers: [BtcTrackerService, BtcClient],
  controllers: [BtcTrackerController],
})
export class BtcTrackerModule {}
