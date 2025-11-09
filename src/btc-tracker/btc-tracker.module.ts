import { Module } from '@nestjs/common'
import { BtcTrackerController } from './btc-tracker.controller'
import { BtcTrackerGateway } from './btc-tracker.gateway'
import { BtcTrackerService } from './btc-tracker.service'
import { BtcClient } from './clients/btc.client'

@Module({
  providers: [BtcTrackerService, BtcClient, BtcTrackerGateway],
  controllers: [BtcTrackerController],
  exports: [BtcTrackerService],
})
export class BtcTrackerModule {}
