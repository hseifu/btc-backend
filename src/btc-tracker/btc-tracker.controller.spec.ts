import { Test, TestingModule } from '@nestjs/testing'
import { BtcTrackerController } from './btc-tracker.controller'

describe('BtcTrackerController', () => {
  let controller: BtcTrackerController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BtcTrackerController],
    }).compile()

    controller = module.get<BtcTrackerController>(BtcTrackerController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
