import { Logger } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Guess } from 'generated/prisma/client'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'https://btc-frontend-production.up.railway.app',
    ],
    credentials: true,
  },
  namespace: '/guesses',
})
export class GuessesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(GuessesGateway.name)

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  @SubscribeMessage('subscribeToGuess')
  handleSubscribeToGuess(
    @MessageBody() guessId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`guess:${guessId}`)
    this.logger.log(`Client ${client.id} subscribed to guess ${guessId}`)
    return { event: 'subscribed', data: { guessId } }
  }

  @SubscribeMessage('unsubscribeFromGuess')
  handleUnsubscribeFromGuess(
    @MessageBody() guessId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`guess:${guessId}`)
    this.logger.log(`Client ${client.id} unsubscribed from guess ${guessId}`)
    return { event: 'unsubscribed', data: { guessId } }
  }

  // Method to emit guess validation result to subscribers
  emitGuessValidated(guessId: string, guessData: Guess) {
    this.server.to(`guess:${guessId}`).emit('guessValidated', guessData)
    this.logger.log(`Emitted validation result for guess ${guessId}`)
  }
}
