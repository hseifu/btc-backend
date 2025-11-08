import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'

import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt'

import { JwtAccessPayload } from '../types'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(cfg: ConfigService) {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cfg.get<string>('JWT_ACCESS_SECRET') ?? '',
    }
    super(options)
  }
  validate(payload: JwtAccessPayload): JwtAccessPayload {
    return payload
  }
}
