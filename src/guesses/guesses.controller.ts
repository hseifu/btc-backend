import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import type { AuthenticatedRequest, JwtAccessPayload } from 'src/auth/types'
import { JwtAuthGuard } from '../auth/guards/jwt.guard'
import { CreateGuessDto } from './dto/create-guess.dto'
import { GuessesService } from './guesses.service'

@Controller('guesses')
@UseGuards(JwtAuthGuard)
export class GuessesController {
  constructor(private readonly guessesService: GuessesService) {}

  @Post()
  create(
    @Req() req: AuthenticatedRequest<JwtAccessPayload>,
    @Body() createGuessDto: CreateGuessDto,
  ) {
    return this.guessesService.create(req.user.id, createGuessDto)
  }

  @Get('me')
  findMyGuesses(@Req() req: AuthenticatedRequest<JwtAccessPayload>) {
    return this.guessesService.findByUserId(req.user.id)
  }

  @Get('pending')
  getPendingGuesses() {
    return this.guessesService.getPendingGuesses()
  }

  @Get(':id')
  findById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest<JwtAccessPayload>,
  ) {
    return this.guessesService.findById(id, req.user.id)
  }

  @Post(':id/validate')
  validateGuess(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest<JwtAccessPayload>,
  ) {
    return this.guessesService.validateGuess(id, req.user.id)
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.guessesService.delete(id)
  }
}
