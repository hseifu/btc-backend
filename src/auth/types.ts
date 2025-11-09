import { Request } from 'express'

export type Role = 'USER' | 'ADMIN'

export interface JwtAccessPayload {
  id: string
  email: string
  role: Role
  iat?: number
  exp?: number
}

export interface JwtRefreshPayload {
  id: string
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
  name: string
  createdAt: Date
  updatedAt: Date
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
