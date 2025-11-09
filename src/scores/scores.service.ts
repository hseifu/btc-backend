import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateScoreDto } from './dto/update-score.dto'

@Injectable()
export class ScoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.score.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        points: 'desc',
      },
    })
  }

  async findByUserId(userId: string) {
    let score = await this.prisma.score.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    // Auto-create score if it doesn't exist
    if (!score) {
      await this.createForUser(userId)
      score = await this.prisma.score.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })
    }

    return score!
  }

  async createForUser(userId: string) {
    return this.prisma.score.create({
      data: {
        userId,
      },
    })
  }

  async update(userId: string, updateScoreDto: UpdateScoreDto) {
    const score = await this.prisma.score.findUnique({
      where: { userId },
    })

    if (!score) {
      throw new NotFoundException(`Score for user ${userId} not found`)
    }

    return this.prisma.score.update({
      where: { userId },
      data: updateScoreDto,
    })
  }

  async incrementWin(userId: string, pointsToAdd: number = 10) {
    let score = await this.prisma.score.findUnique({
      where: { userId },
    })

    if (!score) {
      score = await this.createForUser(userId)
    }

    return this.prisma.score.update({
      where: { userId },
      data: {
        wins: { increment: 1 },
        points: { increment: pointsToAdd },
      },
    })
  }

  async incrementLoss(userId: string, pointsToDeduct: number = 5) {
    let score = await this.prisma.score.findUnique({
      where: { userId },
    })

    if (!score) {
      score = await this.createForUser(userId)
    }

    return this.prisma.score.update({
      where: { userId },
      data: {
        losses: { increment: 1 },
        points: { decrement: pointsToDeduct },
      },
    })
  }

  async delete(userId: string) {
    const score = await this.prisma.score.findUnique({
      where: { userId },
    })

    if (!score) {
      throw new NotFoundException(`Score for user ${userId} not found`)
    }

    return this.prisma.score.delete({
      where: { userId },
    })
  }
}
