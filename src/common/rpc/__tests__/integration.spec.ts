import {sampleApi} from './sample-api';
import {RpcServer, RpcServerError, RpcServerFromApiParams} from '../RpcServer';
import {RpcClient, RpcClientParams} from '../RpcClient';
import {firstValueFrom, lastValueFrom} from 'rxjs';
import {of} from '../../util/of';

const setup = (params: {server?: Partial<RpcServerFromApiParams>, client?: Partial<RpcClientParams>} = {server: {}, client: {}}) => {
  const ctx = {ip: '127.0.0.1'};
  const server = RpcServer.fromApi<any, any>({
    send: (messages) => {
      setTimeout(() => {
        client.onMessages(messages);
      }, 1);
    },
    notify: () => {},
    api: sampleApi,
    bufferSize: 2,
    bufferTime: 1,
    maxActiveCalls: 3,
    formatError: (error: unknown) => {
      if (error instanceof Error) return {message: error.message};
      return error;
    },
    formatErrorCode: (code: RpcServerError) => {
      return {
        message: 'PROTOCOL',
        code,
      };
    },
    ...params.server,
  });
  const client = new RpcClient({
    send: (messages) => {
      setTimeout(() => {
        server.onMessages(messages, ctx);
      }, 1);
    },
    bufferSize: 2,
    bufferTime: 1,
    ...params.client
  });
  return {server, client};
};

test('can execute static PRC method', async () => {
  const {client} = setup();
  const result = await firstValueFrom(client.call('ping', {}));
  expect(result).toBe('pong');
});

test('can execute simple "double" method', async () => {
  const {client} = setup();
  const result = await firstValueFrom(client.call('double', {num: 1.2}));
  expect(result).toEqual({num: 2.4});
});

test('throws error on static RPC error', async () => {
  const {client} = setup();
  const [, error] = await of(firstValueFrom(client.call('error', {})));
  expect(error).toBe('this promise can throw');
});

test('throws error on streaming RPC error', async () => {
  const {client} = setup();
  const [, error] = await of(lastValueFrom(client.call('streamError', {})));
  expect(error).toEqual({"message": "Stream always errors"});
});

test('can receive one value of stream that ends after emitting one value', async () => {
  const {client} = setup();
  const result = await firstValueFrom(client.call('util.info', {}));
  expect(result).toEqual({
    commit: 'AAAAAAAAAAAAAAAAAAA',
    sha1: 'BBBBBBBBBBBBBBBBBBB',
  });
});

test('can execute two request in parallel', async () => {
  const {client} = setup();
  const promise1 = of(firstValueFrom(client.call('double', {num: 1})));
  const promise2 = of(firstValueFrom(client.call('double', {num: 2})));
  const [res1, res2] = await Promise.all([promise1, promise2]);
  expect(res1[0]).toEqual({num: 2});
  expect(res2[0]).toEqual({num: 4});
});

test('enforces max in-flight calls', async () => {
  const {client} = setup();
  const promise1 = of(firstValueFrom(client.call('delay', {})));
  const promise2 = of(firstValueFrom(client.call('delay', {})));
  const promise3 = of(firstValueFrom(client.call('delay', {})));
  const promise4 = of(firstValueFrom(client.call('delay', {})));
  const [res1, res2, res3, res4] = await Promise.all([promise1, promise2, promise3, promise4]);
  expect(res1[0]).toBe('done');
  expect(res2[0]).toBe('done');
  expect(res3[0]).toBe('done');
  expect(res4[1]).toEqual({
    message: 'PROTOCOL',
    code: RpcServerError.TooManyActiveCalls,
  });
});
