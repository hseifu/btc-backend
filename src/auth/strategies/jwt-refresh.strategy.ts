import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt'
import { JwtRefreshPayload } from '../types'

export interface RefreshValidated extends JwtRefreshPayload {
  refreshToken: string
}

interface RequestWithCookies extends Request {
  cookies: Record<string, string>
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(cfg: ConfigService) {
    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const cookies = (req as RequestWithCookies).cookies
          return cookies?.refresh_token ?? null
        },
      ]),
      secretOrKey: cfg.get<string>('JWT_REFRESH_SECRET') ?? '',
      passReqToCallback: true,
    }
    super(options)
  }

  validate(req: Request, payload: JwtRefreshPayload): RefreshValidated {
    const cookies = (req as RequestWithCookies).cookies
    const token = cookies?.refresh_token ?? ''
    return { ...payload, refreshToken: token }
  }
}
