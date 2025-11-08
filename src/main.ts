import { Logger, VersioningType } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const logger = new Logger('Bootstrap')
  app.use(helmet())
  app.enableCors({ origin: ['http://localhost:3000'], credentials: true })
  app.use(cookieParser())

  const configService = app.get(ConfigService)
  const corsAllowedOrigins: string[] = (
    configService.get<string>('CORS_ALLOWED_ORIGINS') || '*'
  ).split(',')

  logger.log('Application starting up...', corsAllowedOrigins)

  // Enable CORS with origins from environment variables
  app.enableCors({
    origin: corsAllowedOrigins,
    credentials: true,
  })

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  })

  app.use(cookieParser())
  await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
