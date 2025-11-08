import { Exclude, Expose } from 'class-transformer'
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'
import type { Role } from '../auth/types'

export class CreateUserDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  password!: string

  @IsOptional()
  @IsEnum(['USER', 'ADMIN'])
  role?: Role
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string

  @IsOptional()
  @IsEnum(['USER', 'ADMIN'])
  role?: Role
}

export class UserResponseDto {
  @Expose()
  id!: string

  @Expose()
  email!: string

  @Expose()
  role!: Role

  @Expose()
  createdAt!: Date

  @Expose()
  updatedAt!: Date

  @Exclude()
  hash?: string

  @Exclude()
  refreshTokenHash?: string

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial)
  }
}
