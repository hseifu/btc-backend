import { Test, TestingModule } from '@nestjs/testing'
import { BtcTrackerService } from '../btc-tracker.service'

describe('BtcTrackerService', () => {
  let service: BtcTrackerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BtcTrackerService],
    }).compile()

    service = module.get<BtcTrackerService>(BtcTrackerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
