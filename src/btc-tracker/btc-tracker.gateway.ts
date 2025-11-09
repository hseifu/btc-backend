import { Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { BtcTrackerService } from './btc-tracker.service'

interface BtcPriceData {
  price: number
  priceChangeLast24h: number
  timestamp: Date
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'https://btc-frontend-production.up.railway.app',
    ],
    credentials: true,
  },
  namespace: '/btc',
})
export class BtcTrackerGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(BtcTrackerGateway.name)
  private connectedClients = 0
  private cachedPrice: BtcPriceData | null = null

  constructor(private readonly btcTrackerService: BtcTrackerService) {}

  handleConnection(client: Socket) {
    this.connectedClients++
    this.logger.log(
      `Client connected: ${client.id}. Total clients: ${this.connectedClients}`,
    )

    if (this.cachedPrice) {
      client.emit('btcPrice', this.cachedPrice)
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--
    this.logger.log(
      `Client disconnected: ${client.id}. Total clients: ${this.connectedClients}`,
    )
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async fetchAndBroadcastBtcPrice() {
    // Only fetch if there are connected clients to not waste api calls when there are no clients connected
    if (this.connectedClients === 0) {
      return
    }

    try {
      const priceData = await this.btcTrackerService.getLatestBtcPrice()

      this.cachedPrice = priceData

      this.server.emit('btcPrice', priceData)

      this.logger.debug(
        `Broadcasted BTC price: $${priceData.price.toFixed(2)} to ${this.connectedClients} client(s)`,
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Failed to fetch BTC price: ${errorMessage}`)

      // Emit error to clients
      this.server.emit('btcPriceError', {
        message: 'Failed to fetch BTC price',
        error: errorMessage,
      })
    }
  }
}
