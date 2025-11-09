import { IsEnum, IsNotEmpty } from 'class-validator'

export enum GuessDirection {
  UP = 'UP',
  DOWN = 'DOWN',
}

export class CreateGuessDto {
  @IsNotEmpty()
  @IsEnum(GuessDirection)
  direction: GuessDirection
}
