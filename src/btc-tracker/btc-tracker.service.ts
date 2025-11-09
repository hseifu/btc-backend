import { Injectable } from '@nestjs/common'
import { BtcClient } from './clients/btc.client'
import { BtcPriceDto } from './dto/btc-price.dto'

@Injectable()
export class BtcTrackerService {
  constructor(private readonly btcClient: BtcClient) {}

  async getLatestBtcPrice(): Promise<BtcPriceDto> {
    const { price, priceChangeLast24h, timestamp } =
      await this.btcClient.getLatestBtcPrice()
    return { price, priceChangeLast24h, timestamp }
  }
}
