import { Test, TestingModule } from '@nestjs/testing'
import { GuessesController } from './guesses.controller'

describe('GuessesController', () => {
  let controller: GuessesController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuessesController],
    }).compile()

    controller = module.get<GuessesController>(GuessesController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
