import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { IStrategyOptions, Strategy } from 'passport-local'
import { AuthService } from '../auth.service'
import { SafeUser } from '../types'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    const options: IStrategyOptions = { usernameField: 'email' }
    super(options)
  }

  async validate(email: string, password: string): Promise<SafeUser> {
    const user = await this.authService.validateUser(email, password)
    if (!user) throw new UnauthorizedException('Invalid credentials')
    // Ensure we only return a SafeUser shape without the password
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || '',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
