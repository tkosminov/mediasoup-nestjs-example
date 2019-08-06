import { HttpException, HttpStatus } from '@nestjs/common';

export const throwFORBIDDEN = (msg: string | null = null) => {
  throw new HttpException(
    {
      status: HttpStatus.FORBIDDEN,
      error:
        msg || 'Invalid authorization data specified in the request, or access to the requested resource is forbidden.',
    },
    HttpStatus.FORBIDDEN
  );
};

export const throwUNAUTHORIZED = (msg: string | null = null) => {
  throw new HttpException(
    {
      status: HttpStatus.UNAUTHORIZED,
      error: msg || 'Authorization data was not specified in the request',
    },
    HttpStatus.UNAUTHORIZED
  );
};

export const throwBADREQUEST = (msg: string | null = null) => {
  throw new HttpException(
    {
      status: HttpStatus.BAD_REQUEST,
      error: msg || 'Bad Request',
    },
    HttpStatus.BAD_REQUEST
  );
};

export const throwNOTFOUND = (msg: string | null = null) => {
  throw new HttpException(
    {
      status: HttpStatus.NOT_FOUND,
      error: msg || 'Not Found',
    },
    HttpStatus.NOT_FOUND
  );
};

export const throwMETHODNOTALLOWED = (msg: string | null = null) => {
  throw new HttpException(
    {
      status: HttpStatus.METHOD_NOT_ALLOWED,
      error: msg || 'Method is not allowed access',
    },
    HttpStatus.METHOD_NOT_ALLOWED
  );
};

export const throwINTERNALSERVERERROR = (msg: string | null = null) => {
  throw new HttpException(
    {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: msg || 'Internal server error',
    },
    HttpStatus.INTERNAL_SERVER_ERROR
  );
};

export const throwSERVICEUNAVAILABLE = (msg: string | null = null) => {
  throw new HttpException(
    {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      error: msg || 'Service unvailable',
    },
    HttpStatus.SERVICE_UNAVAILABLE
  );
};
