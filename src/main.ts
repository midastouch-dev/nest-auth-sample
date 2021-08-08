import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExternalSocketIoAdapter } from './core/adapter/external-socket-io-adapter';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { GlobalConfig } from './shared/types/global-config';
import { RedisIoAdapter } from './core/adapter/redis-io.adapter';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();

  const configService = app.get<ConfigService<GlobalConfig>>(ConfigService);

  app.set('trust proxy', configService.get('PROXY_ENABLED') === 'true');

  if (configService.get('REDIS_ENABLED') === 'true') {
    app.useWebSocketAdapter(
      new RedisIoAdapter(
        configService.get('REDIS_HOST'),
        configService.get('REDIS_PORT'),
        app,
      ),
    );
  } else {
    app.useWebSocketAdapter(new ExternalSocketIoAdapter(app));
  }

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const port = configService.get('PORT') || 3000;

  await app.listen(port);

  const logger = new Logger('NestApplication');

  logger.log(`Server initialized on port ${port}`);
}

bootstrap();
