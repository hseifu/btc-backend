import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'
import { UsersService } from '../users/users.service'
import { LoginDto, RegisterDto } from './dto/auth.dto'
import { Role, SafeUser, Tokens } from './types'

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private cfg: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: SafeUser } & Tokens> {
    const hash = await argon2.hash(dto.password)
    const user = await this.users.create({
      email: dto.email,
      hash,
      name: dto.name,
    })
    return {
      user: user as SafeUser,
      ...(await this.signTokens(user.id, user.email, user.role as Role)),
    }
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user = await this.users.findByEmail(email)
    if (!user) return null
    const ok = await argon2.verify(user.hash, password)
    return ok ? (user as SafeUser) : null
  }

  async login(dto: LoginDto): Promise<{ user: SafeUser } & Tokens> {
    const user = await this.validateUser(dto.email, dto.password)
    if (!user) throw new UnauthorizedException('Invalid credentials')
    return {
      user: user,
      ...(await this.signTokens(user.id, user.email, user.role)),
    }
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
    id: string,
    email: string,
    role: string,
  ): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { id, email, role },
        {
          secret: this.cfg.get('JWT_ACCESS_SECRET'),
          expiresIn: this.cfg.get('JWT_ACCESS_TTL') || '15m',
        },
      ),
      this.jwt.signAsync(
        { id, email },
        {
          secret: this.cfg.get('JWT_REFRESH_SECRET'),
          expiresIn: this.cfg.get('JWT_REFRESH_TTL') || '7d',
        },
      ),
    ])
    return { accessToken, refreshToken }
  }
}
