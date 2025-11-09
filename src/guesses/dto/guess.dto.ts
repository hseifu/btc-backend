export enum GuessDirection {
  UP = 'UP',
  DOWN = 'DOWN',
}

export enum GuessStatus {
  PENDING = 'PENDING',
  WON = 'WON',
  LOST = 'LOST',
}

export class GuessDto {
  id: string
  userId: string
  direction: GuessDirection
  status: GuessStatus
  initialPrice: number
  finalPrice: number | null
  createdAt: Date
  updatedAt: Date
  validatedAt: Date | null
}
