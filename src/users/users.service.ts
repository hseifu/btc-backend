import { Injectable } from '@nestjs/common'
import { User } from 'generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { email } })
  }

  async create(data: { email: string; hash: string }): Promise<User> {
    return await this.prisma.user.create({ data })
  }

  async updateRefreshToken(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<User> {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    })
  }

  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { id } })
  }
}
