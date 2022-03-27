import type { Connection } from 'mysql2/promise';
import type { NextApiRequest, NextApiResponse } from 'next';

import { Http } from './ajax';
import { connectToDatabase } from './mysql';
import type { RR } from './types';
import { defined } from './types';

export type ResponsePayload<T = unknown> = {
  readonly status: number;
  readonly body: T;
};

const processResponse = async (
  response: NextApiResponse,
  payload: ResponsePayload | Promise<ResponsePayload>
): Promise<void> =>
  Promise.resolve(payload).then((payload) =>
    response.status(payload.status).send(payload.body)
  );

const catchErrors = async (
  promise: Promise<ResponsePayload>
): Promise<ResponsePayload> =>
  promise.catch((error) => {
    console.error(error);
    return { status: Http.SERVER_ERROR, body: error.toString() };
  });

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

type Handler<BODY, QUERY extends string> = (
  payload: Payload<BODY, QUERY>
) => Promise<ResponsePayload>;

export type Payload<BODY, QUERY extends string = never> = {
  readonly body: BODY;
  readonly connection: Connection;
  readonly request: NextApiRequest;
  readonly response: NextApiResponse;
  readonly query: RR<QUERY, string>;
};

export const endpoint =
  <
    DEFINITION extends {
      readonly [METHOD in Method]?: Handler<never, string>;
    }
  >(
    definition: DEFINITION
  ) =>
  async (request: NextApiRequest, response: NextApiResponse) =>
    connectToDatabase().then(async (connection) =>
      processResponse(
        response,
        typeof definition[request.method as Method] === 'function'
          ? catchErrors(
              defined(definition[request.method as Method])({
                connection,
                body: (request.body ?? {}) as never,
                request,
                response,
                query: request.query as never,
              })
            )
          : { status: Http.WRONG_METHDO, body: '' }
      )
    );
