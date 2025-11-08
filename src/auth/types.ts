import { Request } from 'express'

export type Role = 'USER' | 'ADMIN'

export interface JwtAccessPayload {
  sub: string
  email: string
  role: Role
  iat?: number
  exp?: number
}

export interface JwtRefreshPayload {
  sub: string
  email: string
  iat?: number
  exp?: number
}

export interface Tokens {
  accessToken: string
  refreshToken: string
}

export interface SafeUser {
  id: string
  email: string
  role: Role
}

export type AuthenticatedRequest<TUser> = Request & { user: TUser }

// response DTOs for controller
export interface AuthRegisterResponse {
  user: SafeUser
  accessToken: string
}
export interface AuthLoginResponse {
  user: SafeUser
  accessToken: string
}
export interface AuthRefreshResponse {
  accessToken: string
}
export interface AuthLogoutResponse {
  status: 'ok'
}
