import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { CorsMiddleware } from './common/middlewares/cors.middleware';
import { LoggerMiddleware } from './common/middlewares/logger.moddleware';

import { HealthcheckModule } from './healthcheck/healthcheck.module';
import { LoggerModule } from './logger/logger.module';
import { WssModule } from './wss/wss.module';

// tslint:disable: no-unsafe-any
@Module({
  imports: [LoggerModule, HealthcheckModule, WssModule],
  providers: [],
  controllers: [],
})
export class AppModule implements NestModule {
  // tslint:disable-next-line: no-empty
  public configure(consumer: MiddlewareConsumer): void | MiddlewareConsumer {
    consumer.apply(LoggerMiddleware, CorsMiddleware).forRoutes('*');
  }
}
