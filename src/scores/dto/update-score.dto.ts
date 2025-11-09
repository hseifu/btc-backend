import { IsInt, IsOptional, Min } from 'class-validator'

export class UpdateScoreDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  points?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  wins?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  losses?: number
}
