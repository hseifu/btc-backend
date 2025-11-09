import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt.guard'
import { UpdateScoreDto } from './dto/update-score.dto'
import { ScoresService } from './scores.service'

@Controller('scores')
@UseGuards(JwtAuthGuard)
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.scoresService.findByUserId(userId)
  }

  @Put('user/:userId')
  update(
    @Param('userId') userId: string,
    @Body() updateScoreDto: UpdateScoreDto,
  ) {
    return this.scoresService.update(userId, updateScoreDto)
  }

  @Delete('user/:userId')
  delete(@Param('userId') userId: string) {
    return this.scoresService.delete(userId)
  }

  @Get()
  findAll() {
    return this.scoresService.findAll()
  }
}
