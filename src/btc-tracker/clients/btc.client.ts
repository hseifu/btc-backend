import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'
import moment from 'moment'

export interface CoinMarketCapQuote {
  price: number
  volume_24h: number
  volume_change_24h: number
  percent_change_1h: number
  percent_change_24h: number
  percent_change_7d: number
  percent_change_30d: number
  percent_change_60d: number
  percent_change_90d: number
  market_cap: number
  market_cap_dominance: number
  fully_diluted_market_cap: number
  last_updated: string
}

export interface CoinMarketCapData {
  id: number
  name: string
  symbol: string
  slug: string
  num_market_pairs: number
  date_added: string
  tags: string[]
  max_supply: number
  circulating_supply: number
  total_supply: number
  is_active: number
  infinite_supply: boolean
  platform: null
  cmc_rank: number
  is_fiat: number
  self_reported_circulating_supply: null
  self_reported_market_cap: null
  tvl_ratio: null
  last_updated: string
  quote: {
    USD: CoinMarketCapQuote
  }
}

export interface CoinMarketCapResponse {
  status: {
    timestamp: string
    error_code: number
    error_message: string | null
    elapsed: number
    credit_count: number
    notice: string | null
  }
  data: {
    [key: string]: CoinMarketCapData
  }
}

@Injectable()
export class BtcClient {
  private readonly logger = new Logger(BtcClient.name)
  private readonly axiosInstance: AxiosInstance

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('BTC_API_KEY')

    this.axiosInstance = axios.create({
      baseURL: 'https://pro-api.coinmarketcap.com/v1',
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        Accept: 'application/json',
      },
    })
  }

  async getLatestBtcPrice(): Promise<{
    price: number
    priceChangeLast24h: number
    timestamp: Date
  }> {
    try {
      const response = await this.axiosInstance.get<CoinMarketCapResponse>(
        '/cryptocurrency/quotes/latest',
        {
          params: {
            symbol: 'BTC',
            convert: 'USD',
          },
        },
      )

      const btcData = response.data.data.BTC
      const price = btcData.quote.USD.price
      const priceChangeLast24h = btcData.quote.USD.volume_change_24h
      const last_updated = btcData.quote.USD.last_updated
      this.logger.log(`Successfully fetched BTC price: $${price}`)
      return {
        price,
        priceChangeLast24h,
        timestamp: moment(last_updated).toDate(),
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      const errorStack = error instanceof Error ? error.stack : undefined

      this.logger.error(
        `Failed to fetch BTC price from CoinMarketCap: ${errorMessage}`,
        errorStack,
      )
      throw new Error(`CoinMarketCap API request failed: ${errorMessage}`)
    }
  }
}
