import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { Response } from 'express'
import { AuthService } from './auth.service'
import { LoginDto, RegisterDto } from './dto/auth.dto'
import { JwtRefreshGuard } from './guards/jwt-refresh.guard'
import { JwtAuthGuard } from './guards/jwt.guard'
import { LocalAuthGuard } from './guards/local.guard'
import { RefreshValidated } from './strategies/jwt-refresh.strategy'
import type {
  AuthenticatedRequest,
  AuthLoginResponse,
  AuthLogoutResponse,
  AuthRefreshResponse,
  AuthRegisterResponse,
  JwtAccessPayload,
} from './types'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthRegisterResponse> {
    const { user, accessToken, refreshToken } = await this.auth.register(dto)
    this.setRefreshCookie(res, refreshToken)
    return { user, accessToken }
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthLoginResponse> {
    const { accessToken, refreshToken, user } = await this.auth.login(dto)
    this.setRefreshCookie(res, refreshToken)
    return { accessToken, user }
  }

  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  async refresh(
    @Req() req: AuthenticatedRequest<RefreshValidated>,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthRefreshResponse> {
    const { accessToken, refreshToken } = await this.auth.refresh(
      req.user.sub,
      req.user.refreshToken,
    )
    this.setRefreshCookie(res, refreshToken)
    return { accessToken }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() req: AuthenticatedRequest<JwtAccessPayload>,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthLogoutResponse> {
    await this.auth.logout(req.user.sub)
    res.clearCookie('refresh_token')
    return { status: 'ok' }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest<JwtAccessPayload>): JwtAccessPayload {
    return req.user
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/auth',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    })
  }
}
