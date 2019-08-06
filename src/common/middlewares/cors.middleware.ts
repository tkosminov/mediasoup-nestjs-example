import { Injectable, NestMiddleware } from '@nestjs/common';
import config from 'config';
import { NextFunction, Request, Response } from 'express';

import { ReqHelper } from '../helpers/req.helper';

const corsSettings = config.get<ICorsSettings>('CORS_SETTINGS');

@Injectable()
export class CorsMiddleware extends ReqHelper implements NestMiddleware {
  constructor() {
    super();
  }

  // tslint:disable-next-line: no-feature-envy
  public use(req: Request & { credentials: string | boolean }, res: Response, next: NextFunction) {
    const origin = this.getOrigin(req);

    const allowedOrigins = corsSettings.allowedOrigins;
    const allowedMethods = corsSettings.allowedMethods;
    const allowedHeaders = corsSettings.allowedHeaders;

    const findOrigin = allowedOrigins.find(o => o === origin);

    if (origin && allowedOrigins.length) {
      res.setHeader('Access-Control-Allow-Origin', findOrigin || allowedOrigins[0]);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(','));
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(','));
    res.setHeader('Access-Control-Allow-Credentials', `${corsSettings.allowedCredentials}`);
    res.setHeader('Access-Control-Max-Age', '1728000');

    return next();
  }
}
