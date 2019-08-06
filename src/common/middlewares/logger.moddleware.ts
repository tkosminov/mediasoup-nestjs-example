import { Injectable, NestMiddleware } from '@nestjs/common';
import config from 'config';
import { NextFunction, Request, Response } from 'express';

import { ReqHelper } from '../helpers/req.helper';

import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class LoggerMiddleware extends ReqHelper implements NestMiddleware {
  private readonly _settings: ILogSettings = config.get('LOGGER_SETTINGS');

  constructor(private readonly logger: LoggerService) {
    super();
  }

  public use(req: Request, res: Response, next: NextFunction) {
    const action = this.getUrl(req).split('/')[1];
    if (this._settings.silence.includes(action)) {
      return next();
    }

    req.on('error', (error: Error) => {
      this.logMethodByStatus(error.message, error.stack, req.statusCode);
    });

    res.on('error', (error: Error) => {
      this.logMethodByStatus(error.message, error.stack, res.statusCode);
    });

    res.on('finish', () => {
      const message = {
        path: `${req.method} ${this.getUrl(req)}`,
        referrer: this.getReferrer(req),
        userAgent: this.getUserAgent(req),
        remoteAddress: this.getIp(req),
        status: `${res.statusCode} ${res.statusMessage}`,
      };

      this.logMethodByStatus(message, '', res.statusCode);
    });

    return next();
  }

  // tslint:disable-next-line: no-any
  private logMethodByStatus(message: any, stack: string, statusCode: number = 500) {
    const prefix = 'LoggerMiddleware';
    if (statusCode < 300) {
      return this.logger.info(message, prefix);
    } else if (statusCode < 400) {
      return this.logger.warn(message, prefix);
    } else {
      return this.logger.error(message, stack, prefix);
    }
  }
}
