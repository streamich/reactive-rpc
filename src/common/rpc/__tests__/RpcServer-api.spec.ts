import {sampleApi} from './sample-api';
import {RpcServer, RpcServerParams, RpcServerError, RpcServerFromApiParams} from '../RpcServer';
import {of, from, Subject, Observable, Subscriber} from 'rxjs';
import {ReactiveRpcRequestMessage, ReactiveRpcResponseMessage, NotificationMessage, RequestCompleteMessage, RequestDataMessage, RequestErrorMessage, RequestUnsubscribeMessage, ResponseCompleteMessage, ResponseDataMessage, ResponseErrorMessage, ResponseUnsubscribeMessage} from '../../messages/nominal';
import {share, switchMap, take, tap} from 'rxjs/operators';

const setup = (params: Partial<RpcServerFromApiParams> = {}) => {
  const send = jest.fn();
  const subject = new Subject<any>();
  let token: string = '';
  const notify = jest.fn((method: string, request: unknown) => {
    switch (method) {
      case 'setToken': {
        token = String(request);
        return;
      }
    }
  });
  const ctx = {ip: '127.0.0.1'};
  const server = RpcServer.fromApi<any, any>({
    send,
    notify,
    api: sampleApi,
    bufferTime: 0,
    formatError: (error: unknown) => JSON.stringify({error}),
    formatErrorCode: (code: RpcServerError) => JSON.stringify({code}),
    ...params,
  });
  return {server, send, notify, ctx, subject};
};

test('can create server', async () => {
  setup();
});

test('can execute static RPC method', async () => {
  const {server, send} = setup();
  expect(send).toHaveBeenCalledTimes(0);
  server.onMessage(new RequestCompleteMessage(4, 'ping', {}), {});
  expect(send).toHaveBeenCalledTimes(0);
  await new Promise(r => setTimeout(r, 1));
  expect(send).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledWith([new ResponseCompleteMessage(4, 'pong')]);
});
