import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.use(helmet())
  app.enableCors({ origin: ['http://localhost:3000'], credentials: true })
  app.use(cookieParser())
  await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
