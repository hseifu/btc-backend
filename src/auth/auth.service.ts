import { ForbiddenException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'
import { UsersService } from '../users/users.service'
import { SafeUser, Tokens } from './types'

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private cfg: ConfigService,
  ) {}

  async register(
    email: string,
    password: string,
  ): Promise<{ user: SafeUser } & Tokens> {
    const hash = await argon2.hash(password)
    const user = await this.users.create({ email, hash })
    const tokens = await this.signTokens(user.id, user.email, 'USER')
    await this.setRefreshToken(user.id, tokens.refreshToken)
    return { user: { id: user.id, email: user.email, role: 'USER' }, ...tokens }
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user = await this.users.findByEmail(email)
    if (!user) return null
    const ok = await argon2.verify(user.hash, password)
    return ok ? { id: user.id, email: user.email, role: user.role } : null
  }

  async login(user: {
    id: string
    email: string
    role: string
  }): Promise<Tokens> {
    const tokens = await this.signTokens(user.id, user.email, user.role)
    await this.setRefreshToken(user.id, tokens.refreshToken)
    return tokens
  }

  async refresh(userId: string, refreshToken: string): Promise<Tokens> {
    const user = await this.users.findById(userId)
    if (!user || !user.refreshTokenHash) throw new ForbiddenException()
    const valid = await argon2.verify(user.refreshTokenHash, refreshToken)
    if (!valid) throw new ForbiddenException('Invalid refresh token')
    const tokens = await this.signTokens(user.id, user.email, user.role)
    await this.setRefreshToken(user.id, tokens.refreshToken)
    return tokens
  }

  async logout(userId: string): Promise<void> {
    await this.users.updateRefreshToken(userId, null)
  }

  private async setRefreshToken(userId: string, token: string): Promise<void> {
    const hash = await argon2.hash(token)
    await this.users.updateRefreshToken(userId, hash)
  }

  private async signTokens(
    sub: string,
    email: string,
    role: string,
  ): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub, email, role },
        {
          secret: this.cfg.get('JWT_ACCESS_SECRET'),
          expiresIn: this.cfg.get('JWT_ACCESS_TTL') || '15m',
        },
      ),
      this.jwt.signAsync(
        { sub, email },
        {
          secret: this.cfg.get('JWT_REFRESH_SECRET'),
          expiresIn: this.cfg.get('JWT_REFRESH_TTL') || '7d',
        },
      ),
    ])
    return { accessToken, refreshToken }
  }
}
