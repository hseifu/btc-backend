import { Controller, Get } from '@nestjs/common'
import { BtcTrackerService } from './btc-tracker.service'
import { BtcPriceDto } from './dto/btc-price.dto'

@Controller('btc-tracker')
export class BtcTrackerController {
  constructor(private readonly btcTrackerService: BtcTrackerService) {}

  @Get('price')
  async getLatestBtcPrice(): Promise<BtcPriceDto> {
    return this.btcTrackerService.getLatestBtcPrice()
  }
}
